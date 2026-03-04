"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Accedi</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Usa le credenziali Supabase Auth.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              className="h-10 rounded-md border px-3"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              className="h-10 rounded-md border px-3"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            className="mt-2 h-10 rounded-md bg-black text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
