"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
// ...existing code...

interface Recurso {
  id: string;
  titulo: string;
  tipo?: string;
  descripcion?: string;
  filePath?: string;
  url?: string;
}

interface RecursosSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recursos: Recurso[]) => void;
  selectedIds: string[]; // IDs seleccionados
  token?: string | null;
  recursoIds?: string[]; // IDs a mostrar (filtrar)
}

const RecursosSelectorModal: React.FC<RecursosSelectorModalProps> = ({ open, onClose, onSelect, selectedIds, token, recursoIds }) => {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>(selectedIds);
  // Permitir selección múltiple con click (toggle)
  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Confirmar selección y cerrar
  const handleConfirmar = () => {
    const recursosSeleccionados = recursos.filter(r => seleccionados.includes(r.id));
    onSelect(recursosSeleccionados);
    onClose();
  };

  // Cancelar y cerrar
  const handleCancelar = () => {
    onClose();
  };

  useEffect(() => {
    fetch("/api/resources", {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
    })
      .then(async res => {
        if (!res.ok) {
          setRecursos([]);
          return;
        }
        const data = await res.json();
        let allRecursos: Recurso[] = [];
        if (Array.isArray(data.resources)) {
          allRecursos = data.resources;
        } else if (Array.isArray(data)) {
          allRecursos = data;
        } else if (Array.isArray(data.recursos)) {
          allRecursos = data.recursos;
        }
        if (Array.isArray(recursoIds) && recursoIds.length > 0) {
          setRecursos(allRecursos.filter(r => recursoIds.includes(r.id)));
        } else {
          setRecursos(allRecursos);
        }
      })
      .catch(() => {
        setRecursos([]);
      });
  }, [token, recursoIds]);

  useEffect(() => {
    setSeleccionados(selectedIds);
  }, [selectedIds, open]);

  // ...existing code...


  // ...existing code...

  // ...existing code...

  if (!open || typeof window === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in recursos-selector-modal">
      <div className="bg-gradient-to-br from-[#23243a] via-[#1a1b2e] to-[#181926] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[96vh] flex flex-col border border-accent/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-accent/30 bg-[#23243a]">
          <h2 className="text-lg font-semibold text-white">Seleccionar recursos</h2>
          <button onClick={handleCancelar} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        {/* Lista de recursos */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#181926]">
          {recursos.length === 0 ? (
            <div className="text-center text-gray-400">No hay recursos disponibles.</div>
          ) : (
            <ul className="space-y-2">
              {recursos.map(recurso => (
                <li key={recurso.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 hover:bg-accent/10 transition">
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(recurso.id)}
                    onChange={() => toggleSeleccion(recurso.id)}
                    className="accent-accent w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">{recurso.titulo}</div>
                    {recurso.descripcion && (
                      <div className="text-xs text-gray-400">{recurso.descripcion}</div>
                    )}
                  </div>
                  {recurso.tipo && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 border border-gray-600">{recurso.tipo}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Acciones */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-accent/30 bg-[#23243a]">
          <button onClick={handleCancelar} className="px-4 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600">Cancelar</button>
          <button
            onClick={handleConfirmar}
            className="px-4 py-2 rounded bg-accent text-white font-semibold hover:bg-accent/80 disabled:opacity-50"
            disabled={seleccionados.length === 0}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecursosSelectorModal;
