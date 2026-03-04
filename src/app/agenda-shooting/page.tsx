import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VideomakerClient from "@/app/agenda-shooting/VideomakerClient";

export default async function AgendaShootingPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await fetchMyRole(supabase);
  if (role !== "videomaker" && role !== "admin") {
    redirect("/");
  }

  const { data: appointments } = await supabase
    .from("appointments_safe")
    .select(
      "id, cliente_nome, stato, paese_citta, data_shooting, note_video, file_contratto_url",
    )
    .eq("stato", "chiuso")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Agenda Shooting</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Clienti chiusi + note video + upload file su Storage.
        </p>
      </div>
      <VideomakerClient initial={appointments ?? []} />
    </div>
  );
}
