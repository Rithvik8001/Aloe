import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchMetadataSchema } from "@/lib/validations";
import {
  secureFetch,
  URLSecurityError,
  validateUrlSecurity,
} from "@/lib/url-security";
import { parseMetadata, generateFallbackTitle } from "@/lib/metadata-parser";
import { checkUserRateLimit } from "@/lib/rate-limiter";
import { logSecurityEvent, logFetchAttempt } from "@/lib/security-logger";

const MAX_CONTENT_SIZE =
  parseInt(process.env.BOOKMARK_MAX_CONTENT_SIZE || "0") || 1048576;
const FETCH_TIMEOUT =
  parseInt(process.env.BOOKMARK_FETCH_TIMEOUT || "0") || 10000;

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitPassed = await checkUserRateLimit(user.id);
    if (!rateLimitPassed) {
      logSecurityEvent({
        type: "RATE_LIMIT_EXCEEDED",
        userId: user.id,
        url: "",
        reason: "User exceeded rate limit for metadata fetch",
      });

      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = fetchMetadataSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { url } = validation.data;

    try {
      await validateUrlSecurity(url);
    } catch (error) {
      if (error instanceof URLSecurityError) {
        logSecurityEvent({
          type: "SSRF_ATTEMPT",
          userId: user.id,
          url,
          reason: error.message,
        });

        return NextResponse.json(
          {
            error: "This URL cannot be accessed for security reasons.",
          },
          { status: 400 }
        );
      }

      throw error;
    }

    let finalUrl: string;
    let response: Response;

    try {
      const fetchResult = await secureFetch(url, {
        timeout: FETCH_TIMEOUT,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Aloe-Bookmark-Bot/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      finalUrl = fetchResult.finalUrl;
      response = fetchResult.response;
    } catch (error) {
      if (error instanceof URLSecurityError) {
        logSecurityEvent({
          type: "SSRF_ATTEMPT",
          userId: user.id,
          url,
          reason: error.message,
        });

        logFetchAttempt(url, user.id, false);

        if (error.message.includes("timed out")) {
          return NextResponse.json(
            {
              error:
                "Request timed out. The website may be slow or unavailable.",
            },
            { status: 408 }
          );
        }

        return NextResponse.json(
          {
            error: "Failed to fetch URL metadata.",
          },
          { status: 400 }
        );
      }

      logFetchAttempt(url, user.id, false);

      return NextResponse.json(
        {
          error: "Failed to fetch URL metadata. Please try again.",
        },
        { status: 500 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      logSecurityEvent({
        type: "CONTENT_TYPE_VIOLATION",
        userId: user.id,
        url: finalUrl,
        reason: `Invalid content type: ${contentType}`,
      });

      return NextResponse.json(
        {
          error: "URL does not point to a valid HTML page.",
        },
        { status: 400 }
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        {
          error: "Failed to read response body.",
        },
        { status: 500 }
      );
    }

    let html = "";
    let totalSize = 0;
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        totalSize += value.length;

        if (totalSize > MAX_CONTENT_SIZE) {
          logSecurityEvent({
            type: "SIZE_LIMIT_EXCEEDED",
            userId: user.id,
            url: finalUrl,
            reason: `Content size exceeded ${MAX_CONTENT_SIZE} bytes`,
          });

          return NextResponse.json(
            {
              error: "Content size too large.",
            },
            { status: 413 }
          );
        }

        html += decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }

    const metadata = parseMetadata(html, finalUrl);

    const title = metadata.title || generateFallbackTitle(finalUrl);

    logFetchAttempt(finalUrl, user.id, true);

    return NextResponse.json({
      title,
      favicon: metadata.favicon,
      url: finalUrl,
    });
  } catch (error) {
    console.error("Error in fetch-metadata API:", error);

    return NextResponse.json(
      {
        error: "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
