"use client";
import './globals.css'; // IGNORE
import type { ReactNode } from 'react';
import AssistantBubble from './components/AssistantBubble';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [showAssistant, setShowAssistant] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkShow = () => {
        const token = localStorage.getItem('token');
        const isLogin = window.location.pathname === '/login';
        setShowAssistant(!!token || isLogin);
      };
      checkShow();
      window.addEventListener('storage', checkShow);
      window.addEventListener('popstate', checkShow);
      window.addEventListener('pushstate', checkShow);
      return () => {
        window.removeEventListener('storage', checkShow);
        window.removeEventListener('popstate', checkShow);
        window.removeEventListener('pushstate', checkShow);
      };
    }
  }, []);
  return (
    <html lang="es">
      <body className="bg-primary text-white min-h-screen">
        {children}
        {showAssistant && <AssistantBubble />}
      </body>
    </html>
  );
}
