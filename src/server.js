// File: backend/src/server.js
const app = require('./app');
const { connectDB } = require('./config/database');
const { initScheduler } = require('./services/schedulerService');

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Función para inicializar el servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('✅ Conexión a la base de datos establecida exitosamente');

    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
      console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });

    // Iniciar automatizaciones programadas (cron jobs)
    initScheduler();

    // Manejo de cierre graceful del servidor
    process.on('SIGTERM', () => {
      console.log('🔄 Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado exitosamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🔄 Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado exitosamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();