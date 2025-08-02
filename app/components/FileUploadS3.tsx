import React, { useState, useCallback } from 'react';
import { FaUpload, FaFile, FaTrash, FaDownload, FaEye, FaSpinner } from 'react-icons/fa';

interface FileUploadS3Props {
  categoria: string;
  subcategoria?: string;
  onUploadComplete?: (result: any) => void;
  onError?: (error: string) => void;
  multiple?: boolean;
  maxFileSize?: number; // en MB
  allowedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  file: File;
  titulo: string;
  descripcion: string;
  tags: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  result?: any;
}

const FileUploadS3: React.FC<FileUploadS3Props> = ({
  categoria,
  subcategoria = '',
  onUploadComplete,
  onError,
  multiple = false,
  maxFileSize = 100, // 100MB por defecto
  allowedTypes = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.md', '.csv', '.zip', '.rar', '.7z',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
    '.mp4', '.avi', '.mov', '.wmv', '.mp3', '.wav', '.aac'
  ],
  className = ''
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Validar archivo
  const validateFile = (file: File): string | null => {
    // Verificar tamaño
    if (file.size > maxFileSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Máximo permitido: ${maxFileSize}MB`;
    }

    // Verificar tipo
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(extension)) {
      return `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Manejar drop de archivos
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  // Manejar selección de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  // Procesar archivos seleccionados
  const handleFiles = (newFiles: File[]) => {
    const processedFiles: UploadedFile[] = newFiles.map(file => {
      const error = validateFile(file);
      return {
        file,
        titulo: file.name.split('.')[0], // Nombre sin extensión como título por defecto
        descripcion: '',
        tags: '',
        uploading: false,
        uploaded: false,
        error: error || undefined
      };
    });

    if (multiple) {
      setFiles(prev => [...prev, ...processedFiles]);
    } else {
      setFiles(processedFiles);
    }
  };

  // Actualizar datos de archivo
  const updateFile = (index: number, updates: Partial<UploadedFile>) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, ...updates } : file
    ));
  };

  // Eliminar archivo
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Subir archivo individual
  const uploadFile = async (index: number) => {
    const fileData = files[index];
    if (fileData.error || fileData.uploaded) return;

    updateFile(index, { uploading: true, error: undefined });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('titulo', fileData.titulo);
      formData.append('descripcion', fileData.descripcion);
      formData.append('categoria', categoria);
      if (subcategoria) formData.append('subcategoria', subcategoria);
      formData.append('tags', fileData.tags);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error subiendo archivo');
      }

      const result = await response.json();
      
      updateFile(index, { 
        uploading: false, 
        uploaded: true, 
        result 
      });

      if (onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      updateFile(index, { 
        uploading: false, 
        error: errorMessage 
      });

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Subir todos los archivos
  const uploadAllFiles = async () => {
    const validFiles = files.filter(f => !f.error && !f.uploaded);
    
    for (let i = 0; i < files.length; i++) {
      if (!files[i].error && !files[i].uploaded) {
        await uploadFile(i);
      }
    }
  };

  // Descargar archivo
  const downloadFile = async (fileResult: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Extraer key de la URL
      const url = new URL(fileResult.s3.url);
      const key = url.pathname.substring(1); // Remover el primer "/"

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/download/${encodeURIComponent(key)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error obteniendo URL de descarga');
      }

      const data = await response.json();
      
      // Abrir URL de descarga en nueva pestaña
      window.open(data.downloadUrl, '_blank');

    } catch (error) {
      console.error('Error descargando archivo:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Error descargando archivo');
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zona de drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <FaUpload className="text-3xl text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Arrastra y suelta archivos aquí o{' '}
          <label className="text-blue-500 cursor-pointer hover:text-blue-600">
            selecciona archivos
            <input
              type="file"
              multiple={multiple}
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-sm text-gray-500">
          Máximo {maxFileSize}MB por archivo
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Tipos permitidos: {allowedTypes.slice(0, 5).join(', ')}
          {allowedTypes.length > 5 && '...'}
        </p>
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Archivos ({files.length})
            </h4>
            <button
              onClick={uploadAllFiles}
              disabled={files.every(f => f.uploaded || f.uploading || f.error)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FaUpload className="text-xs" />
              Subir todos
            </button>
          </div>

          {files.map((fileData, index) => (
            <div
              key={index}
              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 space-y-2"
            >
              {/* Información del archivo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaFile className="text-gray-400" />
                  <span className="font-medium text-sm">{fileData.file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(fileData.file.size)})
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {fileData.uploaded && (
                    <>
                      <button
                        onClick={() => downloadFile(fileData.result)}
                        className="p-1 text-green-500 hover:text-green-600"
                        title="Descargar"
                      >
                        <FaDownload className="text-xs" />
                      </button>
                      <button
                        onClick={() => window.open(fileData.result?.s3?.url, '_blank')}
                        className="p-1 text-blue-500 hover:text-blue-600"
                        title="Ver"
                      >
                        <FaEye className="text-xs" />
                      </button>
                    </>
                  )}
                  
                  {!fileData.uploaded && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-500 hover:text-red-600"
                      title="Eliminar"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                </div>
              </div>

              {/* Campos editables si no está subido */}
              {!fileData.uploaded && !fileData.error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Título"
                    value={fileData.titulo}
                    onChange={(e) => updateFile(index, { titulo: e.target.value })}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={fileData.descripcion}
                    onChange={(e) => updateFile(index, { descripcion: e.target.value })}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Tags (separados por comas)"
                    value={fileData.tags}
                    onChange={(e) => updateFile(index, { tags: e.target.value })}
                    className="px-2 py-1 border rounded text-sm"
                  />
                </div>
              )}

              {/* Estados */}
              {fileData.error && (
                <div className="text-red-500 text-sm flex items-center gap-1">
                  <span>❌ {fileData.error}</span>
                </div>
              )}

              {fileData.uploading && (
                <div className="text-blue-500 text-sm flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  <span>Subiendo...</span>
                </div>
              )}

              {fileData.uploaded && (
                <div className="text-green-500 text-sm flex items-center gap-1">
                  <span>✅ Subido correctamente</span>
                </div>
              )}

              {/* Botón de subida individual */}
              {!fileData.uploaded && !fileData.uploading && !fileData.error && (
                <button
                  onClick={() => uploadFile(index)}
                  disabled={!fileData.titulo.trim()}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <FaUpload className="text-xs" />
                  Subir
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadS3;
