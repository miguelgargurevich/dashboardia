export interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: React.ReactNode;
}

export interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

export type EventType = 'incidente' | 'mantenimiento' | 'reunion' | 'capacitacion' | 'otro';
export type RecurrencePattern = 'ninguno' | 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'anual';

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  modo?: 'presencial' | 'virtual' | 'hibrido' | string;
  validador?: string;
  codigoDana?: string;
  diaEnvio?: string;
  relatedResources?: string[];
  eventType?: EventType | string;
  recurrencePattern?: RecurrencePattern | string;
  isRecurring?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Campos nuevos con nombres en español
  titulo?: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  ubicacion?: string;
  tipoEvento?: string;
  esRecurrente?: boolean;
  recursos?: Array<{ id: string; titulo: string; }>;
}

export interface TipoEvento {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono?: string;
}

// Tipos globales para recursos 

export interface Recurso {
  id: string;
  titulo: string;
  descripcion?: string;
  url?: string;
  filePath?: string;
  nombreOriginal?: string;
  tipo: string;
  tipoArchivo?: string;
  tamaño?: number;
  fechaCarga?: string;
  tags: string[];
}
