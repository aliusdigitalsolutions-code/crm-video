import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RepresentanteClient from "@/app/dashboard-vendite/RepresentanteClient";
import SimpleCalendar from "@/app/dashboard-vendite/SimpleCalendar";

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
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard Vendite</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Calendario videocall e appuntamenti.
        </p>
      </div>
      
      {/* CALENDARIO SEMPRE VISIBILE */}
      <SimpleCalendar />
      
      <div className="mt-8">
        <RepresentanteClient initial={appointments ?? []} />
      </div>
    </div>
  );
}
