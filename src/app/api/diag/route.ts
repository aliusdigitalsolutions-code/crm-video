import { NextResponse } from "next/server";

export async function GET() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    null;

  return NextResponse.json({
    ok: true,
    env: {
      hasNextPublicSupabaseUrl: hasUrl,
      hasNextPublicSupabaseAnonKey: hasAnon,
      hasSupabaseServiceRoleKey: hasServiceRole,
    },
    vercel: {
      commit,
      environment: process.env.VERCEL_ENV ?? null,
    },
  });
}
