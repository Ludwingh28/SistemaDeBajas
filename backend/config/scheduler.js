import cron from 'node-cron';
import { sincronizarPlanificacion } from '../services/planificacionSyncService.js';
import { sincronizarClientesDualpoint } from '../services/seleniumSync.js';
import { inhabilitarClientesAprobados } from '../services/inhabilitacionService.js';

/**
 * Configuración de tareas programadas (cron jobs)
 *
 * Formato de cron: minutos horas dia mes dia_semana
 * Ejemplos:
 * - '0 6 * * *'      = 6:00 AM todos los días
 * - '0 19 * * *'     = 7:00 PM (19:00) todos los días
 * - '0 9 * * 6'      = 9:00 AM todos los sábados (6 = sábado)
 * - '0 12 * * 6'     = 12:00 PM todos los sábados (6 = sábado)
 *
 * Sincronizaciones programadas:
 * - 6:00 AM todos los días → Rutas (Google Sheets)
 * - 7:00 PM todos los días → Rutas (Google Sheets)
 * - 9:00 AM todos los sábados → Inhabilitar clientes aprobados (Dualpoint con Selenium)
 * - 12:00 PM todos los sábados → Clientes (Dualpoint con Selenium)
 */

let cronJobs = [];

/**
 * Inicia los trabajos cron programados
 */
export function iniciarScheduler() {
  console.log('\n[SCHEDULER] Iniciando scheduler de sincronizaciones...\n');

  // Sincronización a las 6:00 AM todos los días (Rutas)
  const job6AM = cron.schedule('0 6 * * *', async () => {
    console.log('\n[CRON] ========== SINCRONIZACION PROGRAMADA 6:00 AM ==========');
    try {
      await sincronizarPlanificacion();
    } catch (error) {
      console.error('[ERROR] Error en sincronizacion 6 AM:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/La_Paz' // Zona horaria de Bolivia
  });

  cronJobs.push({ name: 'Sync Rutas 6 AM', job: job6AM });
  console.log('[OK] Programado: Sincronizacion de Rutas a las 6:00 AM (America/La_Paz)');

  // Sincronización a las 7:00 PM (19:00) todos los días (Rutas)
  const job7PM = cron.schedule('0 19 * * *', async () => {
    console.log('\n[CRON] ========== SINCRONIZACION PROGRAMADA 7:00 PM ==========');
    try {
      await sincronizarPlanificacion();
    } catch (error) {
      console.error('[ERROR] Error en sincronizacion 7 PM:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/La_Paz' // Zona horaria de Bolivia
  });

  cronJobs.push({ name: 'Sync Rutas 7 PM', job: job7PM });
  console.log('[OK] Programado: Sincronizacion de Rutas a las 7:00 PM (America/La_Paz)');

  // Inhabilitación a las 9:00 AM todos los sábados (Cambiar rutas de clientes aprobados)
  const jobSabado9AM = cron.schedule('0 9 * * 6', async () => {
    console.log('\n[CRON] ========== INHABILITACION PROGRAMADA SABADO 9:00 AM ==========');
    console.log('[SELENIUM] Inhabilitando clientes aprobados en Dualpoint...\n');
    try {
      await inhabilitarClientesAprobados('AUTOMATICA', 'Sistema_de_Bajas_v1.5');
    } catch (error) {
      console.error('[ERROR] Error en inhabilitacion de clientes:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/La_Paz' // Zona horaria de Bolivia
  });

  cronJobs.push({ name: 'Inhabilitar Clientes Sabado 9 AM', job: jobSabado9AM });
  console.log('[OK] Programado: Inhabilitacion de Clientes a las 9:00 AM todos los sabados (America/La_Paz)');

  // Sincronización a las 12:00 PM todos los sábados (Clientes desde Dualpoint)
  const jobSabado12PM = cron.schedule('0 12 * * 6', async () => {
    console.log('\n[CRON] ========== SINCRONIZACION PROGRAMADA SABADO 12:00 PM ==========');
    console.log('[SELENIUM] Sincronizando clientes desde Dualpoint...\n');
    try {
      await sincronizarClientesDualpoint(false); // false = modo actualizar
    } catch (error) {
      console.error('[ERROR] Error en sincronizacion de clientes:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/La_Paz' // Zona horaria de Bolivia
  });

  cronJobs.push({ name: 'Sync Clientes Sabado 12 PM', job: jobSabado12PM });
  console.log('[OK] Programado: Sincronizacion de Clientes a las 12:00 PM todos los sabados (America/La_Paz)');

  console.log('\n[OK] Scheduler iniciado correctamente');
  console.log('   Sincronizaciones programadas:');
  console.log('      - Rutas: 6:00 AM y 7:00 PM (todos los dias)');
  console.log('      - Inhabilitar clientes: 9:00 AM (todos los sabados)');
  console.log('      - Clientes: 12:00 PM (todos los sabados)\n');

  return cronJobs;
}

/**
 * Detiene todos los trabajos cron
 */
export function detenerScheduler() {
  console.log('\n[SCHEDULER] Deteniendo scheduler...');

  cronJobs.forEach(({ name, job }) => {
    job.stop();
    console.log(`   [OK] Detenido: ${name}`);
  });

  cronJobs = [];
  console.log('[OK] Scheduler detenido\n');
}

/**
 * Obtiene información sobre los trabajos programados
 */
export function getSchedulerInfo() {
  return {
    activo: cronJobs.length > 0,
    totalJobs: cronJobs.length,
    jobs: cronJobs.map(({ name, job }) => ({
      nombre: name,
      running: job.running
    })),
    programacion: {
      rutas: {
        manana: '6:00 AM (diario)',
        noche: '7:00 PM (diario)'
      },
      inhabilitacion: {
        semanal: '9:00 AM (sábados)'
      },
      clientes: {
        semanal: '12:00 PM (sábados)'
      },
      timezone: 'America/La_Paz'
    }
  };
}

export default {
  iniciarScheduler,
  detenerScheduler,
  getSchedulerInfo
};
