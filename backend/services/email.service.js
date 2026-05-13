const nodemailer = require('nodemailer');
const config = require('../config.json');

/**
 * Transporte SMTP reutilizable para correo corporativo.
 * Usar variables de entorno SMTP_USER y SMTP_PASS en producción.
 */
function getTransport() {
    const smtp = config.smtp || {};
    const user = process.env.SMTP_USER || smtp.user;
    const pass = process.env.SMTP_PASS || smtp.pass;
    return nodemailer.createTransport({
        host: smtp.host || 'localhost',
        port: smtp.port || 587,
        secure: smtp.secure === true,
        auth: (user && pass) ? { user, pass } : undefined,
        connectionTimeout: 15000,
        greetingTimeout: 10000
    });
}

/**
 * Envía un correo usando la cuenta corporativa configurada.
 * Reutilizable para recuperación de contraseña, notificaciones, etc.
 *
 * @param {Object} options
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} [options.text] - Cuerpo en texto plano
 * @param {string} [options.html] - Cuerpo en HTML (opcional)
 * @returns {Promise<void>}
 */
async function sendMail({ to, subject, text, html }) {
    const smtp = config.smtp || {};
    const emailFrom = smtp.from || process.env.SMTP_USER || 'noreply@localhost';
    const fromName = process.env.MAIL_FROM_NAME;
    const from = fromName ? `"${fromName}" <${emailFrom}>` : emailFrom;
    const transport = getTransport();
    await transport.sendMail({
        from,
        to,
        subject,
        text: text || (html ? undefined : ''),
        html: html || undefined
    });
}

module.exports = { sendMail, getTransport };
