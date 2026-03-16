import express from 'express';
import path from 'path';
import multer from 'multer';
import { importarVentasDesdeExcel } from '../services/ventasImporter.js';
import { importarClientesDesdeExcel } from '../services/clientesImporter.js';
import { sincronizarClientesDualpoint } from '../services/seleniumSync.js';
import { inhabilitarClientesAprobados } from '../services/inhabilitacionService.js';
import { getSchedulerInfo } from '../config/scheduler.js';
import Venta from '../models/Venta.js';
import Cliente from '../models/Cliente.js';

const router = express.Router();

// Configurar multer para uploads temporales
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB max (aumentado para archivos grandes)
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
 * Procesar archivo Excel y actualizar base de datos (AMBOS: ventas y clientes)
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

    console.log('\n📥 Nueva solicitud de actualización de BD (COMPLETA)');
    console.log(`   Archivo: ${req.file.originalname}`);
    console.log(`   Tamaño: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Modo: ${reemplazar ? 'REEMPLAZAR' : 'AGREGAR/ACTUALIZAR'}`);

    // Importar SECUENCIALMENTE para reducir carga de memoria
    // Primero ventas (lo más pesado)
    console.log('⏳ Paso 1/2: Importando ventas...');
    const resultadoVentas = await importarVentasDesdeExcel(req.file.path, reemplazar, req.file.originalname);

    console.log('⏳ Paso 2/2: Importando clientes...');
    const resultadoClientes = await importarClientesDesdeExcel(req.file.path, reemplazar, req.file.originalname);

    // Eliminar archivo temporal
    const fs = await import('fs/promises');
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('No se pudo eliminar archivo temporal:', e.message);
    }

    console.log('✅ Importación completada exitosamente\n');

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
 * POST /api/importar-ventas
 * Importar SOLO ventas desde Excel
 */
router.post('/importar-ventas', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }

    const reemplazar = req.body.reemplazar === 'true';

    console.log('\n📥 Importación de VENTAS');
    console.log(`   Archivo: ${req.file.originalname}`);
    console.log(`   Tamaño: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Modo: ${reemplazar ? 'REEMPLAZAR' : 'AGREGAR/ACTUALIZAR'}`);

    const resultado = await importarVentasDesdeExcel(req.file.path, reemplazar, req.file.originalname);

    // Eliminar archivo temporal
    const fs = await import('fs/promises');
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('No se pudo eliminar archivo temporal:', e.message);
    }

    console.log('✅ Importación de ventas completada\n');

    res.json({
      success: resultado.success,
      ventas: resultado
    });
  } catch (error) {
    console.error('❌ Error importando ventas:', error);
    next(error);
  }
});

/**
 * POST /api/importar-clientes
 * Importar SOLO clientes desde Excel
 */
router.post('/importar-clientes', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }

    const reemplazar = req.body.reemplazar === 'true';

    console.log('\n📥 Importación de CLIENTES');
    console.log(`   Archivo: ${req.file.originalname}`);
    console.log(`   Tamaño: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Modo: ${reemplazar ? 'REEMPLAZAR' : 'AGREGAR/ACTUALIZAR'}`);

    const resultado = await importarClientesDesdeExcel(req.file.path, reemplazar);

    // Eliminar archivo temporal
    const fs = await import('fs/promises');
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('No se pudo eliminar archivo temporal:', e.message);
    }

    console.log('✅ Importación de clientes completada\n');

    res.json({
      success: resultado.success,
      clientes: resultado
    });
  } catch (error) {
    console.error('❌ Error importando clientes:', error);
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

/**
 * POST /api/sincronizar-clientes
 * Sincronizar clientes desde los 3 sistemas Dualpoint (Santa Cruz, Cochabamba, La Paz)
 * Usa Selenium para descargar automáticamente los archivos .xls e importarlos
 */
router.post('/sincronizar-clientes', async (req, res, next) => {
  try {
    const reemplazar = req.body.reemplazar === 'true';

    console.log('\n🤖 Iniciando sincronización automática desde Dualpoint');
    console.log(`   Modo: ${reemplazar ? 'REEMPLAZAR' : 'AGREGAR/ACTUALIZAR'}`);

    const resultado = await sincronizarClientesDualpoint(reemplazar);

    if (resultado.success) {
      res.json({
        success: true,
        message: resultado.message,
        zonas: resultado.zonas,
        totalRegistros: resultado.totalRegistros,
        zonasExitosas: resultado.zonasExitosas,
        zonasFallidas: resultado.zonasFallidas
      });
    } else {
      res.status(500).json({
        success: false,
        message: resultado.message,
        error: resultado.error
      });
    }
  } catch (error) {
    console.error('❌ Error en sincronización de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error en sincronización de clientes',
      error: error.message
    });
  }
});

/**
 * POST /api/inhabilitar-clientes
 * Inhabilita clientes aprobados cambiándolos a rutas genéricas en Dualpoint
 */
router.post('/inhabilitar-clientes', async (req, res, next) => {
  try {
    console.log('\n[INHABILITACION] Iniciando proceso de inhabilitación manual');

    // Obtener nombre del supervisor desde el body (enviado desde el frontend)
    const supervisorNombre = req.body.supervisorNombre || 'MANUAL';

    const resultado = await inhabilitarClientesAprobados('MANUAL', supervisorNombre);

    if (resultado.success) {
      res.json({
        success: true,
        message: resultado.message,
        totalClientes: resultado.totalClientes,
        procesados: resultado.procesados,
        exitosos: resultado.exitosos,
        fallidos: resultado.fallidos,
        omitidos: resultado.omitidos,
        tiempoTotal: resultado.tiempoTotal,
        zonas: resultado.zonas,
        detalles: resultado.detalles
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error en inhabilitación de clientes',
        error: resultado.error
      });
    }
  } catch (error) {
    console.error('[ERROR] Error en inhabilitación de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error en inhabilitación de clientes',
      error: error.message
    });
  }
});

/**
 * GET /api/test-cron/status
 * Ver estado de los cron jobs programados
 */
router.get('/test-cron/status', (req, res) => {
  const info = getSchedulerInfo();
  res.json({
    success: true,
    scheduler: info,
    horariosActuales: {
      'Sync Rutas': '6:00 AM y 7:00 PM (todos los días)',
      'Inhabilitacion Clientes': '9:00 AM (sábados)',
      'Sync Clientes': '12:00 PM (sábados)',
      timezone: 'America/La_Paz'
    }
  });
});

/**
 * POST /api/test-cron/inhabilitar
 * Simula exactamente lo que ejecuta el cron del sábado 9AM (modo AUTOMATICA)
 */
router.post('/test-cron/inhabilitar', async (req, res) => {
  try {
    console.log('\n[TEST-CRON] ========== SIMULANDO CRON SABADO 9:00 AM ==========');
    console.log('[TEST-CRON] Inhabilitando clientes aprobados en Dualpoint...\n');
    const resultado = await inhabilitarClientesAprobados('AUTOMATICA', 'Sistema_de_Bajas_v1.5');
    res.json({ success: true, resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/test-cron/sincronizar-clientes
 * Simula exactamente lo que ejecuta el cron del sábado 12PM (modo AGREGAR/ACTUALIZAR)
 */
router.post('/test-cron/sincronizar-clientes', async (req, res) => {
  try {
    console.log('\n[TEST-CRON] ========== SIMULANDO CRON SABADO 12:00 PM ==========');
    console.log('[TEST-CRON] Sincronizando clientes desde Dualpoint...\n');
    const resultado = await sincronizarClientesDualpoint(false); // false = no reemplazar, igual que el cron
    res.json({ success: true, resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
