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
  note_social: string | null;
  link_pubblicazione: string | null;
  created_at: string;
};

export default function SMMCalendarView({ initial }: { initial: Appointment[] }) {
  const supabase = createSupabaseBrowserClient();
  const [appointments, setAppointments] = useState(initial);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Convert appointments to calendar events
  const events: CalendarEvent[] = appointments
    .filter(a => a.link_pubblicazione)
    .map(a => {
      // Try to extract date from link or use creation date
      let eventDate = new Date(a.created_at);
      if (a.link_pubblicazione) {
        // If link contains date patterns, we could parse them here
        // For now, use creation date as publication date
      }
      
      const startDate = eventDate;
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes duration
      
      return {
        id: a.id,
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
      };
    });

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
          <CardTitle>Calendario Pubblicazioni</CardTitle>
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
            <CardTitle>Dettagli Pubblicazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEvent.resource.cliente_nome}</h3>
                <p className="text-sm text-zinc-600">
                  Pubblicato il {selectedEvent.start.toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <BadgeNeutral>{selectedEvent.resource.stato}</BadgeNeutral>
              </div>
              
              {selectedEvent.resource.note && (
                <div>
                  <h4 className="font-medium text-sm">Note social:</h4>
                  <p className="text-sm text-zinc-600">{selectedEvent.resource.note}</p>
                </div>
              )}
              
              {selectedEvent.resource.full_data.link_pubblicazione && (
                <div>
                  <h4 className="font-medium text-sm">Link pubblicazione:</h4>
                  <a
                    href={selectedEvent.resource.full_data.link_pubblicazione}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline block"
                  >
                    Apri pubblicazione
                  </a>
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
