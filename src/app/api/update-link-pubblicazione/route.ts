import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function createSupabaseRouteClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  let response = NextResponse.next();

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      appointmentId?: string;
      link?: string;
    };
    const { appointmentId, link } = body;

    if (!appointmentId || typeof link !== "string") {
      return NextResponse.json({ error: "Missing appointmentId or link" }, { status: 400 });
    }

    const { supabase } = createSupabaseRouteClient(request);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "smm" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { error } = await supabase.rpc("smm_update_link_pubblicazione", {
      p_appointment_id: appointmentId,
      p_link: link,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
