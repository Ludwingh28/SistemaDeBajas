import express from 'express';
import path from 'path';
import multer from 'multer';
import { importarVentasDesdeExcel } from '../services/ventasImporter.js';
import { importarClientesDesdeExcel } from '../services/clientesImporter.js';
import Venta from '../models/Venta.js';
import Cliente from '../models/Cliente.js';

const router = express.Router();

// Configurar multer para uploads temporales
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

/**
 * POST /api/actualizarBD
 * Procesar archivo Excel y actualizar base de datos
 */
router.post('/actualizarBD', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }

    const reemplazar = req.body.reemplazar === 'true';

    console.log('\n📥 Nueva solicitud de actualización de BD');
    console.log(`   Archivo: ${req.file.originalname}`);
    console.log(`   Tamaño: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Modo: ${reemplazar ? 'REEMPLAZAR' : 'AGREGAR/ACTUALIZAR'}`);

    // Importar ventas y clientes en paralelo
    const [resultadoVentas, resultadoClientes] = await Promise.all([
      importarVentasDesdeExcel(req.file.path, reemplazar),
      importarClientesDesdeExcel(req.file.path, reemplazar)
    ]);

    // Eliminar archivo temporal
    const fs = await import('fs/promises');
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('No se pudo eliminar archivo temporal:', e.message);
    }

    res.json({
      success: resultadoVentas.success && resultadoClientes.success,
      ventas: resultadoVentas,
      clientes: resultadoClientes
    });
  } catch (error) {
    console.error('❌ Error en actualización de BD:', error);
    next(error);
  }
});

/**
 * GET /api/ventas/estadisticas
 * Obtener estadísticas de ventas
 */
router.get('/ventas/estadisticas', async (req, res, next) => {
  try {
    const total = await Venta.count();
    const rangoFechas = await Venta.getRangoFechas();

    res.json({
      total: total,
      min_fecha: rangoFechas.min_fecha,
      max_fecha: rangoFechas.max_fecha,
      dias: rangoFechas.dias
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de ventas:', error);
    res.json({
      total: 0,
      min_fecha: null,
      max_fecha: null,
      dias: 0
    });
  }
});

/**
 * GET /api/clientes/estadisticas
 * Obtener estadísticas de clientes
 */
router.get('/clientes/estadisticas', async (req, res, next) => {
  try {
    const stats = await Cliente.getEstadisticas();
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas de clientes:', error);
    res.json({
      total: 0,
      activos: 0,
      inactivos: 0,
      total_zonas: 0,
      total_rutas: 0
    });
  }
});

/**
 * POST /api/migracion-inicial
 * Realizar migración inicial desde el archivo Excel en /data
 */
router.post('/migracion-inicial', async (req, res, next) => {
  try {
    const { paths } = await import('../config/database.js');
    const excelPath = paths.excelVentas;

    console.log('\n🚀 Iniciando migración inicial desde Excel...');
    console.log(`   Archivo: ${excelPath}\n`);

    // Importar ventas y clientes en paralelo
    const [resultadoVentas, resultadoClientes] = await Promise.all([
      importarVentasDesdeExcel(excelPath, true), // true = reemplazar
      importarClientesDesdeExcel(excelPath, true)
    ]);

    res.json({
      success: resultadoVentas.success && resultadoClientes.success,
      message: 'Migración inicial completada',
      ventas: resultadoVentas,
      clientes: resultadoClientes
    });
  } catch (error) {
    console.error('❌ Error en migración inicial:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
