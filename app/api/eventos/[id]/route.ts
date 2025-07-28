import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Obtener un evento por ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(event);
}

// PUT: Editar evento
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const event = await prisma.event.update({ where: { id: params.id }, data });
  return NextResponse.json(event);
}

// DELETE: Eliminar evento
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
