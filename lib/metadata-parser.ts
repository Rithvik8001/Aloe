const TITLE_MAX_LENGTH = 200;
const FAVICON_URL_MAX_LENGTH = 500;

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&apos;": "'",
  "&#x2F;": "/",
  "&#47;": "/",
};

function decodeHTMLEntities(text: string): string {
  let decoded = text;

  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }

  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

function stripHTMLTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeText(
  text: string,
  maxLength: number = TITLE_MAX_LENGTH
): string {
  let sanitized = stripHTMLTags(text);

  sanitized = decodeHTMLEntities(sanitized);

  sanitized = normalizeWhitespace(sanitized);

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }

  return sanitized;
}

export function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (titleMatch && titleMatch[1]) {
    const title = sanitizeText(titleMatch[1]);
    return title || null;
  }

  const ogTitleMatch = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i
  );

  if (ogTitleMatch && ogTitleMatch[1]) {
    const title = sanitizeText(ogTitleMatch[1]);
    return title || null;
  }

  const twitterTitleMatch = html.match(
    /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i
  );

  if (twitterTitleMatch && twitterTitleMatch[1]) {
    const title = sanitizeText(twitterTitleMatch[1]);
    return title || null;
  }

  return null;
}

export function normalizeUrl(url: string, baseUrl: string): string {
  try {
    const normalized = new URL(url, baseUrl);
    return normalized.href;
  } catch (error) {
    return url;
  }
}

export function extractFavicon(html: string, pageUrl: string): string | null {
  const origin = new URL(pageUrl).origin;

  const iconMatch = html.match(
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["'][^>]*>/i
  );

  if (iconMatch && iconMatch[1]) {
    const faviconUrl = normalizeUrl(iconMatch[1], pageUrl);
    return sanitizeUrl(faviconUrl, FAVICON_URL_MAX_LENGTH);
  }

  const shortcutIconMatch = html.match(
    /<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i
  );

  if (shortcutIconMatch && shortcutIconMatch[1]) {
    const faviconUrl = normalizeUrl(shortcutIconMatch[1], pageUrl);
    return sanitizeUrl(faviconUrl, FAVICON_URL_MAX_LENGTH);
  }

  const appleTouchIconMatch = html.match(
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["'][^>]*>/i
  );

  if (appleTouchIconMatch && appleTouchIconMatch[1]) {
    const faviconUrl = normalizeUrl(appleTouchIconMatch[1], pageUrl);
    return sanitizeUrl(faviconUrl, FAVICON_URL_MAX_LENGTH);
  }

  const defaultFavicon = `${origin}/favicon.ico`;
  return sanitizeUrl(defaultFavicon, FAVICON_URL_MAX_LENGTH);
}

function sanitizeUrl(url: string, maxLength: number): string | null {
  const sanitized = url.trim();

  try {
    const urlObj = new URL(sanitized);

    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return null;
    }

    if (sanitized.length > maxLength) {
      return null;
    }

    return sanitized;
  } catch (error) {
    return null;
  }
}

export interface ParsedMetadata {
  title: string | null;
  favicon: string | null;
}

export function parseMetadata(html: string, pageUrl: string): ParsedMetadata {
  const title = extractTitle(html);

  const favicon = extractFavicon(html, pageUrl);

  return {
    title,
    favicon,
  };
}

export function generateFallbackTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    return sanitizeText(urlObj.hostname, TITLE_MAX_LENGTH);
  } catch (error) {
    return "Untitled Bookmark";
  }
}
