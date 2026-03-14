import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VideomakerClient from "@/app/agenda-shooting/VideomakerClient";
import VideomakerCalendarView from "@/app/agenda-shooting/CalendarView";

export default async function AgendaShootingBariPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await fetchMyRole(supabase);
  if (role !== "videomaker_bari" && role !== "admin") {
    redirect("/");
  }

  const { data: appointments } = await supabase
    .from("appointments_safe")
    .select(
      "id, cliente_nome, stato, data_shooting, paese_citta, note_video, file_contratto_url",
    )
    .eq("stato", "chiuso")
    .eq("videomaker_team", "bari")
    .order("data_shooting", { ascending: true });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Agenda Shooting Bari</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Calendario shooting e clienti chiusi (Bari).
        </p>
      </div>
      <VideomakerCalendarView initial={appointments ?? []} />
      <div className="mt-8">
        <VideomakerClient initial={appointments ?? []} />
      </div>
    </div>
  );
}
