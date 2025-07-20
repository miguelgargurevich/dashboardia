"use client";
import './globals.css'; // IGNORE
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-primary text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
