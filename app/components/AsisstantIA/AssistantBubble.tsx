"use client";
import { useState, useRef, useEffect } from "react";
import { FaFileAlt, FaLink, FaVideo, FaBrain, FaAddressBook, FaClipboardList, FaLayerGroup } from "react-icons/fa";
// Simple Markdown a HTML (bold, listas, saltos de línea, tablas)
function markdownToHtml(text: string): string {
  if (!text) return '';
  let html = text;
  // Negritas **texto** o __texto__
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  html = html.replace(/__(.*?)__/g, '<b>$1</b>');
  // Saltos de línea
  html = html.replace(/\n/g, '<br/>');
  // Listas con - o *
  html = html.replace(/(^|<br\/>)[\s]*[-*][ ](.*?)(?=<br\/>|$)/g, '$1<li>$2</li>');
  // Agrupar <li> en <ul>
  html = html.replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`);
  // Tablas simples: |col1|col2|\n|---|---|\n|val1|val2|
  if (/\|.*\|/.test(html)) {
    const lines = html.split(/<br\/>/);
    let table = '';
    let inTable = false;
    for (let line of lines) {
      if (/^\|(.+)\|$/.test(line.trim())) {
        const cells = line.trim().split('|').filter(Boolean);
        if (!inTable) { table += '<table><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr>'; inTable = true; }
        else { table += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>'; }
      } else {
        if (inTable) { table += '</table>'; inTable = false; }
        table += line + '<br/>';
      }
    }
    if (inTable) table += '</table>';
    html = table;
  }
  return html;
}
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot } from "react-icons/fa";
import { usePathname } from 'next/navigation';
// Importa los temas desde knowledge/page.tsx

// Carga dinámica de temas desde public/temas.json

type TipoRecurso = { id: string; nombre: string; descripcion: string; color: string; icono?: React.ReactNode };

type Message = { role: string; content: string };

export default function AssistantBubble() {
  const pathname = usePathname();
  const [temasActuales, setTemasActuales] = useState<string[]>([]);
  const [temasFull, setTemasFull] = useState<any[]>([]);
  const [tiposRecursos, setTiposRecursos] = useState<TipoRecurso[]>([]);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const canAttach = pathname !== '/login';

  // Detecta si está en la página de login
  const isLoginPage = pathname === '/login';
  // Conversational, text-only initial prompt
  const initialPrompt = isLoginPage
    ? '🤖 ¡Hola! Soy tu asistente experto en soporte. Puedes preguntarme cómo registrarte, iniciar sesión o qué puedes hacer en el dashboard. Ejemplo: "¿Cómo me registro?"'
    : `🤖 ¡Hola! Soy tu asistente experto. Puedes pedirme que cree notas, suba recursos, agregue URLs, consulte eventos, o cualquier otra tarea.\n\nAl crear una nota o recurso, te sugeriré los temas actuales: (cargando temas...). El tag se colocará automáticamente según el tema seleccionado, pero puedes agregar otros tags si lo deseas.\n\nEjemplo: "Crea una nota para el evento de hoy y adjunta estos archivos".`;

  // Inicializa mensajes solo una vez al montar
  useEffect(() => {
    setMessages([{ role: 'assistant', content: initialPrompt }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoginPage]);

  useEffect(() => {
    fetch('/api/config/temas')
      .then(res => res.json())
      .then((data: any[]) => {
        setTemasFull(data);
        setTemasActuales(data.map(t => t.nombre));
      })
      .catch(err => {
        console.error('Error cargando temas:', err);
        // Temas por defecto
        const temasDefault = [
          { nombre: 'General', descripcion: 'Tema general', color: 'bg-blue-500' },
          { nombre: 'Desarrollo', descripcion: 'Desarrollo', color: 'bg-green-500' }
        ];
        setTemasFull(temasDefault);
        setTemasActuales(temasDefault.map(t => t.nombre));
      });
  }, []);

  useEffect(() => {
    fetch('/api/config/tipos-recursos')
      .then(res => res.json())
      .then((data) => {
        const iconMap: Record<string, React.ReactNode> = {
          'url': <FaLink className="text-accent" />,
          'archivo': <FaFileAlt className="text-accent" />,
          'video': <FaVideo className="text-accent" />,
          'ia-automatizacion': <FaBrain className="text-accent" />,
          'contactos-externos': <FaAddressBook className="text-accent" />,
          'plantillas-formularios': <FaClipboardList className="text-accent" />
        };
        setTiposRecursos(data.map((t: any) => ({ ...t, icono: iconMap[t.id] || <FaLayerGroup className="text-accent" /> })));
      })
      .catch(err => {
        console.error('Error cargando tipos de recursos:', err);
        // Tipos por defecto
        const tiposDefault = [
          { id: 'url', nombre: 'URL', descripcion: 'Enlace web', color: 'text-blue-500' },
          { id: 'archivo', nombre: 'Archivo', descripcion: 'Documento', color: 'text-green-500' }
        ];
        const iconMap: Record<string, React.ReactNode> = {
          'url': <FaLink className="text-accent" />,
          'archivo': <FaFileAlt className="text-accent" />
        };
        setTiposRecursos(tiposDefault.map((t: any) => ({ ...t, icono: iconMap[t.id] || <FaLayerGroup className="text-accent" /> })));
      });
  }, []);

  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener('close-assistant-bubble', handler);
    return () => window.removeEventListener('close-assistant-bubble', handler);
  }, []);
  useEffect(() => {
    const handler = () => {
      setOpen(true);
    };
    window.addEventListener('open-assistant-bubble', handler);
    return () => window.removeEventListener('open-assistant-bubble', handler);
  }, []);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Conversational: remove all wizard and step state
  
  // Remove all wizard and step-based flows. All logic will be conversational and context-aware.

  // Funciones auxiliares para extraer datos

  // Remove handleAddUrl and handleUploadResource. All handled in sendMessage.

  async function sendMessage(e: any) {
    e.preventDefault();
    const value = e.target?.value || input;
    if (!value.trim() && attachedFiles.length === 0) { setLoading(false); return; }
    setLoading(true);
    // Si hay archivos adjuntos y está logueado, subir primero
    if (attachedFiles.length > 0 && canAttach) {
      setMessages(msgs => [...msgs, { role: 'user', content: `Adjuntando archivos: ${attachedFiles.map(f => f.name).join(', ')}` }]);
      try {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          // Usar el primer tema dinámico como fallback
          const temaFallback = temasFull[0]?.nombre || 'Sin tema';
          formData.append('topic', value || temaFallback);
          const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
          // Subir archivo
          const res = await fetch(`${apiUrl}/api/upload`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) {
            setMessages(msgs => [...msgs, { role: 'assistant', content: `Error al subir el archivo: ${file.name}` }]);
          } else {
            // Obtener ruta del archivo subido si la respuesta la incluye
            let filePath = null;
            try {
              const data = await res.json();
              filePath = data.filePath || null;
            } catch {}
            setMessages(msgs => [...msgs, { role: 'assistant', content: `Archivo adjuntado correctamente: ${file.name}` }]);
            // Crear recurso automáticamente
            const temaDetectado = temasActuales.find(t => (value || '').toLowerCase().includes(t.toLowerCase())) || temasFull[0]?.nombre || 'General';
            const resourcePayload = {
              tipo: 'archivo',
              titulo: file.name,
              descripcion: value || '',
              filePath,
              tags: [temaDetectado],
              categoria: temaDetectado
            };
            try {
              const resResource = await fetch(`${apiUrl}/api/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resourcePayload)
              });
              if (resResource.ok) {
                setMessages(msgs => [...msgs, { role: 'assistant', content: `Recurso creado automáticamente para el archivo: ${file.name}` }]);
              } else {
                setMessages(msgs => [...msgs, { role: 'assistant', content: `Archivo subido pero no se pudo crear el recurso para: ${file.name}` }]);
              }
            } catch {
              setMessages(msgs => [...msgs, { role: 'assistant', content: `Archivo subido pero falló la creación del recurso para: ${file.name}` }]);
            }
          }
        }
      } catch (err) {
        setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error al subir los archivos.' }]);
      }
      setAttachedFiles([]);
      setInput('');
      setLoading(false);
      return;
    }

    // Conversational login/registration: all via free-form text, no buttons or step state
    if (isLoginPage) {
      setMessages(msgs => [...msgs, { role: 'user', content: value }]);
      // Try to detect registration or login intent
      if (/registr/i.test(value)) {
        setMessages(msgs => [...msgs, { role: 'assistant', content: 'Por favor, ingresa tu correo electrónico para registrarte.' }]);
      } else if (/login|iniciar sesi/i.test(value)) {
        setMessages(msgs => [...msgs, { role: 'assistant', content: 'Por favor, ingresa tu correo electrónico para iniciar sesión.' }]);
      } else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        // If email, ask for password
        setMessages(msgs => [...msgs, { role: 'assistant', content: 'Ahora ingresa tu clave.' }]);
      } else if (/^.{6,}$/.test(value)) {
        // If password (very basic check), try login
        setMessages(msgs => [...msgs, { role: 'assistant', content: 'Intentando iniciar sesión o registrar... (esto es un ejemplo, implementa lógica real aquí)' }]);
      } else if (/nota|recurso|crear|subir|agregar|nuevo|nueva|adjuntar|tag|etiqueta|tema/i.test(value)) {
        const recursosSugeridos = tiposRecursos.length > 0
          ? tiposRecursos.map(t => `${t.icono ? '' : ''}${t.nombre}`).join(', ')
          : 'archivo, url, video, etc.';
        setMessages(msgs => [...msgs, { role: 'assistant', content: `Temas sugeridos: ${temasActuales.join(', ')}. Tipos de recursos disponibles: ${recursosSugeridos}. El tag se colocará automáticamente según el tema seleccionado, pero puedes agregar otros tags si lo deseas.` }]);
      } else {
        setMessages(msgs => [...msgs, { role: 'assistant', content: '¿En qué más puedo ayudarte? Puedes preguntarme sobre registro, login, funcionalidades del dashboard, o cómo agrupar notas y recursos por temas/tags.' }]);
      }
      setInput('');
      setLoading(false);
      return;
    }

    // Flujos inteligentes para crear nota y recursos
    setMessages(msgs => [...msgs, { role: 'user', content: value }]);

    // Detectar si el usuario quiere crear una nota
    if (/nota|crear nota|nueva nota|agregar nota/i.test(value) && !/descrip/i.test(value)) {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Por favor, escribe la descripción de la nota. El título, tema y tags se generarán automáticamente.' }]);
      setInput('');
      setLoading(false);
      return;
    }

    // Si el mensaje es la descripción de la nota (después de pedirla)
    if (messages.length > 0 && /Por favor, escribe la descripción de la nota/.test(messages[messages.length-1].content)) {
      // Generar título automático: "Nota de Hoy - [tema]"
      // const hoy = new Date();
      // Extraer tema y tags de la descripción usando palabras clave de temas
      let temaDetectado = temasActuales.find(t => value.toLowerCase().includes(t.toLowerCase())) || temasFull[0]?.nombre || 'General';
      let tagsDetectados = [temaDetectado];
      // Título automático
      const tituloAuto = `Nota de Hoy - ${temaDetectado}`;
      // Si hay archivos adjuntos, crear recursos también
      if (attachedFiles.length > 0) {
        setMessages(msgs => [...msgs, { role: 'assistant', content: `Se detectaron archivos adjuntos. Se crearán recursos automáticamente con el tema y tags por defecto: ${temaDetectado}.` }]);
        // Aquí podrías llamar a la lógica de subida de recursos si lo deseas
      }
      // Enviar a backend la nota ya estructurada
      const notaPayload = `Título: ${tituloAuto}\nTema: ${temaDetectado}\nContenido: ${value}\nEtiquetas: ${tagsDetectados.join(', ')}`;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${apiUrl}/api/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, { role: 'user', content: notaPayload }] })
        });
        if (res.status === 401) {
          setMessages(msgs => [...msgs, { role: 'assistant', content: 'No tienes acceso a esa función. Por favor inicia sesión para continuar.' }]);
        } else {
          const data = await res.json();
          setMessages(msgs => [...msgs, { role: 'assistant', content: data.reply }]);
        }
      } catch (err) {
        setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error al conectar con el asistente IA.' }]);
      }
      setInput('');
      setLoading(false);
      return;
    }

    // Flujo normal: enviar mensaje al backend
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${apiUrl}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: value }] })
      });
      if (res.status === 401) {
        setMessages(msgs => [...msgs, { role: 'assistant', content: 'No tienes acceso a esa función. Por favor inicia sesión para continuar.' }]);
      } else {
        const data = await res.json();
        setMessages(msgs => [...msgs, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error al conectar con el asistente IA.' }]);
    }
    setInput('');
    setLoading(false);
  // Reinicia sugerencia de temas al abrir nueva conversación
  // Eliminado: useEffect para setTemaSugerido, ya no se usa
  }

  return (
    <>
      {/* Burbuja flotante solo si NO está en login */}
      {pathname !== '/login' && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-accent text-primary rounded-full shadow-lg w-16 h-16 flex items-center justify-center hover:bg-[#f7b787] transition-colors"
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente IA"
        >
          <FaRobot size={32} color="#0D1B2A" />
        </button>
      )}
      {/* Ventana del asistente IA SIEMPRE se renderiza si open es true */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-1/2 min-w-0 max-w-none bg-primary text-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header ajustado para altura igual a header y sidebar (56px) */}
            <div className="flex items-center justify-between h-14 px-6 border-b border-accent" style={{height:'56px'}}>
              <span className="font-poppins text-xl font-bold text-accent">Asistente IA</span>
              <button
                className="text-accent hover:text-[#f7b787] text-2xl font-bold"
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
              >
                ×
              </button>
            </div>
            {/* Mensajes y entrada */}
            <div
              className={`flex-1 flex flex-col justify-end p-4 overflow-y-auto ${canAttach ? 'border-dashed border-accent' : ''}`}
              ref={chatRef}
              onDragOver={canAttach ? (e) => { e.preventDefault(); setDragActive(true); } : undefined}
              onDragLeave={canAttach ? () => setDragActive(false) : undefined}
              onDrop={canAttach ? (e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setAttachedFiles(Array.from(e.dataTransfer.files));
                }
              } : undefined}
            >
            {/* Mensajes del chat IA */}
              {messages.map((msg, i) => (
                <div key={i} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 text-sm font-inter max-w-[80%] ${msg.role === 'user' ? 'bg-accent text-primary' : 'bg-accent/10 text-white'}`}>
                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mb-2 flex justify-start">
                  <div className="rounded-lg p-3 text-sm font-inter bg-accent/10 text-white animate-pulse">Pensando...</div>
                </div>
              )}
            {/* Adjuntos: solo si está logueado */}
            {canAttach && (
              <div className="flex items-center gap-2 mb-2 mt-4">
                <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2 text-accent hover:text-[#f7b787]">
                  <svg width="24" height="24" fill="currentColor" className="inline-block"><path d="M16.5 6.5a5 5 0 0 0-7.07 0l-5.66 5.66a5 5 0 0 0 7.07 7.07l6.36-6.36a3 3 0 0 0-4.24-4.24l-5.66 5.66a1 1 0 0 0 1.41 1.41l5.66-5.66a1 1 0 0 1 1.41 1.41l-6.36 6.36a3 3 0 0 1-4.24-4.24l5.66-5.66a5 5 0 0 1 7.07 7.07l-6.36 6.36a7 7 0 0 1-9.9-9.9l5.66-5.66a7 7 0 0 1 9.9 9.9l-6.36 6.36a9 9 0 0 1-12.73-12.73l5.66-5.66a9 9 0 0 1 12.73 12.73l-6.36 6.36a11 11 0 0 1-15.56-15.56l5.66-5.66a11 11 0 0 1 15.56 15.56l-6.36 6.36a13 13 0 0 1-18.39-18.39l5.66-5.66a13 13 0 0 1 18.39 18.39l-6.36 6.36"/>
                  </svg>
                  Adjuntar archivo
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setAttachedFiles(Array.from(e.target.files));
                    }
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.mp4,.avi,.mov,.jpg,.png,.jpeg"
                />
                {attachedFiles.length > 0 && (
                  <span className="text-xs text-accent">
                    {attachedFiles.map(f => f.name).join(', ')}
                  </span>
                )}
                {dragActive && (
                  <span className="text-xs text-accent">Suelta el archivo aquí...</span>
                )}
              </div>
            )}
            </div>
            {/* Formulario adaptativo para el wizard */}
            {/* Only show the main conversational input form for all cases */}
            <form
              key="main-form"
              className="flex gap-2 p-4 border-t border-accent"
              onSubmit={sendMessage}
            >
              <input
                key="main-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isLoginPage ? "Escribe tu consulta, correo o clave..." : "Escribe tu consulta..."}
                className="flex-1 px-4 py-3 rounded-lg bg-[#1a2636]/80 text-white border border-accent focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-300 font-inter"
                disabled={loading}
              />
              <button
                type="submit"
                className="px-4 py-3 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
                disabled={loading || !input.trim()}
              >
                Enviar
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
     
}
