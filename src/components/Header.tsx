"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { roleHomePath, type UserRole } from "@/lib/supabase/roles";

export default function Header({
  role,
  buildLabel,
}: {
  role: UserRole;
  buildLabel?: string | null;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const homePath = roleHomePath(role);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold">CRM Video</div>
          <div className="hidden sm:block rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
            {role}
          </div>
          {buildLabel ? (
            <a
              href="/version"
              className="hidden sm:block rounded-md bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-900"
              title="Apri /version"
            >
              {buildLabel}
            </a>
          ) : null}
        </div>

        <nav className="hidden sm:flex items-center gap-4">
          <a
            href={homePath}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Dashboard
          </a>
          <button
            onClick={onLogout}
            disabled={loading}
            className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {loading ? "Logout..." : "Logout"}
          </button>
        </nav>

        <button
          onClick={onLogout}
          disabled={loading}
          className="sm:hidden rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {loading ? "..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
