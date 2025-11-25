import express from 'express';
import SupervisorService from '../services/supervisorService.js';

const router = express.Router();

/**
 * GET /api/supervisores
 * Listar todos los supervisores
 */
router.get('/', async (req, res, next) => {
  try {
    const resultado = await SupervisorService.listarSupervisores();
    res.json(resultado);
  } catch (error) {
    console.error('Error listando supervisores:', error);
    next(error);
  }
});

/**
 * GET /api/supervisores/:id
 * Obtener un supervisor por ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await SupervisorService.obtenerSupervisor(parseInt(id));
    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo supervisor:', error);
    next(error);
  }
});

/**
 * POST /api/supervisores
 * Crear un nuevo supervisor
 * Body: { nombre, codigo, creadoPor? }
 */
router.post('/', async (req, res, next) => {
  try {
    const { nombre, codigo, creadoPor } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y código son requeridos'
      });
    }

    const resultado = await SupervisorService.crearSupervisor(
      nombre,
      codigo,
      creadoPor || 'ADMIN'
    );

    res.status(201).json(resultado);
  } catch (error) {
    if (error.message.includes('ya existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('requerido') || error.message.includes('debe tener')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('Error creando supervisor:', error);
    next(error);
  }
});

/**
 * PUT /api/supervisores/:id/cambiar-hash
 * Cambiar el hash de un supervisor
 * Body: { nuevoCodigo, actualizadoPor? }
 */
router.put('/:id/cambiar-hash', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nuevoCodigo, actualizadoPor } = req.body;

    if (!nuevoCodigo) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo código es requerido'
      });
    }

    const resultado = await SupervisorService.cambiarHash(
      parseInt(id),
      nuevoCodigo,
      actualizadoPor || 'ADMIN'
    );

    res.json(resultado);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('requerido') || error.message.includes('debe tener')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    console.error('Error cambiando hash:', error);
    next(error);
  }
});

/**
 * PATCH /api/supervisores/:id/estado
 * Activar/Desactivar supervisor
 * Body: { activo: boolean }
 */
router.patch('/:id/estado', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo activo debe ser un booleano'
      });
    }

    const resultado = await SupervisorService.cambiarEstado(
      parseInt(id),
      activo
    );

    res.json(resultado);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    console.error('Error cambiando estado:', error);
    next(error);
  }
});

/**
 * POST /api/supervisores/verificar
 * Verificar credenciales de supervisor (para login)
 * Body: { codigo }
 */
router.post('/verificar', async (req, res, next) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        message: 'Código es requerido'
      });
    }

    const resultado = await SupervisorService.verificarCredenciales(codigo);

    if (!resultado.valido) {
      return res.status(401).json({
        success: false,
        message: resultado.mensaje
      });
    }

    res.json({
      success: true,
      message: 'Credenciales válidas',
      supervisor: {
        id: resultado.supervisor.id,
        nombre: resultado.supervisor.nombre,
        ultimo_acceso: resultado.supervisor.ultimo_acceso
      }
    });
  } catch (error) {
    console.error('Error verificando credenciales:', error);
    next(error);
  }
});

export default router;
