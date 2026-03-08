import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { roleHomePath } from "@/lib/supabase/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await fetchMyRole(supabase);

  if (!role) {
    redirect("/login");
  }

  redirect(roleHomePath(role));
}
