import cron from 'node-cron';
import { sincronizarPlanificacion } from '../services/planificacionSyncService.js';

/**
 * Configuración de tareas programadas (cron jobs)
 *
 * Formato de cron: [segundos] minutos horas dia mes dia_semana
 *
 * Sincronizaciones programadas:
 * - 6:00 AM todos los días
 * - 7:00 PM (19:00) todos los días
 */

let cronJobs = [];

/**
 * Inicia los trabajos cron programados
 */
export function iniciarScheduler() {
  console.log('\n⏰ Iniciando scheduler de sincronizaciones...\n');

  // Sincronización a las 6:00 AM todos los días
  const job6AM = cron.schedule('0 6 * * *', async () => {
    console.log('\n⏰ ========== SINCRONIZACIÓN PROGRAMADA 6:00 AM ==========');
    try {
      await sincronizarPlanificacion();
    } catch (error) {
      console.error('❌ Error en sincronización 6 AM:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/La_Paz' // Zona horaria de Bolivia
  });

  cronJobs.push({ name: 'Sync 6 AM', job: job6AM });
  console.log('✓ Programado: Sincronización a las 6:00 AM (America/La_Paz)');

  // Sincronización a las 7:00 PM (19:00) todos los días
  const job7PM = cron.schedule('0 19 * * *', async () => {
    console.log('\n⏰ ========== SINCRONIZACIÓN PROGRAMADA 7:00 PM ==========');
    try {
      await sincronizarPlanificacion();
    } catch (error) {
      console.error('❌ Error en sincronización 7 PM:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/La_Paz' // Zona horaria de Bolivia
  });

  cronJobs.push({ name: 'Sync 7 PM', job: job7PM });
  console.log('✓ Programado: Sincronización a las 7:00 PM (America/La_Paz)');

  console.log('\n✅ Scheduler iniciado correctamente');
  console.log('   Las sincronizaciones se ejecutarán automáticamente a las 6 AM y 7 PM\n');

  return cronJobs;
}

/**
 * Detiene todos los trabajos cron
 */
export function detenerScheduler() {
  console.log('\n⏸️  Deteniendo scheduler...');

  cronJobs.forEach(({ name, job }) => {
    job.stop();
    console.log(`   ✓ Detenido: ${name}`);
  });

  cronJobs = [];
  console.log('✅ Scheduler detenido\n');
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
    proximaSincronizacion: {
      manana: '6:00 AM',
      noche: '7:00 PM',
      timezone: 'America/La_Paz'
    }
  };
}

export default {
  iniciarScheduler,
  detenerScheduler,
  getSchedulerInfo
};
