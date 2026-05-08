// File: backend/src/services/emailService.js
const axios = require('axios');
const config = require('../config/config');

// Brevo (ex-Sendinblue) API — no requiere verificar dominio
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_ADDRESS = process.env.EMAIL_FROM || 'noreply@example.com';

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY no está configurado');

  await axios.post(
    BREVO_API_URL,
    {
      sender: { name: config.app.name, email: FROM_ADDRESS },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );
}

class EmailService {
  async sendVerificationEmail(email, nombre, codigo) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bienvenido a ${config.app.name}</h2>
        <p>Hola ${nombre},</p>
        <p>Gracias por registrarte. Para completar tu registro, verifica tu correo con este código:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2c3e50; font-size: 32px; margin: 0;">${codigo}</h1>
        </div>
        <p>Este código expirará en 15 minutos.</p>
        <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
      </div>
    `;
    try {
      await sendEmail({ to: email, subject: 'Verificación de cuenta', html });
      return { success: true };
    } catch (error) {
      console.error('Error enviando email:', error.response?.data || error.message);
      throw new Error('Error al enviar correo de verificación');
    }
  }

  async sendPasswordResetEmail(email, nombre, codigo) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de contraseña</h2>
        <p>Hola ${nombre},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #e74c3c; font-size: 32px; margin: 0;">${codigo}</h1>
        </div>
        <p>Este código expirará en 15 minutos.</p>
        <p>Si no solicitaste este restablecimiento, puedes ignorar este correo.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
      </div>
    `;
    try {
      await sendEmail({ to: email, subject: 'Recuperación de contraseña', html });
      return { success: true };
    } catch (error) {
      console.error('Error enviando email:', error.response?.data || error.message);
      throw new Error('Error al enviar correo de recuperación');
    }
  }

  async sendGenericNotificationEmail(email, nombre, mensaje, enlaceAccion = null) {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <p>Hola ${nombre},</p>
        <p>${mensaje}</p>
        ${enlaceAccion ? `<p><a href="${enlaceAccion}">Ver más</a></p>` : ''}
        <hr><p style="font-size:12px;color:#666;">No responder a este correo.</p>
      </div>
    `;
    try {
      await sendEmail({ to: email, subject: 'Notificación en la plataforma', html });
    } catch (error) {
      console.error('Error enviando email:', error.response?.data || error.message);
    }
  }
}

module.exports = new EmailService();