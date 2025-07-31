"use client";
import { useState, useEffect } from "react";
import EventsCalendar from "../components/eventos/EventsCalendar";
import EventosListPanel from "../components/eventos/EventosListPanel";

export default function EventosPage() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    setToken(t);
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <EventsCalendar token={token} selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>
      <div className="w-full md:w-96">
        <EventosListPanel selectedDate={selectedDate} />
      </div>
    </div>
  );
}
