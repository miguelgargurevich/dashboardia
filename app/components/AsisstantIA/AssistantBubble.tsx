"use client";
import { useState, useRef, useEffect } from "react";
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

type MessageContent =
  | string
  | { type: 'cancel', text: string }
  | { type: 'login-options', text: string };
type Message = { role: string; content: MessageContent };

export default function AssistantBubble() {
  const pathname = usePathname();
  // Cierra el chat IA si recibe el evento personalizado 'close-assistant-bubble'
  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener('close-assistant-bubble', handler);
    return () => window.removeEventListener('close-assistant-bubble', handler);
  }, []);
  useEffect(() => {
    const handler = () => {
      setOpen((prev) => prev ? true : true);
    };
    window.addEventListener('open-assistant-bubble', handler);
    return () => window.removeEventListener('open-assistant-bubble', handler);
  }, []);
  // Detecta si está en la página de login
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
  const initialPrompt = isLoginPage
    ? `¡Hola! Soy tu asistente IA para el Dashboard de Soporte Técnico.\n¿Quieres crear una cuenta nueva, iniciar sesión o saber más sobre el dashboard?`
    : `<div style='font-family:Poppins,sans-serif;'>
        <h2 style='font-size:1.15em;font-weight:bold;color:#f7b787;margin-bottom:0.3em;'>¡Hola! Soy tu asistente IA para el Dashboard de Soporte Técnico.</h2>
        <div style='font-size:0.98em;color:#fff;margin-bottom:0.4em;'>Puedo ayudarte con:</div>
        <ul style='margin-left:1.2em;margin-bottom:0.5em;color:#fff;line-height:1.3;'>
          <li style='margin-bottom:0.15em;display:flex;align-items:center;gap:0.5em;'>
            <svg width='18' height='18' fill='#f7b787' style='display:block;'><path d='M3 3h12v2H3V3zm0 4h12v2H3V7zm0 4h8v2H3v-2z'/></svg>
            <span style='display:block;'>Crear y gestionar notas, URLs y recursos con IA</span>
          </li>
          <li style='margin-bottom:0.15em;display:flex;align-items:center;gap:0.5em;'>
            <svg width='18' height='18' fill='#f7b787' style='display:block;'><path d='M9 2a7 7 0 1 1 0 14A7 7 0 0 1 9 2zm0 2a5 5 0 1 0 0 10A5 5 0 0 0 9 4zm1 2v4l3 2-1 1-4-2V6h2z'/></svg>
            <span style='display:block;'>Sugerir artículos y soluciones</span>
          </li>
          <li style='margin-bottom:0.15em;display:flex;align-items:center;gap:0.5em;'>
            <svg width='18' height='18' fill='#f7b787' style='display:block;'><circle cx='9' cy='9' r='7'/><rect x='8' y='4' width='2' height='6' fill='#fff'/><rect x='8' y='10' width='2' height='4' fill='#fff'/></svg>
            <span style='display:block;'>Buscar información por texto, tags, tipo, fecha</span>
          </li>
          <li style='margin-bottom:0.15em;display:flex;align-items:center;gap:0.5em;'>
            <svg width='18' height='18' fill='#f7b787' style='display:block;'><path d='M4 9h10v2H4V9zm0-4h10v2H4V5zm0 8h6v2H4v-2z'/></svg>
            <span style='display:block;'>Relacionar elementos entre sí</span>
          </li>
          <li style='margin-bottom:0.15em;display:flex;align-items:center;gap:0.5em;'>
            <svg width='18' height='18' fill='#f7b787' style='display:block;'><circle cx='9' cy='9' r='7'/><text x='9' y='13' text-anchor='middle' font-size='8' fill='#fff'>?</text></svg>
            <span style='display:block;'>Responder preguntas técnicas y de productividad</span>
          </li>
          <li style='margin-bottom:0.15em;display:flex;align-items:center;gap:0.5em;'>
            <svg width='18' height='18' fill='#f7b787' style='display:block;'><rect x='3' y='3' width='12' height='12' rx='2'/><rect x='6' y='6' width='6' height='6' fill='#fff'/></svg>
            <span style='display:block;'>Crear eventos, tickets y registros</span>
          </li>
        </ul>
        <div style='font-size:0.98em;color:#f7b787;font-weight:bold;'>¡Escríbeme "crear nota", "agregar URL" o "subir recurso" para empezar!</div>
      </div>`;
  const [open, setOpen] = useState(false);
  // Eliminado: const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
  { role: 'system', content: initialPrompt }
]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  // Estado para adjuntos (múltiples archivos)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  // Solo permitir adjuntar si NO está en login (usuario logueado)
  const canAttach = pathname !== '/login';

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Estado para registro guiado
  // Registro guiado: nombre, email, rol/departamento
  const [signupStep, setSignupStep] = useState<'none'|'email'|'confirm'|'done'|'confirm-resend'|'login'>('none');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
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
          formData.append('topic', value || 'Sin tema');
          const apiUrl = process.env.BACKEND_URL + "/api" || '';
          const res = await fetch(`${apiUrl}/upload`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) {
            setMessages(msgs => [...msgs, { role: 'assistant', content: `Error al subir el archivo: ${file.name}` }]);
          } else {
            setMessages(msgs => [...msgs, { role: 'assistant', content: `Archivo adjuntado correctamente: ${file.name}` }]);
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

    // Flujo especial para registro guiado SOLO en login
    if (isLoginPage) {
      // Paso inicial: usuario pide registrarse
      if (signupStep === 'none' && value.toLowerCase().includes('registr')) {
        setMessages(msgs => [
          ...msgs,
          { role: 'user', content: value },
          { role: 'assistant', content: '¡Excelente! Para crear tu cuenta, ingresa tu correo electrónico.' }
        ]);
        setSignupStep('email');
        setInput('');
        setLoading(false);
        return;
      }
      // Paso inicial: usuario pide login
      if (signupStep === 'none' && value.toLowerCase().includes('login')) {
        setMessages(msgs => [
          ...msgs,
          { role: 'user', content: value },
          { role: 'assistant', content: 'Por favor, ingresa tu correo electrónico para iniciar sesión.' }
        ]);
        setSignupStep('login');
        setInput('');
        setLoading(false);
        return;
      }
      // Paso login: pedir correo
      if (signupStep === 'login' && !loginEmail) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
          setMessages(msgs => [...msgs, { role: 'user', content: value }, { role: 'assistant', content: 'El correo no es válido. Intenta de nuevo.' }]);
          setInput('');
          setLoading(false);
          return;
        }
        setLoginEmail(value.trim());
        setMessages(msgs => [
          ...msgs,
          { role: 'user', content: value },
          { role: 'assistant', content: 'Ahora ingresa tu clave.' }
        ]);
        setInput('');
        setLoading(false);
        return;
      }
      // Paso login: pedir clave y validar
      if (signupStep === 'login' && loginEmail && !loginPassword) {
        setLoginPassword(value.trim());
        setMessages(msgs => [
          ...msgs,
          { role: 'user', content: '••••••••' },
          { role: 'assistant', content: 'Validando credenciales...' }
        ]);
        try {
          const apiUrl = process.env.BACKEND_URL + "/api" || '';
          const res = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginEmail, password: value.trim() })
          });
          const data = await res.json();
          if (res.ok && data.token) {
            setMessages(msgs => [...msgs, { role: 'assistant', content: '¡Login exitoso! Bienvenido al dashboard.' }]);
            // Guardar el token en localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', data.token);
            }
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1200);
          } else {
            setMessages(msgs => [
              ...msgs,
              { role: 'assistant', content: 'Credenciales incorrectas. Intenta de nuevo.' },
              { role: 'assistant', content: { type: 'login-options', text: '¿Qué deseas hacer ahora?' } }
            ]);
          }
        } catch (err) {
          setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error al conectar con el backend.' }]);
        }
        setSignupStep('none');
        setLoginEmail('');
        setLoginPassword('');
        setInput('');
        setLoading(false);
        return;
      }
      // Paso único: correo electrónico
      if (signupStep === 'email') {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
          setMessages(msgs => [...msgs, { role: 'user', content: value }, { role: 'assistant', content: 'El correo no es válido. Intenta de nuevo.' }]);
          setInput('');
          setLoading(false);
          return;
        }
        setSignupEmail(value.trim());
        setMessages(msgs => [
          ...msgs,
          { role: 'user', content: value },
          { role: 'assistant', content: '¿Confirmas que tu correo es correcto?' }
        ]);
        setSignupStep('confirm');
        setInput('');
        setLoading(false);
        return;
      }
      // Paso 2: confirmación con botones
      if (signupStep === 'confirm') {
        if (/^s[ií]$/i.test(value.trim()) || value === 'Sí') {
          const clave = Math.random().toString(36).slice(-8);
          setSignupPassword(clave);
          setMessages(msgs => [
            ...msgs,
            { role: 'user', content: 'Sí' },
            { role: 'assistant', content: 'Creando tu cuenta y enviando el correo de acceso. Un momento por favor...' }
          ]);
          try {
            const apiUrl = process.env.BACKEND_URL + "/api" || '';
            const res = await fetch(`${apiUrl}/signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: signupEmail,
                password: clave
              })
            });
            if (!res.ok) {
              const data = await res.json();
              if (data.error && /existe|existente|registrado/i.test(data.error)) {
                setMessages(msgs => [...msgs, { role: 'assistant', content: 'Este correo ya está registrado. ¿Deseas que te reenvíe la clave temporal a tu correo?'}]);
                setSignupStep('confirm-resend');
                setLoading(false);
                return;
              } else {
                setMessages(msgs => [...msgs, { role: 'assistant', content: 'Hubo un error creando el usuario: ' + (data.error || 'Error desconocido') }]);
                setSignupStep('done');
                setLoading(false);
                return;
              }
            }
            await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(signupEmail), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: signupEmail,
                message: `¡Bienvenido/a!\nTu cuenta para el Dashboard IA ha sido creada.\nTu clave temporal es: ${clave}\nPor seguridad, cámbiala al iniciar sesión.`
              })
            });
            setMessages(msgs => [...msgs, { role: 'assistant', content: '¡Listo! Ya te enviamos tus credenciales por correo electrónico. Revisa tu bandeja de entrada.' }]);
          } catch (error) {
            setMessages(msgs => [...msgs, { role: 'assistant', content: 'Hubo un error creando el usuario o enviando el correo.' }]);
          }
          setSignupStep('done');
          setLoading(false);
          return;
        } else if (/^n[o]?$/i.test(value.trim()) || value === 'No') {
        setMessages(msgs => [
          ...msgs,
          { role: 'user', content: 'No' },
          { role: 'assistant', content: { type: 'cancel', text: 'Registro cancelado.' } }
        ]);
        setSignupStep('none');
        setInput('');
        setLoading(false);
        return;
        }
      }
      // Paso 3: reenviar clave si usuario ya existe
      if (signupStep === 'confirm-resend') {
        if (/^s[ií]$/i.test(value.trim())) {
          await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(signupEmail), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: signupEmail,
              name: 'User',
              message: `Hola,\nTu clave temporal para el Dashboard IA es: ${signupPassword}\nRecuerda cambiarla al iniciar sesión.`
            })
          });
          setMessages(msgs => [...msgs, { role: 'user', content: value }, { role: 'assistant', content: 'La clave ha sido reenviada a tu correo electrónico. Revisa tu bandeja de entrada.' }]);
          setSignupStep('done');
          setInput('');
          setLoading(false);
          return;
        } else {
          setMessages(msgs => [...msgs, { role: 'user', content: value }, { role: 'assistant', content: 'No se ha reenviado la clave. Si necesitas ayuda, escribe "login" o consulta las opciones.' }]);
          setSignupStep('done');
          setInput('');
          setLoading(false);
          return;
        }
      }
      // Paso final: cuenta creada
      if (signupStep === 'done') {
        setMessages(msgs => [...msgs, { role: 'user', content: value }, { role: 'assistant', content: 'Ya tienes tu cuenta creada. Puedes iniciar sesión con tu correo y la clave enviada.' }]);
        setInput('');
        setLoading(false);
        return;
      }
      // Si no es registro guiado, PERMITIR chat IA normal
      if (signupStep === 'none') {
        setMessages(msgs => [...msgs, { role: 'user', content: value }]);
        try {
          const apiUrl = process.env.BACKEND_URL + "/api" || '';
          const res = await fetch(`${apiUrl}/assistant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [...messages.filter(m => m.role !== 'system'), { role: 'user', content: value }] })
          });
          const data = await res.json();
          setMessages(msgs => [...msgs, { role: 'assistant', content: data.reply }]);
        } catch (err) {
          setMessages(msgs => [...msgs, { role: 'assistant', content: 'Error al conectar con el asistente IA.' }]);
        }
        setInput('');
        setLoading(false);
        return;
      }
      // Si no es registro guiado y no entra en ningún caso, ignora
      setLoading(false);
      return;
    }

    // Flujo normal de chat IA (dashboard)
    setMessages(msgs => [...msgs, { role: 'user', content: value }]);
    try {
      const apiUrl = process.env.BACKEND_URL + "/api" || '';
      const res = await fetch(`${apiUrl}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages.filter(m => m.role !== 'system'), { role: 'user', content: value }] })
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
                    {msg.role === 'system' && isLoginPage ? (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(initialPrompt) }} />
                        <div className="flex gap-4 mt-4">
                          <button
                            className="px-6 py-3 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
                            onClick={() => {
                              setLoading(true);
                              sendMessage({ preventDefault: () => {}, target: { value: 'registrarme' } } as any);
                            }}
                          >
                            Registrarme
                          </button>
                          <button
                            className="px-6 py-3 rounded-lg bg-gray-500 text-white font-bold font-poppins hover:bg-gray-400 transition-colors shadow-md"
                            onClick={() => {
                              setLoading(true);
                              sendMessage({ preventDefault: () => {}, target: { value: 'login' } } as any);
                            }}
                          >
                            Login
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-300">También puedes preguntar sobre las capacidades del dashboard.</div>
                      </>
                    ) : typeof msg.content === 'object' && 'type' in msg.content && msg.content.type === 'cancel' ? (
                      <>
                        <div>{msg.content.text}</div>
                        <button
                          className="mt-2 px-6 py-3 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
                          onClick={() => {
                            setLoading(true);
                            sendMessage({ preventDefault: () => {}, target: { value: 'registrarme' } } as any);
                          }}
                        >
                          Registrarme
                        </button>
                      </>
                    ) : typeof msg.content === 'object' && 'type' in msg.content && msg.content.type === 'login-options' ? (
                      <>
                        <div>{msg.content.text}</div>
                        <div className="flex gap-4 mt-2">
                          <button
                            className="px-6 py-3 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
                            onClick={() => {
                              setLoading(true);
                              sendMessage({ preventDefault: () => {}, target: { value: 'registrarme' } } as any);
                            }}
                          >
                            Registrarme
                          </button>
                          <button
                            className="px-6 py-3 rounded-lg bg-gray-500 text-white font-bold font-poppins hover:bg-gray-400 transition-colors shadow-md"
                            onClick={() => {
                              setLoading(true);
                              sendMessage({ preventDefault: () => {}, target: { value: 'login' } } as any);
                            }}
                          >
                            Login
                          </button>
                        </div>
                      </>
                    ) : (
                      typeof msg.content === 'string'
                        ? <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                        : null
                    )}
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
            {isLoginPage && signupStep === 'email' ? (
              <form
                className="flex gap-2 p-4 border-t border-accent"
                onSubmit={sendMessage}
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ingresa tu correo electrónico..."
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
            ) : isLoginPage && signupStep === 'confirm' ? (
              <div className="flex gap-4 p-4 border-t border-accent">
                <button
                  className="px-6 py-3 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
                  disabled={loading}
                  onClick={() => { sendMessage({ preventDefault: () => {}, target: { value: 'Sí' } } as any); }}
                >
                  Sí
                </button>
                <button
                  className="px-6 py-3 rounded-lg bg-gray-500 text-white font-bold font-poppins hover:bg-gray-400 transition-colors shadow-md"
                  disabled={loading}
                  onClick={() => { sendMessage({ preventDefault: () => {}, target: { value: 'No' } } as any); }}
                >
                  No
                </button>
              </div>
            ) : isLoginPage && signupStep === 'confirm-resend' ? (
              <div className="flex gap-4 p-4 border-t border-accent">
                <button
                  className="px-6 py-3 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
                  disabled={loading}
                  onClick={() => { sendMessage({ preventDefault: () => {}, target: { value: 'Sí' } } as any); }}
                >
                  Sí
                </button>
                <button
                  className="px-6 py-3 rounded-lg bg-gray-500 text-white font-bold font-poppins hover:bg-gray-400 transition-colors shadow-md"
                  disabled={loading}
                  onClick={() => { sendMessage({ preventDefault: () => {}, target: { value: 'No' } } as any); }}
                >
                  No
                </button>
              </div>
            ) : (
              <form
                className="flex gap-2 p-4 border-t border-accent"
                onSubmit={sendMessage}
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Escribe tu consulta..."
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
     
}
