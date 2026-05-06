const express = require('express');
const {
  getGeneralSummary,
  getProjectsStatusDistribution,
  getProjectsRiskDistribution,
  getProjectsByPortfolio,
  getTasksStatusDistribution,
  getTasksPriorityDistribution,
  getProjectsWithPendingTasks,
  getPendingDocuments,
  getScheduledMeetings,
  getKPIsByPeriod,
  getDocumentsSignedStats
} = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de Administrador
router.use(authMiddleware);
router.use(checkRole(['Administrador', 'Superadministrador']));

// Resumen general
router.get('/summary', getGeneralSummary);

// Distribución de estados de proyectos
router.get('/projects-status', getProjectsStatusDistribution);

// Distribución de riesgo de proyectos
router.get('/projects-risk', getProjectsRiskDistribution);

// Proyectos por portafolio
router.get('/projects-by-portfolio', getProjectsByPortfolio);

// Distribución de estados de tareas (acepta ?projectId=)
router.get('/tasks-status', getTasksStatusDistribution);

// Distribución de prioridad de tareas
router.get('/tasks-priority', getTasksPriorityDistribution);

// Proyectos con tareas pendientes
router.get('/projects-pending-tasks', getProjectsWithPendingTasks);

// Documentos pendientes de firma
router.get('/pending-documents', getPendingDocuments);

// Reuniones agendadas
router.get('/scheduled-meetings', getScheduledMeetings);

// KPIs por período (acepta ?days=30)
router.get('/kpis', getKPIsByPeriod);

// Estadísticas de documentos firmados vs no firmados (acepta ?projectId=)
router.get('/documents-signed-stats', getDocumentsSignedStats);

module.exports = router;