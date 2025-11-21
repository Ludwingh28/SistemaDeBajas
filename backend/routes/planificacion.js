import express from 'express';
import PlanificacionRuta from '../models/PlanificacionRuta.js';
import SyncLog from '../models/SyncLog.js';
import {
  migrarDatosIniciales,
  sincronizarPlanificacion,
  obtenerEstadisticasSync
} from '../services/planificacionSyncService.js';

const router = express.Router();

/**
 * GET /api/planificacion/rutas
 * Obtener todas las rutas de planificación
 */
router.get('/rutas', async (req, res, next) => {
  try {
    const rutas = await PlanificacionRuta.getAll();
    res.json({
      success: true,
      total: rutas.length,
      rutas
    });
  } catch (error) {
    console.error('❌ Error obteniendo rutas:', error);
    next(error);
  }
});

/**
 * GET /api/planificacion/rutas/:codigo
 * Obtener ruta específica por código
 */
router.get('/rutas/:codigo', async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const ruta = await PlanificacionRuta.getByRuta(codigo);

    if (!ruta) {
      return res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
      });
    }

    res.json({
      success: true,
      ruta
    });
  } catch (error) {
    console.error('❌ Error obteniendo ruta:', error);
    next(error);
  }
});

/**
 * GET /api/planificacion/vendedor/:nombre
 * Buscar rutas por vendedor
 */
router.get('/vendedor/:nombre', async (req, res, next) => {
  try {
    const { nombre } = req.params;
    const rutas = await PlanificacionRuta.getByVendedor(nombre);

    res.json({
      success: true,
      total: rutas.length,
      rutas
    });
  } catch (error) {
    console.error('❌ Error buscando rutas por vendedor:', error);
    next(error);
  }
});

/**
 * GET /api/planificacion/zona/:zona
 * Buscar rutas por zona
 */
router.get('/zona/:zona', async (req, res, next) => {
  try {
    const { zona } = req.params;
    const rutas = await PlanificacionRuta.getByZona(zona);

    res.json({
      success: true,
      total: rutas.length,
      rutas
    });
  } catch (error) {
    console.error('❌ Error buscando rutas por zona:', error);
    next(error);
  }
});

/**
 * GET /api/planificacion/stats
 * Obtener estadísticas de planificación y sincronización
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await obtenerEstadisticasSync();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    next(error);
  }
});

/**
 * POST /api/planificacion/migrar
 * Ejecutar migración inicial (solo una vez)
 */
router.post('/migrar', async (req, res, next) => {
  try {
    const resultado = await migrarDatosIniciales();

    if (!resultado.success) {
      return res.status(400).json(resultado);
    }

    res.json({
      success: true,
      message: resultado.message,
      insertados: resultado.insertados
    });
  } catch (error) {
    console.error('❌ Error en migración:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/planificacion/sincronizar
 * Ejecutar sincronización manual
 */
router.post('/sincronizar', async (req, res, next) => {
  try {
    const resultado = await sincronizarPlanificacion();

    res.json({
      success: true,
      message: resultado.message,
      insertados: resultado.insertados,
      actualizados: resultado.actualizados,
      sinCambios: resultado.sinCambios
    });
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/planificacion/sync-logs
 * Obtener logs de sincronización recientes
 */
router.get('/sync-logs', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await SyncLog.getRecent(limit);

    res.json({
      success: true,
      total: logs.length,
      logs
    });
  } catch (error) {
    console.error('❌ Error obteniendo logs:', error);
    next(error);
  }
});

export default router;
