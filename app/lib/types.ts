export interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: React.ReactNode;
}
// Tipos globales para recursos y temas

export interface Recurso {
  id: string;
  titulo: string;
  descripcion?: string;
  url?: string;
  filePath?: string;
  nombreOriginal?: string;
  tema: string;
  tipo: string;
  tipoArchivo?: string;
  tamaño?: number;
  fechaCarga?: string;
  tags: string[];
}

export interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}
