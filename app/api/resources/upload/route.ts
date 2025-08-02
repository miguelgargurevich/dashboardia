import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    // Obtener el FormData del request
    const formData = await request.formData();

    // Crear nuevo FormData para enviar al backend
    const backendFormData = new FormData();
    
    // Copiar todos los campos del FormData original
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value);
    }

    // Hacer la petición al backend
    const response = await fetch(`${BACKEND_URL}/api/resources/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Error en el backend' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en proxy de upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const subcategoria = searchParams.get('subcategoria');

    let url = `${BACKEND_URL}/api/resources/files`;
    const params = new URLSearchParams();
    
    if (categoria) params.append('categoria', categoria);
    if (subcategoria) params.append('subcategoria', subcategoria);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Error en el backend' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en proxy de list files:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const { s3Key } = await request.json();

    if (!s3Key) {
      return NextResponse.json({ error: 'S3 key requerida' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/api/resources/s3/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ s3Key }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Error en el backend' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en proxy de delete:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
