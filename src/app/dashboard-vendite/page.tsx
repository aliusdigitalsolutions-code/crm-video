import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RepresentanteClient from "@/app/dashboard-vendite/RepresentanteClient";
import SimpleCalendar from "@/app/dashboard-vendite/SimpleCalendar";

export default async function DashboardVenditePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-red-600 mb-4">TEST PAGINA VENDITE</h1>
      <p className="text-xl">Se vedi questo, la pagina funziona</p>
      <div className="mt-8 p-4 bg-blue-100 border-2 border-blue-500 rounded">
        <h2 className="text-2xl font-bold text-blue-600">CALENDARIO QUI SOTTO</h2>
        <SimpleCalendar />
      </div>
    </div>
  );
}
