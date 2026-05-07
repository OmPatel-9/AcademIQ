import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "academiq_sessions";

type AuthProfile = {
  id: string;
  email?: string;
};

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key || "",
    Authorization: `Bearer ${key || ""}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

function supabaseUrl(path: string) {
  return `${supabaseBase()}/rest/v1/${path}`;
}

function supabaseBase() {
  return (process.env.SUPABASE_URL || "").replace(/\/rest\/v1$/, "").replace(/\/$/, "");
}

function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function authenticatedProfile(request: Request): Promise<AuthProfile | null> {
  if (!hasSupabase()) {
    return null;
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return null;
  }

  const response = await fetch(`${supabaseBase()}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const profile = await response.json().catch(() => null);
  const id = typeof profile?.id === "string" ? profile.id : "";
  if (!id) {
    return null;
  }

  return {
    id,
    email: typeof profile?.email === "string" ? profile.email : undefined
  };
}

export async function GET(request: Request) {
  if (!hasSupabase()) {
    return NextResponse.json({ enabled: false, sessions: [] });
  }

  const profile = await authenticatedProfile(request);
  if (!profile) {
    return NextResponse.json({ enabled: true, error: "Google sign-in is required to load saved chats.", sessions: [] }, { status: 401 });
  }

  const response = await fetch(
    supabaseUrl(`${TABLE}?user_id=eq.${encodeURIComponent(profile.id)}&order=updated_at.desc&limit=30`),
    { headers: supabaseHeaders(), cache: "no-store" }
  );

  if (!response.ok) {
    return NextResponse.json({ enabled: true, error: "Supabase session load failed.", sessions: [] }, { status: 500 });
  }

  const rows = await response.json();
  return NextResponse.json({
    enabled: true,
    sessions: Array.isArray(rows)
      ? rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          pack: row.pack,
          messages: row.messages || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))
      : []
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.pack) {
    return NextResponse.json({ error: "Session id and pack are required." }, { status: 400 });
  }

  if (!hasSupabase()) {
    return NextResponse.json({ enabled: false, saved: false });
  }

  const profile = await authenticatedProfile(request);
  if (!profile) {
    return NextResponse.json({ enabled: true, error: "Google sign-in is required to save chats." }, { status: 401 });
  }

  const now = new Date().toISOString();
  const row = {
    id: body.id,
    user_id: profile.id,
    title: body.title || body.pack?.topic || "AcademIQ study session",
    pack: body.pack,
    messages: body.messages || [],
    created_at: body.createdAt || now,
    updated_at: now
  };

  const response = await fetch(supabaseUrl(TABLE), {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(row)
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ enabled: true, error: detail.slice(0, 500) }, { status: 500 });
  }

  return NextResponse.json({ enabled: true, saved: true });
}
