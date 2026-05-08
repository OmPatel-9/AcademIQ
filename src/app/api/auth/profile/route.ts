import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseBase() {
  return (process.env.SUPABASE_URL || "").replace(/\/rest\/v1$/, "").replace(/\/$/, "");
}

function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET(request: Request) {
  if (!hasSupabase()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Missing Google session token." }, { status: 401 });
  }

  const response = await fetch(`${supabaseBase()}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Google session could not be verified." }, { status: 401 });
  }

  const profile = await response.json();
  const metadata = profile?.user_metadata || {};
  const email = typeof profile?.email === "string" ? profile.email : "";
  const name =
    typeof metadata?.full_name === "string"
      ? metadata.full_name
      : typeof metadata?.name === "string"
        ? metadata.name
        : email.split("@")[0] || "Google user";

  return NextResponse.json({
    id: profile.id,
    email,
    name,
    avatarUrl: typeof metadata?.avatar_url === "string" ? metadata.avatar_url : ""
  });
}
