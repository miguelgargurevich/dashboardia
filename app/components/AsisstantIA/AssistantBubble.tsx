"use client";
import { useState, useRef, useEffect } from "react";
import { FaRobot } from "react-icons/fa";
import { useConfig, getIconComponent } from '../../lib/useConfig';
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
    for (const line of lines) {
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
import { usePathname } from 'next/navigation';
// Componente de Asistente IA

type TipoRecurso = { id: string; nombre: string; descripcion: string; color: string; icono?: React.ReactNode };

type Message = { role: string; content: string };

export default function AssistantBubble() {
  const pathname = usePathname();
  
  // Hooks para configuración dinámica
  const { items: recursosConfig } = useConfig('recursos');
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
    : `🤖 ¡Hola! ¿En qué puedo ayudarte hoy?

Puedes pedirme que cree una nota, que organice algún recurso o que revise el calendario.

Por ejemplo, dime algo como: "Crea una nota sobre la nueva política de seguridad".`;

  // Inicializa mensajes solo una vez al montar
  useEffect(() => {
    setMessages([{ role: 'assistant', content: initialPrompt }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoginPage]);

  // Configurar tipos de recursos desde el hook de configuración
  useEffect(() => {
    if (recursosConfig.length > 0) {
      setTiposRecursos(recursosConfig.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        descripcion: t.descripcion || '',
        color: t.color,
        icono: (() => {
          const IconComponent = getIconComponent(t.icono || 'fa-file-alt') as React.ComponentType<{ className?: string }>;
          return <IconComponent className="text-accent" />;
        })()
      })));
    }
  }, [recursosConfig]);

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

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const value = (target?.value as string) || input;
    if (!value.trim() && attachedFiles.length === 0) { setLoading(false); return; }
    setLoading(true);
    // Si hay archivos adjuntos y está logueado, subir primero
    if (attachedFiles.length > 0 && canAttach) {
      setMessages(msgs => [...msgs, { role: 'user', content: `Adjuntando archivos: ${attachedFiles.map(f => f.name).join(', ')}` }]);
      try {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('topic', value || 'General');
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
            // Crear recurso automáticamente con categoría básica
            const categoria = 'General';
            const resourcePayload = {
              tipo: 'archivo',
              titulo: file.name,
              descripcion: value || '',
              filePath,
              tags: [categoria],
              categoria: categoria
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
      } catch {
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
        setMessages(msgs => [...msgs, { role: 'assistant', content: `Tipos de recursos disponibles: ${recursosSugeridos}. Puedes usar tags para organizar tu contenido. ¿En qué más puedo ayudarte?` }]);
      } else {
        setMessages(msgs => [...msgs, { role: 'assistant', content: '¿En qué más puedo ayudarte? Puedes preguntarme sobre registro, login, funcionalidades del dashboard, o cómo agrupar notas y recursos por tags.' }]);
      }
      setInput('');
      setLoading(false);
      return;
    }

    // Flujos inteligentes para crear nota y recursos
    setMessages(msgs => [...msgs, { role: 'user', content: value }]);

    // Detectar si el usuario quiere crear una nota con una descripción específica
    if (/crear nota|nueva nota|crea una nota/i.test(value) && value.toLowerCase().includes('sobre')) {
      // Extraer el tema del mensaje del usuario para usar en tags
      const sobreMatch = value.toLowerCase().match(/sobre\s+(.+?)(\.|$|,)/);
      const categoria = sobreMatch ? sobreMatch[1].trim() : 'general';
      const tagsDetectados = [categoria];
      
      // Generar título automático basado en el contenido
      const tituloAuto = `Nota sobre ${categoria} - ${new Date().toLocaleDateString()}`;
      
      // Crear la nota directamente
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessages(msgs => [...msgs, { role: 'assistant', content: 'Necesitas iniciar sesión para crear notas.' }]);
          setInput('');
          setLoading(false);
          return;
        }

        const noteData = {
          title: tituloAuto,
          content: value,
          tipo: 'nota',
          tags: tagsDetectados,
          status: 'activo',
          priority: 'media'
        };

        console.log('🟡 Frontend: Sending note data:', noteData);

        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${apiUrl}/api/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(noteData)
        });

        if (res.ok) {
          setMessages(msgs => [...msgs, { role: 'assistant', content: `¡Perfecto! He creado una nota con el contenido que proporcionaste. La nota ha sido guardada exitosamente.` }]);
        } else {
          const errorText = await res.text();
          console.error('Error creating note:', res.status, errorText);
          setMessages(msgs => [...msgs, { role: 'assistant', content: `Hubo un error al crear la nota: ${errorText}. Por favor, inténtalo de nuevo.` }]);
        }
      } catch (err) {
        console.error('Network error creating note:', err);
        setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error al crear la nota. Verifica tu conexión e inténtalo de nuevo.' }]);
      }
      setInput('');
      setLoading(false);
      return;
    }

    // Si el usuario solo dice "crear nota" sin descripción, pedirle más información
    if (/^(crear nota|nueva nota|agregar nota)$/i.test(value.trim())) {
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Por favor, especifica sobre qué tema quieres crear la nota. Por ejemplo: "Crea una nota sobre la nueva política de seguridad en el tema de Soporte Técnico".' }]);
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
      console.error('Error al conectar con el asistente IA:', err);
      setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error al conectar con el asistente IA.' }]);
    }
    setInput('');
    setLoading(false);
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
