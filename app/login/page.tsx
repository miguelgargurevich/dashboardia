declare global {
  interface Window {
    openAssistantBubble?: () => void;
  }
}
"use client";
import { useState } from 'react';
import { FaRobot } from 'react-icons/fa';
if (typeof window !== 'undefined') {
  window.openAssistantBubble = () => {
    console.log('[Login] Despachando evento open-assistant-bubble');
    const evt = new CustomEvent('open-assistant-bubble');
    window.dispatchEvent(evt);
  };
}
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary via-[#16213e] to-accent font-inter">
      {/* Izquierda: Formulario de login */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-primary">
        <div className="w-full max-w-sm bg-primary rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold mb-6 text-accent text-center font-poppins">Iniciar sesión</h2>
          <form
            className="space-y-4"
            onSubmit={async e => {
              e.preventDefault();
              setError('');
              try {
                const res = await fetch('http://localhost:4000/api/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                if (!res.ok) {
                  const data = await res.json();
                  setError(data.error || 'Error de autenticación');
                  return;
                }
                // Si login OK, guarda el token y redirige al dashboard
                const data = await res.json();
                localStorage.setItem('token', data.token);
                router.push('/dashboard');
              } catch (err) {
                setError('No se pudo conectar al backend');
              }
            }}
          >
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a2636]/80 text-white border border-accent focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-300 font-inter"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a2636]/80 text-white border border-accent focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-300 font-inter"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
            >
              Acceder
            </button>
            {error && (
              <div className="mt-2 text-red-400 text-sm text-center">{error}</div>
            )}
          </form>
        </div>
      </div>
      {/* Derecha: Robot IA con animación de pulso */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-[#16213e] relative">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-accent p-6 shadow-2xl animate-pulse cursor-pointer" onClick={() => window.openAssistantBubble && window.openAssistantBubble()}>
            <FaRobot size={80} color="#0D1B2A" />
          </div>
          <span className="mt-6 text-lg font-semibold text-accent font-poppins">Asistente IA</span>
        </div>
      </div>
    </div>
  );
}
