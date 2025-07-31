"use client";
import React from "react";
import { FaClock } from "react-icons/fa";
import UpcomingEvents from "./UpcomingEvents";

interface Props {
  token: string;
  onEventClick?: (date: string) => void;
}

const ProximosEventosCard: React.FC<Props> = ({ token, onEventClick }) => {
  return (
    <div className="bg-secondary rounded-2xl shadow-xl p-6 flex flex-col h-full border border-accent/20">
      <h2 className="text-2xl font-bold mb-4 text-accent flex items-center gap-2">
        <FaClock className="text-accent" />
        Próximos Eventos
      </h2>
      <UpcomingEvents 
        token={token} 
        onEventClick={onEventClick}
      />
    </div>
  );
};

export default ProximosEventosCard;
