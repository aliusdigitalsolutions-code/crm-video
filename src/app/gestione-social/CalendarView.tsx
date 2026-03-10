"use client";

import { useState } from "react";
import CalendarComponent from "@/components/Calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BadgeNeutral } from "@/components/ui/Badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CalendarEvent } from "@/types/calendar";

const WEEKDAY_ORDER: Array<{
  key: string;
  label: string;
  dayIndex: number; // 0=Sunday..6=Saturday
}> = [
  { key: "lunedi", label: "Ogni lunedì", dayIndex: 1 },
  { key: "martedi", label: "Ogni martedì", dayIndex: 2 },
  { key: "mercoledi", label: "Ogni mercoledì", dayIndex: 3 },
  { key: "giovedi", label: "Ogni giovedì", dayIndex: 4 },
  { key: "venerdi", label: "Ogni venerdì", dayIndex: 5 },
  { key: "sabato", label: "Ogni sabato", dayIndex: 6 },
  { key: "domenica", label: "Ogni domenica", dayIndex: 0 },
];

function getNextOccurrencesByWeekday(
  base: Date,
  targetDayIndex: number,
  weeks: number,
  time: { hh: number; mm: number }
) {
  const occurrences: Date[] = [];
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  const currentDay = start.getDay();
  const delta = (targetDayIndex - currentDay + 7) % 7;
  const first = new Date(start);
  first.setDate(first.getDate() + delta);
  first.setHours(time.hh, time.mm, 0, 0);

  for (let i = 0; i < weeks; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    occurrences.push(d);
  }
  return occurrences;
}

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

  const selectedFullData = (selectedEvent?.resource.full_data ?? null) as
    | {
        link_pubblicazione?: string | null;
      }
    | null;

  const DEFAULT_TIME = { hh: 10, mm: 0 };

  // Convert appointments to calendar events
  const events: CalendarEvent[] = appointments
    .filter((a) => Boolean(a.note_social) || Boolean(a.link_pubblicazione))
    .flatMap((a) => {
      const weekday = WEEKDAY_ORDER.find((w) => w.key === (a.link_pubblicazione ?? ""));

      // If link_pubblicazione is a weekday key, generate weekly occurrences
      if (weekday) {
        const occurrences = getNextOccurrencesByWeekday(new Date(), weekday.dayIndex, 8, DEFAULT_TIME);
        return occurrences.map((startDate) => {
          const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
          return {
            id: `${a.id}-${startDate.toISOString()}`,
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
      }

      // Otherwise fallback: use created_at as a single task marker
      const eventDate = new Date(a.created_at);
      const startDate = eventDate;
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

      return [
        {
          id: a.id,
          title: a.link_pubblicazione ? `Pubblicazione: ${a.cliente_nome}` : `Task Social: ${a.cliente_nome}`,
          start: startDate,
          end: endDate,
          resource: {
            cliente_nome: a.cliente_nome,
            stato: a.stato,
            tipo: "pubblicazione" as const,
            note: a.note_social || undefined,
            full_data: a,
          },
        },
      ];
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
          <CardTitle>Calendario Pubblicazioni</CardTitle>
          <p className="text-sm text-zinc-600">
            {!hasEvents ? "Nessuna pubblicazione programmata" : `${events.length} pubblicazioni programmate`}
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
            <CardTitle>Dettagli Pubblicazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedEvent.resource.cliente_nome}</h3>
                <p className="text-sm text-zinc-600">
                  {selectedEvent.start.toLocaleString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
              
              {selectedFullData?.link_pubblicazione ? (() => {
                const weekday = WEEKDAY_ORDER.find((w) => w.key === selectedFullData.link_pubblicazione);
                if (weekday) {
                  return (
                    <div>
                      <h4 className="font-medium text-sm">Giorno di pubblicazione:</h4>
                      <p className="text-sm text-zinc-600">{weekday.label}</p>
                    </div>
                  );
                }
                if (selectedFullData.link_pubblicazione.startsWith("http")) {
                  return (
                    <div>
                      <h4 className="font-medium text-sm">Link pubblicazione:</h4>
                      <a
                        href={selectedFullData.link_pubblicazione}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 underline block"
                      >
                        Apri pubblicazione
                      </a>
                    </div>
                  );
                }
                return null;
              })() : null}
              
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
