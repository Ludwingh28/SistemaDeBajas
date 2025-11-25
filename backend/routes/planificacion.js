import express from 'express';
import Ruta from '../models/Ruta.js';
import Zona from '../models/Zona.js';
import Vendedor from '../models/Vendedor.js';
import Dia from '../models/Dia.js';
import SyncLog from '../models/SyncLog.js';
import {
  migrarDatosIniciales,
  sincronizarPlanificacion,
  obtenerEstadisticasSync
} from '../services/planificacionSyncService.js';
import { authenticateSupervisor } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/planificacion/rutas
 * Obtener todas las rutas de planificación
 */
router.get('/rutas', async (req, res, next) => {
  try {
    const rutas = await Ruta.getAll();
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
    const ruta = await Ruta.getByCodigo(codigo);

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
 * GET /api/planificacion/vendedor/:id
 * Buscar rutas por vendedor ID
 */
router.get('/vendedor/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rutas = await Ruta.getByVendedor(parseInt(id));

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
 * GET /api/planificacion/zona/:id
 * Buscar rutas por zona ID
 */
router.get('/zona/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rutas = await Ruta.getByZona(parseInt(id));

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
 * PROTEGIDO: Requiere autenticación de supervisor
 */
router.post('/migrar', authenticateSupervisor, async (req, res, next) => {
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
 * PROTEGIDO: Requiere autenticación de supervisor
 */
router.post('/sincronizar', authenticateSupervisor, async (req, res, next) => {
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

/**
 * DELETE /api/planificacion/limpiar
 * Limpiar toda la tabla de planificación (usar con precaución)
 * PROTEGIDO: Requiere autenticación de supervisor
 */
router.delete('/limpiar', authenticateSupervisor, async (req, res, next) => {
  try {
    console.log('⚠️  Limpiando tablas de planificación...');
    await Ruta.truncate();

    res.json({
      success: true,
      message: 'Tablas limpiadas exitosamente'
    });
  } catch (error) {
    console.error('❌ Error limpiando tablas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/planificacion/zonas
 * Obtener todas las zonas
 */
router.get('/zonas', async (req, res, next) => {
  try {
    const zonas = await Zona.getAll();
    res.json({
      success: true,
      total: zonas.length,
      zonas
    });
  } catch (error) {
    console.error('❌ Error obteniendo zonas:', error);
    next(error);
  }
});

/**
 * GET /api/planificacion/vendedores
 * Obtener todos los vendedores
 */
router.get('/vendedores', async (req, res, next) => {
  try {
    const vendedores = await Vendedor.getAll();
    res.json({
      success: true,
      total: vendedores.length,
      vendedores
    });
  } catch (error) {
    console.error('❌ Error obteniendo vendedores:', error);
    next(error);
  }
});

/**
 * GET /api/planificacion/dias
 * Obtener todos los días
 */
router.get('/dias', async (req, res, next) => {
  try {
    const dias = await Dia.getAll();
    res.json({
      success: true,
      total: dias.length,
      dias
    });
  } catch (error) {
    console.error('❌ Error obteniendo días:', error);
    next(error);
  }
});

export default router;
