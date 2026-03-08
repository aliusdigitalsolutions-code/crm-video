import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SmmClient from "@/app/gestione-social/SmmClient";
import SMMCalendarView from "@/app/gestione-social/CalendarView";

export default async function GestioneSocialPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await fetchMyRole(supabase);
  if (role !== "smm" && role !== "admin") {
    redirect("/");
  }

  const { data: appointments } = await supabase
    .from("appointments_safe")
    .select(
      "id, cliente_nome, stato, note_social, link_pubblicazione, created_at",
    )
    .in("stato", ["chiuso", "in_prova", "potenziale"])
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Gestione Social</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Calendario pubblicazioni e clienti attivi.
        </p>
      </div>
      <SMMCalendarView initial={appointments ?? []} />
      <div className="mt-8">
        <SmmClient initial={appointments ?? []} />
      </div>
    </div>
  );
}
