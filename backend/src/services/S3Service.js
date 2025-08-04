import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.SUPABASE_S3_REGION,
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
    
    this.bucket = process.env.SUPABASE_S3_BUCKET;
  }

  /**
   * Generar una clave única para el archivo en S3
   * @param {string} originalName - Nombre original del archivo
   * @param {string} categoria - Categoría del archivo (notas, eventos, recursos)
   * @param {string} subcategoria - Subcategoría opcional
   * @returns {string} Clave única para S3
   */
  generateS3Key(originalName, categoria, subcategoria = '') {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const uniqueId = crypto.randomUUID();
    const extension = path.extname(originalName);
    const cleanName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9-_]/g, '_');
    
    let key = `${categoria}/${year}/${month}`;
    if (subcategoria) {
      key += `/${subcategoria}`;
    }
    key += `/${uniqueId}_${cleanName}${extension}`;
    
    return key;
  }

  /**
   * Subir archivo a S3
   * @param {Buffer} buffer - Buffer del archivo
   * @param {string} key - Clave del archivo en S3
   * @param {string} contentType - Tipo de contenido del archivo
   * @param {Object} metadata - Metadatos adicionales
   * @returns {Promise<Object>} Resultado de la subida
   */
  async uploadFile(buffer, key, contentType, metadata = {}) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
        }
      });

      await this.s3Client.send(command);
      
      const publicUrl = `${process.env.SUPABASE_S3_ENDPOINT}/${this.bucket}/${key}`;
      
      return {
        success: true,
        key,
        url: publicUrl,
        size: buffer.length
      };
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error(`Error subiendo archivo a S3: ${error.message}`);
    }
  }

  /**
   * Eliminar archivo de S3
   * @param {string} key - Clave del archivo en S3
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw new Error(`Error eliminando archivo de S3: ${error.message}`);
    }
  }

  /**
   * Obtener URL firmada para descarga privada
   * @param {string} key - Clave del archivo en S3
   * @param {number} expiresIn - Tiempo de expiración en segundos (default: 1 hora)
   * @returns {Promise<string>} URL firmada
   */
  async getSignedDownloadUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Error generando URL de descarga: ${error.message}`);
    }
  }

  /**
   * Listar archivos por categoría
   * @param {string} categoria - Categoría a filtrar
   * @param {string} subcategoria - Subcategoría opcional
   * @returns {Promise<Array>} Lista de archivos
   */
  async listFiles(categoria, subcategoria = '') {
    try {
      let prefix = categoria;
      if (subcategoria) {
        prefix += `/${subcategoria}`;
      }

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await this.s3Client.send(command);
      
      return (response.Contents || []).map(object => ({
        key: object.Key,
        url: `${process.env.SUPABASE_S3_ENDPOINT}/${this.bucket}/${object.Key}`,
        size: object.Size,
        lastModified: object.LastModified,
        fileName: path.basename(object.Key)
      }));
    } catch (error) {
      console.error('Error listing S3 files:', error);
      throw new Error(`Error listando archivos: ${error.message}`);
    }
  }

  /**
   * Validar tipo de archivo permitido
   * @param {string} fileName - Nombre del archivo
   * @returns {boolean} True si el tipo está permitido
   */
  isAllowedFileType(fileName) {
    const allowedExtensions = [
      // Documentos
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.rtf',
      // Imágenes
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
      // Videos
      '.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm',
      // Audio
      '.mp3', '.wav', '.aac', '.m4a', '.ogg',
      // Archivos comprimidos
      '.zip', '.rar', '.7z', '.tar', '.gz',
      // Otros
      '.csv', '.json', '.xml', '.html', '.css', '.js'
    ];

    const extension = path.extname(fileName).toLowerCase();
    return allowedExtensions.includes(extension);
  }

  /**
   * Validar tamaño de archivo
   * @param {number} size - Tamaño en bytes
   * @returns {boolean} True si el tamaño está permitido
   */
  isAllowedFileSize(size) {
    const maxSize = 100 * 1024 * 1024; // 100MB
    return size <= maxSize;
  }

  /**
   * Obtener información del archivo desde S3
   * @param {string} key - Clave del archivo
   * @returns {Promise<Object>} Información del archivo
   */
  async getFileInfo(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      return {
        key,
        url: `${process.env.SUPABASE_S3_ENDPOINT}/${this.bucket}/${key}`,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error(`Error obteniendo información del archivo: ${error.message}`);
    }
  }
}

export default S3Service;
