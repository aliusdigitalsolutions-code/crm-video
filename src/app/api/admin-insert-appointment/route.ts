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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { appointment?: AppointmentInsert };
    const appointment = body.appointment;

    if (!appointment || typeof appointment.cliente_nome !== "string" || !appointment.cliente_nome.trim()) {
      return NextResponse.json({ error: "Missing appointment.cliente_nome" }, { status: 400 });
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

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from("appointments")
      .insert(appointment)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Insert failed (no row returned)" }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
