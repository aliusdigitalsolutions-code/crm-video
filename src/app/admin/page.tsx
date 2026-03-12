import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminClient from "@/app/admin/AdminClient";
import AdminCalendarView from "@/app/admin/CalendarView";

function combineDateTime(date: string, time: string) {
  if (!date) return null;

  const raw = date.trim();
  let y: number | null = null;
  let m: number | null = null;
  let d: number | null = null;

  const iso = raw.match(/^\d{4}-\d{2}-\d{2}$/);
  const it = raw.match(/^\d{2}-\d{2}-\d{4}$/);

  if (iso) {
    const parts = raw.split("-").map((v) => Number(v));
    y = parts[0] ?? null;
    m = parts[1] ?? null;
    d = parts[2] ?? null;
  } else if (it) {
    const parts = raw.split("-").map((v) => Number(v));
    d = parts[0] ?? null;
    m = parts[1] ?? null;
    y = parts[2] ?? null;
  } else {
    return null;
  }

  if (!y || !m || !d) return null;

  const t = (time || "").trim();
  const timeParts = t ? t.split(":").map((v) => Number(v)) : [0, 0];
  const hh = timeParts[0] ?? 0;
  const mm = timeParts[1] ?? 0;
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await fetchMyRole(supabase);
  if (role !== "admin") {
    redirect("/");
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  async function createAppointmentAction(formData: FormData) {
    "use server";

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const role = await fetchMyRole(supabase);
    if (role !== "admin") {
      redirect("/");
    }

    const cliente_nome = String(formData.get("cliente_nome") ?? "").trim();
    const stato = String(formData.get("stato") ?? "potenziale");
    const videocallDate = String(formData.get("data_videocall_date") ?? "").trim();
    const videocallTime = String(formData.get("data_videocall_time") ?? "").trim();
    const shootingDate = String(formData.get("data_shooting_date") ?? "").trim();
    const shootingTime = String(formData.get("data_shooting_time") ?? "").trim();
    const data_videocall = videocallDate || videocallTime ? combineDateTime(videocallDate, videocallTime) : null;
    const data_shooting = shootingDate || shootingTime ? combineDateTime(shootingDate, shootingTime) : null;

    if ((videocallDate || videocallTime) && !data_videocall) {
      throw new Error(`Invalid data_videocall: date='${videocallDate}' time='${videocallTime}'`);
    }
    if ((shootingDate || shootingTime) && !data_shooting) {
      throw new Error(`Invalid data_shooting: date='${shootingDate}' time='${shootingTime}'`);
    }
    const prezzo_accordo_raw = String(formData.get("prezzo_accordo") ?? "").trim();
    const durata_mesi_raw = String(formData.get("durata_mesi") ?? "").trim();

    const prezzo_accordo = prezzo_accordo_raw ? Number(prezzo_accordo_raw) : null;
    const durata_mesi = durata_mesi_raw ? Number(durata_mesi_raw) : null;
    const paese_citta = String(formData.get("paese_citta") ?? "").trim() || null;
    const note_commerciali = String(formData.get("note_commerciali") ?? "").trim() || null;
    const note_video = String(formData.get("note_video") ?? "").trim() || null;
    const note_social = String(formData.get("note_social") ?? "").trim() || null;
    const link_pubblicazione = String(formData.get("link_pubblicazione") ?? "").trim() || null;

    if (!cliente_nome) {
      redirect("/admin");
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin
      .from("appointments")
      .insert({
      cliente_nome,
      stato,
      data_videocall,
      messaggio_originale_whatsapp: null,
      note_commerciali,
      prezzo_accordo: Number.isFinite(prezzo_accordo as number) ? prezzo_accordo : null,
      durata_mesi: Number.isFinite(durata_mesi as number) ? durata_mesi : null,
      file_contratto_url: null,
      paese_citta,
      data_shooting,
      note_video,
      note_social,
      link_pubblicazione,
      })
      .select("id, data_videocall, data_shooting")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if ((videocallDate || videocallTime) && !data?.data_videocall) {
      throw new Error("data_videocall was not stored (null) after insert");
    }
    if ((shootingDate || shootingTime) && !data?.data_shooting) {
      throw new Error("data_shooting was not stored (null) after insert");
    }

    redirect("/admin");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Calendario completo e gestione appuntamenti.
        </p>
      </div>
      <AdminCalendarView initial={appointments ?? []} />
      <div className="mt-8">
        <AdminClient initial={appointments ?? []} createAppointmentAction={createAppointmentAction} />
      </div>
    </div>
  );
}
