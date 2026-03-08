import { redirect } from "next/navigation";

import { fetchMyRole } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RepresentanteClient from "@/app/dashboard-vendite/RepresentanteClient";
import SimpleCalendar from "@/app/dashboard-vendite/SimpleCalendar";

export default async function DashboardVenditePage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-600">DASHBOARD VENDITE</h1>
      <div className="mt-8 p-6 bg-white border-2 border-blue-500 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Calendario Videocall</h2>
        <div className="grid grid-cols-7 gap-2 text-center">
          {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map(day => (
            <div key={day} className="p-3 bg-gray-100 rounded font-bold text-sm">
              {day}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === new Date().getDate();
            return (
              <div 
                key={i}
                className={`p-3 border rounded text-sm cursor-pointer transition-colors
                  ${isToday ? 'bg-blue-500 text-white font-bold' : 'hover:bg-gray-100'}
                `}
              >
                {dayNum}
                {isToday && <div className="text-xs mt-1">OGGI</div>}
              </div>
            );
          })}
        </div>
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-sm mb-2">Eventi di oggi:</h3>
          <p className="text-xs text-gray-600">Nessuna videocall programmata</p>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-white border-2 border-green-500 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Lista Appuntamenti</h2>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded">Nessun appuntamento presente</div>
        </div>
      </div>
    </div>
  );
}
