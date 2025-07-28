"use client";
import { useState } from "react";
import EventosCalendar from "../components/eventos/EventosCalendar";
import EventosListPanel from "../components/eventos/EventosListPanel";

export default function EventosPage() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <EventosCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>
      <div className="w-full md:w-96">
        <EventosListPanel selectedDate={selectedDate} />
      </div>
    </div>
  );
}
