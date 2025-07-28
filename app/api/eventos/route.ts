import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Listar todos los eventos
export async function GET(req: NextRequest) {
  const events = await prisma.event.findMany({ orderBy: { startDate: 'asc' } });
  return NextResponse.json(events);
}

// POST: Crear evento
export async function POST(req: NextRequest) {
  const data = await req.json();
  const event = await prisma.event.create({ data });
  return NextResponse.json(event);
}
