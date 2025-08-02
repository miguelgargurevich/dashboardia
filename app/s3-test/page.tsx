'use client';

import { useState } from 'react';
import FileUploadS3 from '../components/FileUploadS3';
import useRecursosS3 from '../hooks/useRecursosS3';

export default function S3TestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const { uploadRecurso, getDownloadUrl, deleteFileFromS3 } = useRecursosS3();

  const addTestResult = (message: string, type: 'success' | 'error' | 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const testS3Connection = async () => {
    try {
      addTestResult('🧪 Probando conexión con S3...', 'info');
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/s3/test`);
      const data = await response.json();
      
      if (data.status === 'ok') {
        addTestResult('✅ Configuración S3 correcta', 'success');
        
        const connResponse = await fetch(`${backendUrl}/api/s3/test-connection`);
        const connData = await connResponse.json();
        
        if (connData.status === 'success') {
          addTestResult(`✅ Conexión S3 exitosa - ${connData.filesFound} archivos encontrados`, 'success');
        } else {
          addTestResult(`❌ Error conectando a S3: ${connData.error}`, 'error');
        }
      } else {
        addTestResult(`❌ Error en configuración S3: ${data.error}`, 'error');
      }
    } catch (error: any) {
      addTestResult(`❌ Error probando S3: ${error.message}`, 'error');
    }
  };

  const handleUploadComplete = (result: any) => {
    if (result.success) {
      addTestResult(`✅ Archivo subido: ${result.recurso.titulo}`, 'success');
      addTestResult(`🔗 S3 Key: ${result.recurso.s3Key}`, 'info');
    } else {
      addTestResult(`❌ Error subiendo archivo: ${result.error}`, 'error');
    }
  };

  const testDownload = async (s3Key: string) => {
    try {
      addTestResult(`🔽 Probando descarga de: ${s3Key}`, 'info');
      const url = await getDownloadUrl(s3Key);
      
      if (url) {
        addTestResult(`✅ URL de descarga generada`, 'success');
        window.open(url, '_blank');
      } else {
        addTestResult(`❌ Error generando URL de descarga`, 'error');
      }
    } catch (error: any) {
      addTestResult(`❌ Error en descarga: ${error.message}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Prueba del Sistema S3
        </h1>

        {/* Prueba de configuración */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Prueba de Configuración</h2>
          <button
            onClick={testS3Connection}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Probar Conexión S3
          </button>
        </div>

        {/* Prueba de subida */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Prueba de Subida de Archivos</h2>
          <FileUploadS3
            categoria="test"
            subcategoria="pruebas"
            onUploadComplete={handleUploadComplete}
            multiple={true}
            maxFileSize={10} // 10MB para pruebas
          />
        </div>

        {/* Resultados de pruebas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">3. Resultados de Pruebas</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No hay resultados aún. Ejecuta las pruebas arriba.</p>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    result.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : result.type === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  <span className="text-sm text-gray-500">[{result.timestamp}]</span>{' '}
                  {result.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Información del sistema */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">ℹ️ Información del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Frontend:</strong> {window.location.origin}
            </div>
            <div>
              <strong>Backend:</strong> {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}
            </div>
            <div>
              <strong>S3 Bucket:</strong> dashborad
            </div>
            <div>
              <strong>S3 Region:</strong> us-east-1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
