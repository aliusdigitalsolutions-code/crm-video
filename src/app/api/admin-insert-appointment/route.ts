import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function createSupabaseRouteClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const response = NextResponse.next();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}

async function getAuthedUserRole(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const { supabase, response } = createSupabaseRouteClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return { user, role: profile?.role ?? null, response };
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return { user: null, role: null, response };
  }

  const supabaseWithToken = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user: tokenUser },
  } = await supabaseWithToken.auth.getUser();

  if (!tokenUser) {
    return { user: null, role: null, response };
  }

  const { data: profile } = await supabaseWithToken
    .from("profiles")
    .select("role")
    .eq("id", tokenUser.id)
    .maybeSingle();

  return { user: tokenUser, role: profile?.role ?? null, response };
}

function withCookies(base: NextResponse, cookieSource: NextResponse) {
  cookieSource.cookies.getAll().forEach((c) => {
    base.cookies.set(c);
  });
  return base;
}

function wantsHtml(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function htmlResponse(payload: unknown) {
  const body = `<!doctype html><meta charset="utf-8" /><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;
  return new NextResponse(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

type AppointmentInsert = {
  cliente_nome: string;
  stato: string;
  data_videocall: string | null;
  messaggio_originale_whatsapp: string | null;
  note_commerciali: string | null;
  prezzo_accordo: number | null;
  durata_mesi: number | null;
  file_contratto_url: string | null;
  paese_citta: string | null;
  data_shooting: string | null;
  note_video: string | null;
  note_social: string | null;
  link_pubblicazione: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const { user, role, response } = await getAuthedUserRole(request);
    if (!user) {
      const payload = { ok: false, authenticated: false };
      const base = wantsHtml(request) ? htmlResponse(payload) : NextResponse.json(payload);
      return withCookies(base, response);
    }

    const payload = { ok: true, authenticated: true, userId: user.id, role };
    const base = wantsHtml(request) ? htmlResponse(payload) : NextResponse.json(payload);
    return withCookies(base, response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { appointment?: AppointmentInsert };
    const appointment = body.appointment;

    if (!appointment || typeof appointment.cliente_nome !== "string" || !appointment.cliente_nome.trim()) {
      return NextResponse.json({ error: "Missing appointment.cliente_nome" }, { status: 400 });
    }

    const { user, role, response } = await getAuthedUserRole(request);

    if (!user) {
      return withCookies(NextResponse.json({ error: "Not authenticated" }, { status: 401 }), response);
    }

    if (role !== "admin") {
      return withCookies(NextResponse.json({ error: "Not allowed" }, { status: 403 }), response);
    }

    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("appointments")
      .insert(appointment)
      .select("*")
      .single();

    if (error) {
      return withCookies(NextResponse.json({ error: error.message }, { status: 500 }), response);
    }

    if (!data) {
      return withCookies(NextResponse.json({ error: "Insert failed (no row returned)" }, { status: 500 }), response);
    }

    return withCookies(NextResponse.json({ success: true, appointment: data }), response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
