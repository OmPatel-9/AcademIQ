import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseBase() {
  return (process.env.SUPABASE_URL || "").replace(/\/rest\/v1$/, "").replace(/\/$/, "");
}

export async function GET(request: Request) {
  const base = supabaseBase();
  const origin = new URL(request.url).origin;

  if (!base) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const url = new URL(`${base}/auth/v1/authorize`);
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", origin);
  url.searchParams.set("scopes", "email profile");

  return NextResponse.redirect(url);
}
