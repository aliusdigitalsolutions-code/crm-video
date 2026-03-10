"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { it } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEvent } from "@/types/calendar";

const locales = {
  it,
};

const localizer = dateFnsLocalizer({
  format: (date: Date, fmt: string, culture?: string) =>
    format(date, fmt, { locale: culture === "it" ? it : it }),
  parse: (value: string, fmt: string, culture?: string) =>
    parse(value, fmt, new Date(), { locale: culture === "it" ? it : it }),
  startOfWeek: (date: Date, culture?: string) => startOfWeek(date, { locale: culture === "it" ? it : it }),
  getDay,
  locales,
});

const eventStyleGetter = (event: CalendarEvent) => {
  let backgroundColor = "#3174ad"; // default blue
  switch (event.resource.tipo) {
    case "videocall":
      backgroundColor = "#28a745"; // green
      break;
    case "shooting":
      backgroundColor = "#fd7e14"; // orange
      break;
    case "pubblicazione":
      backgroundColor = "#6f42c1"; // purple
      break;
  }
  return {
    style: {
      backgroundColor,
      borderRadius: "4px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block",
      padding: "2px 4px",
    },
  };
};

export default function CalendarComponent({ 
  events = [], 
  onEventClick, 
  onDateClick,
  view = Views.DAY,
  onView,
  date = new Date(),
  onNavigate 
}: {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  view?: View;
  onView?: (view: View) => void;
  date?: Date;
  onNavigate?: (date: Date) => void;
}) {
  const [currentView, setCurrentView] = useState<View>(view);
  const [currentDate, setCurrentDate] = useState<Date>(date);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (onEventClick) onEventClick(event);
    },
    [onEventClick]
  );

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date }) => {
      if (onDateClick) onDateClick(start);
    },
    [onDateClick]
  );

  const handleViewChange = useCallback(
    (newView: View) => {
      setCurrentView(newView);
      if (onView) onView(newView);
    },
    [onView]
  );

  const handleNavigate = useCallback(
    (newDate: Date) => {
      setCurrentDate(newDate);
      if (onNavigate) onNavigate(newDate);
    },
    [onNavigate]
  );

  const minTime = new Date(currentDate);
  minTime.setHours(8, 0, 0, 0);
  const maxTime = new Date(currentDate);
  maxTime.setHours(20, 0, 0, 0);

  return (
    <div className="h-[600px] bg-white rounded-lg border">
      <Calendar
        culture="it"
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        view={currentView}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={handleNavigate}
        step={30}
        timeslots={2}
        min={minTime}
        max={maxTime}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        messages={{
          month: "Mese",
          week: "Settimana",
          day: "Giorno",
          agenda: "Agenda",
          today: "Oggi",
          previous: "Indietro",
          next: "Avanti",
          noEventsInRange: "Nessun evento in questo periodo",
        }}
      />
    </div>
  );
}
