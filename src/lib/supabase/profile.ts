import type { UserRole } from "@/lib/supabase/roles";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchMyRole(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.role) return null;

  return data.role as UserRole;
}
