const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Solo deshabilitar verificación TLS en desarrollo
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
});

/**
 * Enviar factura por correo
 * @param {string} to - Destinatario (Email)
 * @param {string} subject - Asunto del correo
 * @param {string} html - Cuerpo del mensaje en HTML
 * @param {Buffer} pdfBuffer - Buffer del archivo PDF adjunto
 * @param {string} filename - Nombre del archivo adjunto
 */
async function sendInvoice(to, subject, html, pdfBuffer, filename) {
    try {
        const mailOptions = {
            from: `"Digital Stock" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: [
                {
                    filename: filename,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error enviando correo:', error);
        return { success: false, error: error };
    }
}

module.exports = { sendInvoice };
