"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type UserRole } from "@/lib/supabase/roles";

const navItems = [
  { href: "/dashboard-vendite", label: "Vendite", allowed: ["rappresentante", "admin"] as UserRole[] },
  { href: "/agenda-shooting", label: "Shooting", allowed: ["videomaker", "admin"] as UserRole[] },
  { href: "/gestione-social", label: "Social", allowed: ["smm", "admin"] as UserRole[] },
  { href: "/admin", label: "Admin", allowed: ["admin"] as UserRole[] },
];

export default function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const visible = navItems.filter((i) => i.allowed.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:hidden">
      <div className="flex h-14 items-center justify-around">
        {visible.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center transition-colors ${
                active ? "text-black" : "text-zinc-500"
              }`}
            >
              <div className="text-lg mb-1">{item.label[0]}</div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
