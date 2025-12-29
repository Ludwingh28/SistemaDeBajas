import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

/**
 * Middleware para comprimir imágenes después del upload
 * - Comprime imágenes manteniendo buena calidad (85%)
 * - Remueve metadatos EXIF para privacidad y reducir tamaño
 * - Convierte a formato JPEG para optimización
 */
export const compressImages = async (req, res, next) => {
  try {
    // Si no hay archivos, continuar
    if (!req.files || req.files.length === 0) {
      return next();
    }

    console.log(`📦 Comprimiendo ${req.files.length} imagen(es)...`);

    const compressedFiles = [];

    for (const file of req.files) {
      try {
        const originalPath = file.path;
        const originalSize = file.size;

        // Leer el archivo original
        const imageBuffer = await fs.readFile(originalPath);

        // Procesar con sharp: comprimir y remover metadatos
        const compressedBuffer = await sharp(imageBuffer)
          .rotate() // Auto-rotar basado en EXIF orientation (antes de remover metadata)
          .jpeg({
            quality: 85, // Buena calidad, buen ratio de compresión
            progressive: true,
            mozjpeg: true // Mejor compresión
          })
          .withMetadata({
            // Remover todos los metadatos EXIF, XMP, IPTC
            exif: {},
            icc: 'srgb' // Mantener perfil de color básico
          })
          .toBuffer();

        // Sobrescribir archivo original con versión comprimida
        // Cambiar extensión a .jpg si era diferente
        const ext = path.extname(originalPath);
        let finalPath = originalPath;

        if (!['.jpg', '.jpeg'].includes(ext.toLowerCase())) {
          // Cambiar extensión a .jpg
          finalPath = originalPath.replace(ext, '.jpg');
        }

        await fs.writeFile(finalPath, compressedBuffer);

        // Si cambiamos el path, eliminar archivo original
        if (finalPath !== originalPath) {
          await fs.unlink(originalPath);
        }

        const newSize = compressedBuffer.length;
        const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

        console.log(`   ✓ ${file.filename}: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (-${reduction}%)`);

        // Actualizar información del archivo
        compressedFiles.push({
          ...file,
          path: finalPath,
          filename: path.basename(finalPath),
          size: newSize,
          mimetype: 'image/jpeg',
          originalSize: originalSize,
          compressionRatio: reduction
        });

      } catch (imageError) {
        console.error(`❌ Error comprimiendo ${file.filename}:`, imageError.message);
        // Si falla la compresión, mantener archivo original
        compressedFiles.push(file);
      }
    }

    // Reemplazar req.files con archivos comprimidos
    req.files = compressedFiles;

    // Actualizar uploadedFiles si existe
    if (req.uploadedFiles) {
      req.uploadedFiles = compressedFiles.map(file => ({
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        originalSize: file.originalSize,
        compressionRatio: file.compressionRatio
      }));
    }

    next();

  } catch (error) {
    console.error('❌ Error en middleware de compresión:', error);
    // No interrumpir el flujo si falla la compresión
    next();
  }
};
