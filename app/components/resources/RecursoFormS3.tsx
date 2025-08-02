"use client";
import React, { useState, useEffect } from "react";
import { FaPaperclip, FaTag, FaBook, FaHashtag, FaLink, FaStickyNote, FaSpinner } from "react-icons/fa";
import FileUploadS3 from "../FileUploadS3";
import useRecursosS3 from "../../hooks/useRecursosS3";

interface RecursoFormValues {
  titulo: string;
  descripcion?: string;
  tipo: string;
  tema: string;
  archivo?: File | null;
  url?: string;
  etiquetas?: string[];
}

export interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

export interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface RecursoFormS3Props {
  initialValues?: Partial<RecursoFormValues>;
  temas: Tema[];
  tiposRecursos: TipoRecurso[];
  etiquetasDisponibles: string[];
  onSubmit: (values: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
  modo?: 'crear' | 'editar';
  categoria?: string; // Para S3: recursos, notas, eventos
}

const RecursoFormS3: React.FC<RecursoFormS3Props> = ({
  initialValues,
  temas,
  tiposRecursos,
  etiquetasDisponibles,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Guardar recurso",
  modo = 'crear',
  categoria = 'recursos'
}) => {
  const [values, setValues] = useState<RecursoFormValues>({
    titulo: initialValues?.titulo || '',
    descripcion: initialValues?.descripcion || '',
    tipo: initialValues?.tipo || '',
    tema: initialValues?.tema || '',
    url: initialValues?.url || '',
    etiquetas: initialValues?.etiquetas || []
  });

  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [newEtiqueta, setNewEtiqueta] = useState('');

  const { 
    uploadRecurso, 
    createRecursoUrl, 
    updateRecurso,
    loading: s3Loading, 
    error: s3Error 
  } = useRecursosS3();

  useEffect(() => {
    if (initialValues) {
      setValues(prev => ({
        ...prev,
        ...initialValues
      }));
    }
  }, [initialValues]);

  const handleInputChange = (field: keyof RecursoFormValues, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddEtiqueta = () => {
    if (newEtiqueta.trim() && !values.etiquetas?.includes(newEtiqueta.trim())) {
      handleInputChange('etiquetas', [...(values.etiquetas || []), newEtiqueta.trim()]);
      setNewEtiqueta('');
    }
  };

  const handleRemoveEtiqueta = (etiqueta: string) => {
    handleInputChange('etiquetas', values.etiquetas?.filter(e => e !== etiqueta) || []);
  };

  const handleFileUploadComplete = (result: any) => {
    setUploadedFile(result);
    setShowFileUpload(false);
    
    // Actualizar los valores del formulario con la información del archivo
    handleInputChange('titulo', result.recurso.titulo);
    handleInputChange('tipo', 'archivo');
    
    // Llamar al onSubmit con el resultado completo
    onSubmit(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!values.titulo.trim() || !values.tipo || !values.tema) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      let result;

      if (modo === 'editar' && initialValues?.titulo) {
        // Modo edición - solo actualizar datos, no archivo
        result = await updateRecurso(
          (initialValues as any).id,
          {
            titulo: values.titulo,
            descripcion: values.descripcion,
            url: values.url,
            tags: values.etiquetas || [],
            categoria: values.tema
          }
        );
      } else if (values.url && !uploadedFile) {
        // Crear recurso de URL
        result = await createRecursoUrl(
          values.tipo,
          values.titulo,
          values.descripcion || '',
          values.url,
          values.tema,
          values.etiquetas || []
        );
      } else if (uploadedFile) {
        // Archivo ya fue subido, solo retornar el resultado
        result = uploadedFile;
      } else {
        alert('Debes subir un archivo o proporcionar una URL');
        return;
      }

      if (result) {
        onSubmit(result);
      }

    } catch (error) {
      console.error('Error en submit:', error);
      alert('Error al guardar el recurso');
    }
  };

  const isFormValid = values.titulo.trim() && values.tipo && values.tema && 
    (values.url || uploadedFile || modo === 'editar');

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div className="relative">
          <input
            type="text"
            value={values.titulo}
            onChange={(e) => handleInputChange('titulo', e.target.value)}
            className="input-std w-full pl-10"
            placeholder="Título del recurso"
            required
            disabled={loading || s3Loading}
          />
          <FaBook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent" />
        </div>

        {/* Tipo y Tema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo de recurso</label>
            <select
              value={values.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
              className="input-std w-full"
              required
              disabled={loading || s3Loading || uploadedFile}
            >
              <option value="">Selecciona un tipo</option>
              {tiposRecursos.map(tipo => (
                <option key={tipo.id} value={tipo.nombre.toLowerCase()}>
                  {tipo.nombre}
                </option>
              ))}
              <option value="url">Enlace/URL</option>
              <option value="archivo">Archivo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Tema/Categoría</label>
            <select
              value={values.tema}
              onChange={(e) => handleInputChange('tema', e.target.value)}
              className="input-std w-full"
              required
              disabled={loading || s3Loading}
            >
              <option value="">Selecciona un tema</option>
              {temas.map(tema => (
                <option key={tema.id} value={tema.nombre.toLowerCase()}>
                  {tema.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div className="relative">
          <textarea
            value={values.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            className="input-std w-full pl-10 h-24 resize-none"
            placeholder="Descripción del recurso"
            rows={4}
            disabled={loading || s3Loading}
          />
          <FaStickyNote className="absolute left-3 top-4 text-accent" />
        </div>

        {/* Contenido del recurso */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Contenido del recurso</h3>
          
          {/* Opciones de contenido */}
          <div className="flex flex-wrap gap-2 mb-4">
            {!uploadedFile && modo !== 'editar' && (
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  showFileUpload 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                disabled={loading || s3Loading}
              >
                📎 Subir archivo
              </button>
            )}
            
            {!showFileUpload && !uploadedFile && (
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">URL (opcional)</label>
                <div className="relative">
                  <input
                    type="url"
                    value={values.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className="input-std w-full pl-10"
                    placeholder="https://ejemplo.com/recurso"
                    disabled={loading || s3Loading}
                  />
                  <FaLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent" />
                </div>
              </div>
            )}
          </div>

          {/* Upload de archivos */}
          {showFileUpload && !uploadedFile && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-3">Subir archivo a la nube</h4>
              <FileUploadS3
                categoria={categoria}
                subcategoria={values.tema}
                onUploadComplete={handleFileUploadComplete}
                onError={(error) => console.error('Error upload:', error)}
                multiple={false}
                maxFileSize={100}
              />
            </div>
          )}

          {/* Archivo subido */}
          {uploadedFile && (
            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="font-medium text-green-700 dark:text-green-300">
                  Archivo subido: {uploadedFile.recurso?.titulo}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setShowFileUpload(true);
                  }}
                  className="ml-auto text-sm text-gray-500 hover:text-gray-700"
                  disabled={loading || s3Loading}
                >
                  Cambiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Etiquetas */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Etiquetas</label>
          
          {/* Etiquetas seleccionadas */}
          {values.etiquetas && values.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {values.etiquetas.map((etiqueta, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-accent/20 text-accent rounded-full text-xs flex items-center gap-1"
                >
                  {etiqueta}
                  <button
                    type="button"
                    onClick={() => handleRemoveEtiqueta(etiqueta)}
                    className="text-accent/70 hover:text-accent ml-1"
                    disabled={loading || s3Loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Agregar nueva etiqueta */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newEtiqueta}
                onChange={(e) => setNewEtiqueta(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEtiqueta())}
                className="input-std w-full pl-10"
                placeholder="Nueva etiqueta"
                disabled={loading || s3Loading}
              />
              <FaHashtag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent" />
            </div>
            <button
              type="button"
              onClick={handleAddEtiqueta}
              className="px-3 py-2 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors text-sm"
              disabled={!newEtiqueta.trim() || loading || s3Loading}
            >
              Agregar
            </button>
          </div>

          {/* Etiquetas sugeridas */}
          {etiquetasDisponibles.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Etiquetas disponibles:</p>
              <div className="flex flex-wrap gap-1">
                {etiquetasDisponibles
                  .filter(etiqueta => !values.etiquetas?.includes(etiqueta))
                  .slice(0, 10)
                  .map((etiqueta, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInputChange('etiquetas', [...(values.etiquetas || []), etiqueta])}
                      className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs hover:bg-gray-600/30 transition-colors"
                      disabled={loading || s3Loading}
                    >
                      {etiqueta}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Error de S3 */}
        {s3Error && (
          <div className="text-red-500 text-sm bg-red-100 dark:bg-red-900/20 p-3 rounded">
            Error: {s3Error}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!isFormValid || loading || s3Loading}
            className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(loading || s3Loading) && <FaSpinner className="animate-spin" />}
            {submitLabel}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              disabled={loading || s3Loading}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RecursoFormS3;
