import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.md', '.csv', '.zip', '.rar', '.7z',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
  '.mp4', '.avi', '.mov', '.wmv', '.mp3', '.wav', '.aac'
];

// POST /api/recursos/upload - Subir archivo
export async function POST(request: NextRequest) {
  try {
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const titulo = formData.get('titulo') as string;
    const descripcion = formData.get('descripcion') as string;
    const tema = formData.get('tema') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }
    if (!titulo || !tema) {
      return NextResponse.json({ success: false, error: 'Título y tema son requeridos' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: `El archivo es demasiado grande. Máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB` }, { status: 400 });
    }
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json({ success: false, error: `Tipo de archivo no permitido. Extensiones permitidas: ${ALLOWED_EXTENSIONS.join(', ')}` }, { status: 400 });
    }

    // Subir archivo a Supabase S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueName = `${crypto.randomUUID()}${fileExtension}`;
    const s3Key = `${tema}/${uniqueName}`;
    const s3 = new S3Client({
      region: process.env.SUPABASE_S3_REGION,
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    const BUCKET = process.env.SUPABASE_S3_BUCKET!;

    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      }));
    } catch (err) {
      console.error('Error subiendo a S3:', err);
      return NextResponse.json({ success: false, error: 'Error subiendo archivo a S3' }, { status: 500 });
    }

    // URL pública del archivo
    const publicUrl = `${process.env.SUPABASE_S3_ENDPOINT}/${BUCKET}/${s3Key}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      s3Key,
      titulo,
      descripcion,
      tema,
      tags: tags ? JSON.parse(tags) : [],
      tipo: 'archivo',
      tipoArchivo: fileExtension.replace('.', ''),
      tamano: file.size
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return NextResponse.json({ success: false, error: 'Error al subir archivo' }, { status: 500 });
  }
}


// GET /api/recursos/upload - Listar archivos de S3 por tema (query param: tema)
export async function GET(request: NextRequest) {
  try {
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }
    const { searchParams } = new URL(request.url);
    const tema = searchParams.get('tema');
    if (!tema) {
      return NextResponse.json({ success: false, error: 'Tema es requerido' }, { status: 400 });
    }
    const s3 = new S3Client({
      region: process.env.SUPABASE_S3_REGION,
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    const BUCKET = process.env.SUPABASE_S3_BUCKET!;
    let files = [];
    try {
      const data = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `${tema}/`,
      }));
      files = (data.Contents || []).map(obj => ({
        key: obj.Key,
        url: `${process.env.SUPABASE_S3_ENDPOINT}/${BUCKET}/${obj.Key}`,
        size: obj.Size,
        lastModified: obj.LastModified
      }));
    } catch (err) {
      console.error('Error listando archivos de S3:', err);
      return NextResponse.json({ success: false, error: 'Error listando archivos de S3' }, { status: 500 });
    }
    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Error en GET archivos:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener archivos' }, { status: 500 });
  }
}

// DELETE /api/recursos/upload - Eliminar archivo de S3 (query param: key)
export async function DELETE(request: NextRequest) {
  try {
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ success: false, error: 'Key es requerido' }, { status: 400 });
    }
    const s3 = new S3Client({
      region: process.env.SUPABASE_S3_REGION,
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    const BUCKET = process.env.SUPABASE_S3_BUCKET!;
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }));
    } catch (err) {
      console.error('Error eliminando archivo de S3:', err);
      return NextResponse.json({ success: false, error: 'Error eliminando archivo de S3' }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: key });
  } catch (error) {
    console.error('Error en DELETE archivo:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar archivo' }, { status: 500 });
  }
}
