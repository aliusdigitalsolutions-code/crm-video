"use client";

import { useState } from "react";
import CalendarComponent from "@/components/Calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BadgeNeutral } from "@/components/ui/Badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CalendarEvent } from "@/types/calendar";

type Appointment = {
  id: string;
  cliente_nome: string;
  stato: string;
  data_shooting: string | null;
  paese_citta: string | null;
  note_video: string | null;
  file_contratto_url: string | null;
};

export default function VideomakerCalendarView({ initial }: { initial: Appointment[] }) {
  const supabase = createSupabaseBrowserClient();
  const [appointments, setAppointments] = useState(initial);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const selectedFullData = (selectedEvent?.resource.full_data ?? null) as
    | {
        paese_citta?: string | null;
        file_contratto_url?: string | null;
      }
    | null;

  // Convert appointments to calendar events
  const events: CalendarEvent[] = appointments
    .filter(a => a.data_shooting)
    .map(a => {
      const startDate = new Date(a.data_shooting!);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration for shooting
      
      return {
        id: a.id,
        title: `Shooting: ${a.cliente_nome}`,
        start: startDate,
        end: endDate,
        resource: {
          cliente_nome: a.cliente_nome,
          stato: a.stato,
          tipo: "shooting" as const,
          note: a.note_video || undefined,
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
    console.log("Clicked date:", date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendario Shooting</CardTitle>
          <p className="text-sm text-zinc-600">
            {!hasEvents ? "Nessuno shooting programmato" : `${events.length} shooting programmati`}
          </p>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            events={events}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        </CardContent>
      </Card>

      {showDetails && selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Dettagli Shooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEvent.resource.cliente_nome}</h3>
                <p className="text-sm text-zinc-600">
                  {selectedEvent.start.toLocaleDateString()} dalle {selectedEvent.start.toLocaleTimeString()} alle {selectedEvent.end.toLocaleTimeString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <BadgeNeutral>{selectedEvent.resource.stato}</BadgeNeutral>
              </div>
              
              {selectedFullData?.paese_citta ? (
                <div>
                  <h4 className="font-medium text-sm">Luogo:</h4>
                  <p className="text-sm text-zinc-600">{selectedFullData.paese_citta}</p>
                </div>
              ) : null}
              
              {selectedEvent.resource.note && (
                <div>
                  <h4 className="font-medium text-sm">Note shooting:</h4>
                  <p className="text-sm text-zinc-600">{selectedEvent.resource.note}</p>
                </div>
              )}
              
              {selectedFullData?.file_contratto_url ? (
                <div>
                  <a
                    href={selectedFullData.file_contratto_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Apri contratto
                  </a>
                </div>
              ) : null}
              
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
