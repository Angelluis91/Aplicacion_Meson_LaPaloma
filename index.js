const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Configurar la conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Configuración del email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email enviado con éxito');
  } catch (error) {
    console.error('Error al enviar el email:', error);
  }
}

function esHorarioValido(diaSemana, hora) {
  const [horas, minutos] = hora.split(':').map(Number);

  if (diaSemana === 1) {
    // Lunes cerrado
    return false;
  } else if (diaSemana >= 2 && diaSemana <= 6) {
    // Martes a Sábado: 8:30 a 1:00 del día siguiente
    return (horas > 8 || (horas === 8 && minutos >= 30)) || (horas < 1 || (horas === 1 && minutos === 0));
  } else if (diaSemana === 0) {
    // Domingo: 9:00 a 17:00
    return (horas > 9 || (horas === 9 && minutos >= 0)) && (horas < 17 || (horas === 17 && minutos === 0));
  }

  return false;
}

async function reservarMesa(req, res, next) {
  try {
    const { nombre, telefono, email, fecha, hora, personas } = req.body;

    if (!nombre || !telefono || !email || !fecha || !hora || !personas || isNaN(personas) || personas <= 0) {
      return res.status(400).redirect('/reserva_erronea.html');
    }

    const fechaReserva = new Date(fecha);
    const diaSemana = fechaReserva.getUTCDay();

    if (!esHorarioValido(diaSemana, hora)) {
      return res.status(400).redirect('/reserva_erronea.html');
    }

    console.log('Datos de la reserva:', { nombre, telefono, email, fecha, hora, personas });

    const disponibilidadQuery = await pool.query(
      `SELECT mesa_id
       FROM mesas 
       WHERE capacidad >= $1 
       AND mesa_id NOT IN (
           SELECT mesa_id 
           FROM reservas 
           WHERE fecha = $2 
           AND hora = $3
       ) 
       LIMIT 1`,
      [personas, fecha, hora]
    );

    if (disponibilidadQuery.rows.length === 0) {
      return res.status(400).redirect('/reserva_erronea.html');
    }

    const mesaId = disponibilidadQuery.rows[0].mesa_id;

    let clienteId;

    const existingClientQuery = await pool.query(
      'SELECT cliente_id FROM clientes WHERE email = $1',
      [email]
    );

    if (existingClientQuery.rows.length > 0) {
      clienteId = existingClientQuery.rows[0].cliente_id;
    } else {
      clienteId = uuidv4();
      await pool.query(
        'INSERT INTO clientes (cliente_id, nombre, telefono, email) VALUES ($1::uuid, $2, $3, $4)',
        [clienteId, nombre, telefono, email]
      );
    }

    const reservaResult = await pool.query(
      'INSERT INTO reservas (cliente_id, mesa_id, fecha, hora, personas) VALUES ($1::uuid, $2, $3, $4, $5) RETURNING reserva_id',
      [clienteId, mesaId, fecha, hora, personas]
    );

    const reservaId = reservaResult.rows[0].reserva_id;

    const userSubject = 'Confirmación de reserva';
    const userText = `Hola ${nombre},\n\nTu reserva ha sido recibida, sera confirmada lo antes posible por el local.\n\nDetalles de la reserva:\n\n- Fecha: ${fecha}\n- Hora: ${hora}\n- Número de personas: ${personas}\n\nLa reserva se mantendrá por 15 minutos a partir de la hora reservada. De lo contrario, la perderás. Para cualquier cambio, contacta con el restaurante al número 608 83 65 64.\n\nDirección del restaurante:\nCalle Artajona 9, Madrid\n\n¡Te esperamos!`;

    await sendEmail(email, userSubject, userText);

    const ownerEmail = 'angelluis1991@gmail.com';
    const ownerSubject = 'Nueva reserva';
    const ownerText = `Nueva reserva realizada:\n\n- Nombre: ${nombre}\n- Teléfono: ${telefono}\n- Email: ${email}\n- Fecha: ${fecha}\n- Hora: ${hora}\n- Número de personas: ${personas}\n\nAcepte o rechace la reserva con los siguientes enlaces:\n\nAceptar: http://localhost:4000/aceptar-reserva/${reservaId}\nRechazar: http://localhost:4000/rechazar-reserva/${reservaId}`;

    await sendEmail(ownerEmail, ownerSubject, ownerText);

    return res.status(200).redirect('/reserva_exitosa.html');
  } catch (error) {
    console.error('Error al realizar la reserva:', error);
    return res.status(500).redirect('/reserva_erronea.html');
  }
}

async function acceptReservation(req, res, next) {
  try {
    const reservaId = req.params.id;

    await pool.query(
      'UPDATE reservas SET estado = $1 WHERE reserva_id = $2',
      ['aceptada', reservaId]
    );

    const reservationQuery = await pool.query(
      'SELECT r.fecha, r.hora, r.personas, c.nombre, c.email FROM reservas r JOIN clientes c ON r.cliente_id = c.cliente_id WHERE r.reserva_id = $1',
      [reservaId]
    );

    const { fecha, hora, personas, nombre, email } = reservationQuery.rows[0];

    const userSubject = 'Reserva aceptada';
    const userText = `Hola ${nombre},\n\nTu reserva ha sido aceptada.\n\nDetalles de la reserva:\n\n- Fecha: ${fecha}\n- Hora: ${hora}\n- Número de personas: ${personas}\n\n¡Te esperamos en el restaurante!`;

    await sendEmail(email, userSubject, userText);

    return res.status(200).send('Reserva aceptada y email enviado al cliente.');
  } catch (error) {
    console.error('Error al aceptar la reserva:', error);
    return res.status(500).json({ message: `Error al aceptar la reserva: ${error.message}`, stack: error.stack });
  }
}

async function rejectReservation(req, res, next) {
  try {
    const reservaId = req.params.id;

    await pool.query(
      'UPDATE reservas SET estado = $1 WHERE reserva_id = $2',
      ['rechazada', reservaId]
    );

    const reservationQuery = await pool.query(
      'SELECT r.fecha, r.hora, r.personas, c.nombre, c.email FROM reservas r JOIN clientes c ON r.cliente_id = c.cliente_id WHERE r.reserva_id = $1',
      [reservaId]
    );

    const { fecha, hora, personas, nombre, email } = reservationQuery.rows[0];

    const userSubject = 'Reserva rechazada';
    const userText = `Hola ${nombre},\n\nLamentamos informarte que tu reserva ha sido rechazada.\n\nDetalles de la reserva:\n\n- Fecha: ${fecha}\n- Hora: ${hora}\n- Número de personas: ${personas}\n\nPara más información, por favor contacta con el restaurante al número 608 83 65 64.`;

    await sendEmail(email, userSubject, userText);

    return res.status(200).send('Reserva rechazada y email enviado al cliente.');
  } catch (error) {
    console.error('Error al rechazar la reserva:', error);
    return res.status(500).json({ message: `Error al rechazar la reserva: ${error.message}`, stack: error.stack });
  }
}

module.exports = { reservarMesa, acceptReservation, rejectReservation };

// Inicializar servidor
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/reservar-mesa', reservarMesa);

app.get('/aceptar-reserva/:id', acceptReservation);
app.get('/rechazar-reserva/:id', rejectReservation);

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
