const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

dotenv.config();

// Database Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'mesondb',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your_email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_password',
    },
});

// Function to Send Emails
async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'your_email@gmail.com',
        to: to,
        subject: subject,
        text: text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Reservation Validation
function esHorarioValido(diaSemana, hora) {
    const [horas, minutos] = hora.split(':').map(Number);

    if (diaSemana === 1) {
        return false; // Closed on Mondays
    } else if (diaSemana >= 2 && diaSemana <= 6) {
        return horas >= 8 && horas < 22; // Weekday hours: 8:00 to 22:00
    } else if (diaSemana === 0) {
        return horas >= 10 && horas < 18; // Sunday hours: 10:00 to 18:00
    }

    return false;
}

// Main Reservation Logic
async function reservarMesa(req, res, db) {
    // Lógica actual de reserva no modificada
}

// Logic for Handling Contact Form Submission (Added)
async function enviarMensaje(req, res) {
    const { nombre, telefono, email, mensaje } = req.body;

    try {
        const subject = `Nuevo Mensaje de Contacto de ${nombre}`;
        const text = `Nombre: ${nombre}\nTeléfono: ${telefono}\nEmail: ${email}\nMensaje:\n${mensaje}`;

        await sendEmail('angelluis1991@gmail.com', subject, text);

        console.log('Formulario de contacto enviado correctamente.');
        res.status(200).send('Mensaje enviado correctamente.');
    } catch (error) {
        console.error('Error al enviar mensaje de contacto:', error);
        res.status(500).send('Error al enviar el mensaje.');
    }
}

module.exports = { reservarMesa, sendEmail, enviarMensaje };
