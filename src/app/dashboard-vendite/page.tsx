import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CalendarView from "@/app/dashboard-vendite/CalendarView";
import RepresentanteClient from "@/app/dashboard-vendite/RepresentanteClient";

export default async function DashboardVenditePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await fetchMyRole(supabase);
  if (role !== "rappresentante" && role !== "admin") {
    redirect("/");
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, created_at, cliente_nome, stato, data_videocall, note_commerciali, messaggio_originale_whatsapp, prezzo_accordo",
    )
    .order("data_videocall", { ascending: true })
    .limit(200);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard Vendite</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Calendario videocall e appuntamenti.
        </p>
      </div>

      <CalendarView initial={appointments ?? []} />
      
      <div className="mt-8">
        <RepresentanteClient initial={appointments ?? []} />
      </div>
    </div>
  );
}
