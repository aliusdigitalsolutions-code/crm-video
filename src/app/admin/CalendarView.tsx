"use client";

import { useState } from "react";
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
  data_shooting: string | null;
  note_commerciali: string | null;
  note_video: string | null;
  note_social: string | null;
  link_pubblicazione: string | null;
  prezzo_accordo: number | null;
  created_at: string;
};

export default function AdminCalendarView({ initial }: { initial: Appointment[] }) {
  const supabase = createSupabaseBrowserClient();
  const [appointments, setAppointments] = useState(initial);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const selectedFullData = (selectedEvent?.resource.full_data ?? null) as
    | {
        prezzo_accordo?: number | null;
        paese_citta?: string | null;
        link_pubblicazione?: string | null;
      }
    | null;

  // Convert all appointments to calendar events
  const events: CalendarEvent[] = appointments
    .flatMap(a => {
      const eventList: CalendarEvent[] = [];
      
      // Videocall event
      if (a.data_videocall) {
        const startDate = new Date(a.data_videocall);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour
        eventList.push({
          id: `${a.id}-videocall`,
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
        });
      }
      
      // Shooting event
      if (a.data_shooting) {
        const startDate = new Date(a.data_shooting);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        eventList.push({
          id: `${a.id}-shooting`,
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
        });
      }
      
      // Publication event
      if (a.link_pubblicazione) {
        const eventDate = new Date(a.created_at);
        const startDate = eventDate;
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes
        eventList.push({
          id: `${a.id}-pubblicazione`,
          title: `Pubblicazione: ${a.cliente_nome}`,
          start: startDate,
          end: endDate,
          resource: {
            cliente_nome: a.cliente_nome,
            stato: a.stato,
            tipo: "pubblicazione" as const,
            note: a.note_social || undefined,
            full_data: a,
          },
        });
      }
      
      return eventList;
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
          <CardTitle>Calendario Completo</CardTitle>
          <p className="text-sm text-zinc-600">
            {!hasEvents ? "Nessun evento programmato" : `${events.length} eventi programmati`}
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
            <CardTitle>Dettagli Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEvent.resource.cliente_nome}</h3>
                <p className="text-sm text-zinc-600">
                  {selectedEvent.start.toLocaleDateString()} {selectedEvent.start.toLocaleTimeString()} - {selectedEvent.end.toLocaleTimeString()}
                </p>
                <p className="text-sm font-medium text-zinc-700 capitalize">
                  Tipo: {selectedEvent.resource.tipo}
                </p>
              </div>
              
              <div className="flex gap-2">
                <BadgeNeutral>{selectedEvent.resource.stato}</BadgeNeutral>
                {selectedFullData?.prezzo_accordo ? (
                  <BadgeSuccess>€{selectedFullData.prezzo_accordo}</BadgeSuccess>
                ) : null}
              </div>
              
              {selectedEvent.resource.note && (
                <div>
                  <h4 className="font-medium text-sm">Note:</h4>
                  <p className="text-sm text-zinc-600">{selectedEvent.resource.note}</p>
                </div>
              )}
              
              {selectedEvent.resource.tipo === "shooting" && selectedFullData?.paese_citta ? (
                <div>
                  <h4 className="font-medium text-sm">Luogo:</h4>
                  <p className="text-sm text-zinc-600">{selectedFullData.paese_citta}</p>
                </div>
              ) : null}
              
              {selectedEvent.resource.tipo === "pubblicazione" && selectedFullData?.link_pubblicazione ? (
                <div>
                  <a
                    href={selectedFullData.link_pubblicazione}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Apri pubblicazione
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
