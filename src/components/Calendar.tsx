"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEvent } from "@/types/calendar";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
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
  events, 
  onEventClick, 
  onDateClick,
  view = Views.MONTH,
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

  return (
    <div className="h-[600px] bg-white rounded-lg border">
      <Calendar
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
