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

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  modo?: 'presencial' | 'virtual' | 'hibrido';
  validador?: string;
  codigoDana?: string;
  diaEnvio?: string;
  relatedResources?: string[];
  eventType?: string;
  recurrencePattern?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TipoEvento {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono?: string;
}

// Tipos globales para recursos y temas

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
