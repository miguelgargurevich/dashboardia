"use client";

import EventsCalendar from "../dashboard/EventsCalendar";

interface EventosCalendarProps {
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export default function EventosCalendar({ selectedDate, onDateChange }: EventosCalendarProps) {
  return (
    <EventsCalendar token={""} selectedDate={selectedDate} onDateChange={onDateChange} />
  );
}
