import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

function extractDocUrl(value: unknown) {
  const text = JSON.stringify(value);
  const match = text.match(/https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+(?:\/[^\s"')\\]*)?/);
  return match?.[0]?.replace(/[.,)]$/, "") || "";
}

export async function POST(request: Request) {
  const apiKey = process.env.COMPOSIO_API_KEY;
  const connectedAccountId = process.env.COMPOSIO_CONNECTED_ACCOUNT_ID;
  if (!apiKey || !connectedAccountId) {
    return NextResponse.json(
      {
        error:
          "Google Docs export needs COMPOSIO_API_KEY and COMPOSIO_CONNECTED_ACCOUNT_ID in Vercel environment variables."
      },
      { status: 501 }
    );
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title || "AcademIQ Study Pack").trim();
  const markdown = String(body?.markdown || "").trim();
  if (!markdown) {
    return NextResponse.json({ error: "Markdown content is required." }, { status: 400 });
  }

  const response = await fetch(
    "https://backend.composio.dev/api/v2/actions/GOOGLEDOCS_CREATE_DOCUMENT_MARKDOWN/execute",
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        connectedAccountId,
        input: {
          title,
          markdown_text: markdown
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.successful === false) {
    return NextResponse.json(
      { error: payload?.error || "Google Doc creation failed." },
      { status: response.status || 500 }
    );
  }

  const url = extractDocUrl(payload);
  if (!url) {
    return NextResponse.json({ error: "Document was created, but no URL was returned." }, { status: 502 });
  }

  return NextResponse.json({ url });
}
