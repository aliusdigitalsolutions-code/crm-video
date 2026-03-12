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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      appointmentId?: string;
      cliente_nome?: string;
      note_commerciali?: string | null;
      prezzo_accordo?: number | null;
    };

    const { appointmentId, cliente_nome, note_commerciali, prezzo_accordo } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    if (cliente_nome !== undefined && typeof cliente_nome !== "string") {
      return NextResponse.json({ error: "Invalid cliente_nome" }, { status: 400 });
    }

    if (note_commerciali !== undefined && note_commerciali !== null && typeof note_commerciali !== "string") {
      return NextResponse.json({ error: "Invalid note_commerciali" }, { status: 400 });
    }

    if (prezzo_accordo !== undefined && prezzo_accordo !== null && typeof prezzo_accordo !== "number") {
      return NextResponse.json({ error: "Invalid prezzo_accordo" }, { status: 400 });
    }

    const { supabase } = createSupabaseRouteClient(request);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (profile?.role !== "rappresentante" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const payload: {
      cliente_nome?: string;
      note_commerciali?: string | null;
      prezzo_accordo?: number | null;
    } = {};

    if (cliente_nome !== undefined) payload.cliente_nome = cliente_nome;
    if (note_commerciali !== undefined) payload.note_commerciali = note_commerciali;
    if (prezzo_accordo !== undefined) payload.prezzo_accordo = prezzo_accordo;

    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("appointments")
      .update(payload)
      .eq("id", appointmentId)
      .select(
        "id, created_at, cliente_nome, stato, data_videocall, note_commerciali, messaggio_originale_whatsapp, prezzo_accordo",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Update failed (no row returned)" }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
