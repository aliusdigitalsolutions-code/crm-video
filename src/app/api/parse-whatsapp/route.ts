import OpenAI from "openai";
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

type ParsedWhatsApp = {
  cliente_nome: string;
  data_videocall: string | null;
  note_commerciali: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const { supabase } = createSupabaseRouteClient(request);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 403 });
    }

    if (profile?.role !== "rappresentante" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Estrai informazioni da un messaggio WhatsApp commerciale. Rispondi SOLO con JSON valido, senza testo extra.",
        },
        {
          role: "user",
          content:
            "Dal testo seguente estrai: cliente_nome (stringa, obbligatorio), data_videocall (ISO 8601 con timezone se presente, altrimenti null), note_commerciali (stringa o null). Testo:\n\n" +
            text,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    let parsed: ParsedWhatsApp;
    try {
      parsed = JSON.parse(content) as ParsedWhatsApp;
    } catch {
      return NextResponse.json(
        { error: "AI response was not valid JSON", raw: content },
        { status: 502 },
      );
    }

    if (!parsed?.cliente_nome || typeof parsed.cliente_nome !== "string") {
      return NextResponse.json(
        { error: "AI output missing cliente_nome", raw: parsed },
        { status: 502 },
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("appointments")
      .insert({
        cliente_nome: parsed.cliente_nome,
        data_videocall: parsed.data_videocall,
        note_commerciali: parsed.note_commerciali,
        messaggio_originale_whatsapp: text,
      })
      .select(
        "id, created_at, cliente_nome, stato, data_videocall, note_commerciali, messaggio_originale_whatsapp",
      )
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ appointment: inserted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
