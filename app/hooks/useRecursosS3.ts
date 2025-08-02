import { useState, useCallback } from 'react';

export interface RecursoS3 {
  id: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  url?: string;
  filePath?: string;
  tags: string[];
  categoria: string;
  fechaCarga: string;
  s3Key?: string;
  tamaño?: number;
  tipoArchivo?: string;
}

export interface S3FileInfo {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  fileName: string;
}

export interface UploadResult {
  success: boolean;
  recurso: RecursoS3;
  s3: {
    key: string;
    url: string;
    size: number;
  };
}

const useRecursosS3 = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const getAuthHeadersFormData = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // Subir archivo a S3 y crear recurso
  const uploadRecurso = useCallback(async (
    file: File,
    titulo: string,
    descripcion: string,
    categoria: string,
    subcategoria?: string,
    tags: string[] = []
  ): Promise<UploadResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('titulo', titulo);
      formData.append('descripcion', descripcion);
      formData.append('categoria', categoria);
      if (subcategoria) formData.append('subcategoria', subcategoria);
      formData.append('tags', tags.join(','));

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/upload`, {
        method: 'POST',
        headers: getAuthHeadersFormData(),
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error subiendo archivo');
      }

      const result = await response.json();
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener URL de descarga firmada
  const getDownloadUrl = useCallback(async (s3Key: string, expiresIn: number = 3600): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/download/${encodeURIComponent(s3Key)}?expires=${expiresIn}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo URL de descarga');
      }

      const data = await response.json();
      return data.downloadUrl;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Listar archivos por categoría
  const listFilesByCategory = useCallback(async (categoria: string, subcategoria?: string): Promise<S3FileInfo[]> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ categoria });
      if (subcategoria) params.append('subcategoria', subcategoria);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/files?${params.toString()}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error listando archivos');
      }

      const data = await response.json();
      return data.files || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar archivo de S3
  const deleteFileFromS3 = useCallback(async (s3Key: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/s3/delete`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key: s3Key })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error eliminando archivo');
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener todos los recursos
  const getRecursos = useCallback(async (filtros?: {
    tipo?: string;
    categoria?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<RecursoS3[]> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filtros?.tipo) params.append('tipo', filtros.tipo);
      if (filtros?.categoria) params.append('categoria', filtros.categoria);
      if (filtros?.tags?.length) params.append('tags', filtros.tags.join(','));
      if (filtros?.search) params.append('search', filtros.search);
      if (filtros?.limit) params.append('limit', filtros.limit.toString());
      if (filtros?.page) params.append('page', filtros.page.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources?${params.toString()}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo recursos');
      }

      const data = await response.json();
      return data.resources || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar recurso completo (BD + S3)
  const deleteRecurso = useCallback(async (recursoId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/${recursoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error eliminando recurso');
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar recurso
  const updateRecurso = useCallback(async (
    recursoId: string,
    updates: Partial<RecursoS3>
  ): Promise<RecursoS3 | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/${recursoId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error actualizando recurso');
      }

      const result = await response.json();
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear recurso solo de URL (sin archivo)
  const createRecursoUrl = useCallback(async (
    tipo: string,
    titulo: string,
    descripcion: string,
    url: string,
    categoria: string,
    tags: string[] = []
  ): Promise<RecursoS3 | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tipo,
          titulo,
          descripcion,
          url,
          categoria,
          tags
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando recurso');
      }

      const result = await response.json();
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Utilidades para trabajar con S3
  const extractS3KeyFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remover el primer "/"
    } catch {
      return null;
    }
  };

  const isS3File = (recurso: RecursoS3): boolean => {
    return !!(recurso.filePath && recurso.filePath.includes('amazonaws.com'));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const iconMap: { [key: string]: string } = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      ppt: '📈', pptx: '📈',
      txt: '📄', md: '📄',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
      mp4: '🎥', avi: '🎥', mov: '🎥',
      mp3: '🎵', wav: '🎵',
      zip: '📦', rar: '📦', '7z': '📦'
    };

    return iconMap[extension || ''] || '📎';
  };

  return {
    // Estados
    loading,
    error,
    
    // Operaciones principales
    uploadRecurso,
    getRecursos,
    deleteRecurso,
    updateRecurso,
    createRecursoUrl,
    
    // Operaciones S3
    getDownloadUrl,
    listFilesByCategory,
    deleteFileFromS3,
    
    // Utilidades
    extractS3KeyFromUrl,
    isS3File,
    formatFileSize,
    getFileIcon,
    
    // Reset error
    clearError: () => setError(null)
  };
};

export default useRecursosS3;
