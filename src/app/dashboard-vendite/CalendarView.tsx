"use client";

import { useState } from "react";
import { View } from "react-big-calendar";
import CalendarComponent from "@/components/Calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BadgeNeutral, BadgeSuccess } from "@/components/ui/Badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CalendarEvent } from "@/types/calendar";

type Appointment = {
  id: string;
  cliente_nome: string;
  stato: string;
  data_videocall: string | null;
  note_commerciali: string | null;
  prezzo_accordo: number | null;
};

export default function CalendarView({ initial }: { initial: Appointment[] }) {
  const supabase = createSupabaseBrowserClient();
  const [appointments, setAppointments] = useState(initial);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Convert appointments to calendar events
  const events: CalendarEvent[] = appointments
    .filter(a => a.data_videocall)
    .map(a => {
      const startDate = new Date(a.data_videocall!);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      return {
        id: a.id,
        title: `Videocall: ${a.cliente_nome}`,
        start: startDate,
        end: endDate,
        resource: {
          cliente_nome: a.cliente_nome,
          stato: a.stato,
          tipo: "videocall" as const,
          note: a.note_commerciali || undefined,
          full_data: a,
        },
      };
    });

  // Always show calendar even if no events
  const hasEvents = events.length > 0;

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetails(true);
  };

  const handleDateClick = (date: Date) => {
    // Could open a modal to create new appointment
    console.log("Clicked date:", date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendario Videocall</CardTitle>
          <p className="text-sm text-zinc-600">
            {!hasEvents ? "Nessuna videocall programmata" : `${events.length} videocall programmate`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] bg-white rounded-lg border p-4">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="font-semibold">Calendario Semplificato</h3>
              <span className="text-sm text-zinc-600">
                {new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map(day => (
                <div key={day} className="p-2 text-center font-semibold bg-gray-100 rounded">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === new Date().getDate();
                const hasEvent = events.some(event => 
                  event.start.getDate() === dayNum && 
                  event.start.getMonth() === new Date().getMonth()
                );
                
                return (
                  <div 
                    key={i} 
                    className={`p-2 text-center border rounded cursor-pointer transition-colors
                      ${isToday ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}
                      ${hasEvent ? 'bg-green-100 border-green-500' : ''}
                    `}
                  >
                    <div className="font-medium">{dayNum}</div>
                    {hasEvent && (
                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {hasEvents && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="font-medium text-sm mb-2">Eventi del mese:</h4>
                {events.map(event => (
                  <div key={event.id} className="text-xs p-2 bg-green-100 rounded mb-1">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-zinc-600 ml-2">
                      {event.start.toLocaleDateString()} alle {event.start.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showDetails && selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Dettagli Appuntamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEvent.resource.cliente_nome}</h3>
                <p className="text-sm text-zinc-600">
                  {selectedEvent.start.toLocaleDateString()} alle {selectedEvent.start.toLocaleTimeString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <BadgeNeutral>{selectedEvent.resource.stato}</BadgeNeutral>
                {selectedEvent.resource.full_data.prezzo_accordo && (
                  <BadgeSuccess>€{selectedEvent.resource.full_data.prezzo_accordo}</BadgeSuccess>
                )}
              </div>
              
              {selectedEvent.resource.note && (
                <div>
                  <h4 className="font-medium text-sm">Note:</h4>
                  <p className="text-sm text-zinc-600">{selectedEvent.resource.note}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <button
                  className="h-8 rounded-md border border-zinc-300 px-3 text-xs text-zinc-700"
                  onClick={() => setShowDetails(false)}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
