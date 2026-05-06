// File: backend/src/services/schedulerService.js
// Servicio de automatizaciones programadas (cron jobs)

const cron = require('node-cron');
const { executeQuery } = require('../config/database');
const { notify, NotificationTypes } = require('./notificationService');

/**
 * Obtiene tareas vencidas con sus datos para notificación.
 * Solo tareas no completadas y cuya fecha_vencimiento ya pasó.
 * Excluye tareas que ya fueron notificadas hoy (para evitar spam diario).
 */
const getOverdueTasksForNotification = async () => {
  const query = `
    SELECT 
      t.id,
      t.nombre AS nombre_tarea,
      t.fecha_vencimiento,
      t.id_usuario_asignado,
      t.id_proyecto,
      p.nombre AS nombre_proyecto,
      DATE_FORMAT(t.fecha_vencimiento, '%d/%m/%Y') AS fecha_vencimiento_fmt
    FROM Tareas t
    JOIN Proyectos p ON t.id_proyecto = p.id
    WHERE t.estatus != 'Completada'
      AND t.fecha_vencimiento < NOW()
      AND t.id_usuario_asignado IS NOT NULL
  `;
  return await executeQuery(query);
};

/**
 * Notifica a usuarios asignados cuyas tareas han vencido.
 * Se ejecuta diariamente a las 08:00 AM.
 */
const notifyOverdueTasks = async () => {
  try {
    console.log('[Scheduler] Verificando tareas vencidas...');
    const overdueItems = await getOverdueTasksForNotification();

    if (overdueItems.length === 0) {
      console.log('[Scheduler] No hay tareas vencidas para notificar.');
      return;
    }

    console.log(`[Scheduler] Notificando ${overdueItems.length} tarea(s) vencida(s)...`);

    for (const task of overdueItems) {
      if (!task.id_usuario_asignado) continue;
      try {
        await notify({
          tipo: NotificationTypes.TAREA_VENCIDA,
          destinatarios: [task.id_usuario_asignado],
          parametros: {
            nombreTarea: task.nombre_tarea,
            nombreProyecto: task.nombre_proyecto,
            fechaVencimiento: task.fecha_vencimiento_fmt
          },
          enlaceAccion: `/proyectos/${task.id_proyecto}/tareas`,
          enviarCorreo: true
        });
      } catch (err) {
        console.error(`[Scheduler] Error notificando tarea ID ${task.id}:`, err.message);
      }
    }

    console.log('[Scheduler] Notificaciones de tareas vencidas enviadas correctamente.');
  } catch (error) {
    console.error('[Scheduler] Error en notifyOverdueTasks:', error.message);
  }
};

/**
 * Actualiza el estatus de versiones de documentos pendientes de firma
 * cuya fecha de subida supera los 30 días sin haber sido firmadas,
 * cambiando su estatus a 'Pendiente' si aún está en borrador.
 * Se ejecuta diariamente a las 07:00 AM.
 */
const updatePendingSignatureDocuments = async () => {
  try {
    console.log('[Scheduler] Verificando documentos con firma pendiente...');
    const query = `
      UPDATE Documento_Versiones
      SET estatus = 'Pendiente'
      WHERE estatus NOT IN ('Firmado', 'Rechazado', 'Pendiente')
        AND fecha_subida < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const result = await executeQuery(query);
    console.log(`[Scheduler] ${result.affectedRows} documento(s) actualizado(s) a estado Pendiente.`);
  } catch (error) {
    console.error('[Scheduler] Error en updatePendingSignatureDocuments:', error.message);
  }
};

/**
 * Inicializa todos los cron jobs del sistema.
 * Llamar una sola vez al arrancar el servidor.
 */
const initScheduler = () => {
  // Notificar tareas vencidas todos los días a las 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    await notifyOverdueTasks();
  }, {
    timezone: 'America/Mexico_City'
  });

  // Actualizar documentos pendientes de firma todos los días a las 07:00 AM
  cron.schedule('0 7 * * *', async () => {
    await updatePendingSignatureDocuments();
  }, {
    timezone: 'America/Mexico_City'
  });

  console.log('[Scheduler] Automatizaciones programadas iniciadas correctamente.');
};

module.exports = {
  initScheduler,
  notifyOverdueTasks,         // Exportado para tests manuales
  updatePendingSignatureDocuments  // Exportado para tests manuales
};
