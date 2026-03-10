import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchMyRole } from "@/lib/supabase/profile";
import { type UserRole } from "@/lib/supabase/roles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Video",
  description: "App per gestione clienti, shooting e social",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: UserRole | null = null;
  if (user) {
    role = await fetchMyRole(supabase);
  }

  const buildLabel = (() => {
    const env = process.env.VERCEL_ENV ?? null;
    const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
    if (!env && !sha) return null;
    const shortSha = sha ? sha.slice(0, 7) : null;
    return `${env ?? "-"}${shortSha ? `@${shortSha}` : ""}`;
  })();

  const isLoginPage = children?.toString().includes("LoginPage") || false;

  return (
    <html lang="it" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        {user && role && !isLoginPage ? (
          <div className="flex h-full flex-col">
            <Header role={role} buildLabel={buildLabel} />
            <main className="flex-1 overflow-y-auto pb-14 sm:pb-0">{children}</main>
            <BottomNav role={role} />
          </div>
        ) : (
          <>{children}</>
        )}
      </body>
    </html>
  );
}
