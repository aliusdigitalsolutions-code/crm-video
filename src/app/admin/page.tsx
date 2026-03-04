import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminClient from "@/app/admin/AdminClient";

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Gestisci tutti gli appuntamenti e assegna compiti.
        </p>
      </div>
      <AdminClient initial={appointments ?? []} />
    </div>
  );
}
