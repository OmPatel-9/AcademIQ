import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<i>$1</i>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function markdownToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  const html: string[] = [];
  let inList = false;
  let listType = "";

  function closeList() {
    if (inList) {
      html.push(listType === "ol" ? "</ol>" : "</ul>");
      inList = false;
      listType = "";
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    const h = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (h) {
      closeList();
      const level = Math.min(h[1].length, 4);
      html.push("<h" + level + ">" + inlineFormat(h[2]) + "</h" + level + ">");
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeList();
      html.push("<hr>");
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.+)/);
    if (bullet) {
      if (!inList || listType !== "ul") {
        closeList();
        html.push("<ul>");
        inList = true;
        listType = "ul";
      }
      html.push("<li>" + inlineFormat(bullet[1]) + "</li>");
      continue;
    }

    const num = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (num) {
      if (!inList || listType !== "ol") {
        closeList();
        html.push("<ol>");
        inList = true;
        listType = "ol";
      }
      html.push("<li>" + inlineFormat(num[1]) + "</li>");
      continue;
    }

    if (!trimmed) {
      closeList();
      html.push("<br>");
      continue;
    }

    closeList();
    html.push("<p>" + inlineFormat(trimmed) + "</p>");
  }

  closeList();

  return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body style=\"font-family:Arial,sans-serif;font-size:11pt;line-height:1.6\">" + html.join("\n") + "</body></html>";
}

export async function POST(request: Request) {
  const providerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  if (!providerToken) {
    return NextResponse.json(
      { error: "Sign in with Google to export documents. If signed in, try signing out and back in." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title || "AcademIQ Study Pack").trim();
  const markdown = String(body?.markdown || "").trim();

  if (!markdown) {
    return NextResponse.json({ error: "Markdown content is required." }, { status: 400 });
  }

  const htmlContent = markdownToHtml(markdown);

  try {
    const boundary = "academiq_boundary_" + Date.now();
    const metadata = JSON.stringify({
      name: title,
      mimeType: "application/vnd.google-apps.document"
    });

    const multipartBody =
      "--" + boundary + "\r\n" +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      metadata + "\r\n" +
      "--" + boundary + "\r\n" +
      "Content-Type: text/html; charset=UTF-8\r\n\r\n" +
      htmlContent + "\r\n" +
      "--" + boundary + "--";

    const driveUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink";

    const response = await fetch(driveUrl, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + providerToken,
        "Content-Type": "multipart/related; boundary=" + boundary
      },
      body: multipartBody
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const message = (detail as any)?.error?.message || "Google Drive API request failed.";

      console.error("Google Drive API error:", response.status, message);

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: `Google API error (${response.status}): ${message}` },
          { status: 401 }
        );
      }

      return NextResponse.json({ error: message }, { status: response.status });
    }

    const result = await response.json();
    const url = (result as any).webViewLink || "https://docs.google.com/document/d/" + (result as any).id + "/edit";

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Google Doc creation failed." },
      { status: 500 }
    );
  }
}
