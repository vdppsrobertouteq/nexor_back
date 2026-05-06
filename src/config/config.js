// File: backend/src/config/config.js
require('dotenv').config();

const config = {
  // Configuración del servidor
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'sgp_db'
  },
  
  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  // Configuración de CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
  },
  
  // Configuración de email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 465,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || ''
  },
  
  // Configuración de archivos
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '10mb',
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    destination: process.env.UPLOAD_DESTINATION || 'uploads/'
  },
  
  // Configuración de seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000 // 15 minutos
  },
  
  // Configuración de la aplicación
  app: {
    name: process.env.APP_NAME || 'Backend API',
    version: process.env.APP_VERSION || '1.0.0',
    description: process.env.APP_DESCRIPTION || 'Backend API con Express.js y MySQL'
  }
};

// Validar variables de entorno críticas
const validateConfig = () => {
  // En Railway la DB se provee via MYSQL_URL o variables MYSQL*
  const hasRailwayDB = process.env.MYSQL_URL || process.env.MYSQLHOST;
  const hasCustomDB = process.env.DB_HOST && process.env.DB_USER;

  if (!hasRailwayDB && !hasCustomDB) {
    console.error('❌ Variables de entorno faltantes: necesitas MYSQL_URL (Railway) o DB_HOST + DB_USER');
    console.error('💡 Asegúrate de configurar estas variables en Railway o en tu archivo .env');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ Variable de entorno faltante: JWT_SECRET');
    process.exit(1);
  }
};

// Validar configuración en producción
if (config.nodeEnv === 'production') {
  validateConfig();
}

module.exports = config;