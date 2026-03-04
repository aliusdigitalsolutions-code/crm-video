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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const appointmentId = formData.get("appointmentId") as string | null;

    if (!file || !appointmentId) {
      return NextResponse.json({ error: "Missing file or appointmentId" }, { status: 400 });
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

    if (profile?.role !== "videomaker" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const bucketName = "contratti";

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`public/${appointmentId}/${file.name}`, file, {
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ file_contratto_url: publicUrl })
      .eq("id", appointmentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ fileUrl: publicUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
