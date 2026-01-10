import dns from "node:dns/promises";

export class URLSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "URLSecurityError";
  }
}

export function validateUrlProtocol(url: string): void {
  const urlObj = new URL(url);
  const protocol = urlObj.protocol.toLowerCase();

  if (protocol !== "http:" && protocol !== "https:") {
    throw new URLSecurityError(
      `Invalid protocol: ${protocol}. Only HTTP and HTTPS are allowed.`
    );
  }
}

export function isPrivateIP(ip: string): boolean {
  const cleanIP = ip.replace(/^\[|\]$/g, "");

  const ipv4Patterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\.0\.0\.0$/,
    /^255\.255\.255\.255$/,
  ];

  const ipv6Patterns = [
    /^::1$/,
    /^::$/,
    /^::ffff:127\./,
    /^fe80:/,
    /^fc00:/,
    /^fd00:/,
  ];

  for (const pattern of ipv4Patterns) {
    if (pattern.test(cleanIP)) {
      return true;
    }
  }

  for (const pattern of ipv6Patterns) {
    if (pattern.test(cleanIP)) {
      return true;
    }
  }

  return false;
}

export function validateHostname(hostname: string): void {
  const lowerHostname = hostname.toLowerCase();

  const localhostVariants = [
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
  ];

  if (localhostVariants.includes(lowerHostname)) {
    throw new URLSecurityError(
      `Hostname "${hostname}" is not allowed for security reasons.`
    );
  }

  const blockedTLDs = [".local", ".internal", ".localhost"];
  for (const tld of blockedTLDs) {
    if (lowerHostname.endsWith(tld)) {
      throw new URLSecurityError(
        `TLD "${tld}" is not allowed for security reasons.`
      );
    }
  }

  if (isPrivateIP(lowerHostname)) {
    throw new URLSecurityError(
      `Private IP addresses are not allowed for security reasons.`
    );
  }
}

export async function resolveAndValidateDNS(hostname: string): Promise<void> {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^[\da-fA-F:]+$/;

  if (ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new URLSecurityError(
        "Private IP addresses are not allowed for security reasons."
      );
    }
    return;
  }

  try {
    const addresses = await dns.resolve(hostname);
    for (const ip of addresses) {
      if (isPrivateIP(ip)) {
        throw new URLSecurityError(
          `Hostname "${hostname}" resolves to a private IP address and is not allowed.`
        );
      }
    }
  } catch (error) {
    if (error instanceof URLSecurityError) {
      throw error;
    }
    console.warn(
      `DNS resolution failed for ${hostname}, proceeding with fetch:`,
      error
    );
  }
}

export async function validateUrlSecurity(url: string): Promise<void> {
  let urlObj: URL;

  try {
    urlObj = new URL(url);
  } catch (error) {
    throw new URLSecurityError("Invalid URL format.");
  }
  validateUrlProtocol(url);
  validateHostname(urlObj.hostname);
  await resolveAndValidateDNS(urlObj.hostname);
}

export async function secureFetch(
  initialUrl: string,
  options: RequestInit & { timeout?: number; maxRedirects?: number } = {}
): Promise<{ response: Response; finalUrl: string; redirectCount: number }> {
  const { timeout = 10000, maxRedirects = 5, ...fetchOptions } = options;

  let currentUrl = initialUrl;
  let redirectCount = 0;

  await validateUrlSecurity(currentUrl);

  while (redirectCount <= maxRedirects) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(currentUrl, {
        ...fetchOptions,
        signal: controller.signal,
        redirect: "manual",
      });

      clearTimeout(timeoutId);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");

        if (!location) {
          throw new URLSecurityError(
            "Redirect response missing Location header."
          );
        }
        const redirectUrl = new URL(location, currentUrl).href;
        redirectCount++;

        if (redirectCount > maxRedirects) {
          throw new URLSecurityError(
            `Too many redirects (max ${maxRedirects} allowed).`
          );
        }
        await validateUrlSecurity(redirectUrl);

        currentUrl = redirectUrl;
        continue;
      }

      return {
        response,
        finalUrl: currentUrl,
        redirectCount,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new URLSecurityError(
          "Request timed out. The server did not respond in time."
        );
      }

      if (error instanceof URLSecurityError) {
        throw error;
      }

      throw new URLSecurityError(
        `Failed to fetch URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  throw new URLSecurityError("Unexpected error in redirect handling.");
}
