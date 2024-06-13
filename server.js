const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas y lógica para manejar reservas

// Enviar correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/reserva', async (req, res) => {
  const { nombre, email, telefono, fecha, hora, comensales } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO reservas (nombre, email, telefono, fecha, hora, comensales) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, email, telefono, fecha, hora, comensales]
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Confirmación de Reserva',
      text: `Hola ${nombre}, tu reserva para ${comensales} personas el ${fecha} a las ${hora} ha sido confirmada.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send(error.toString());
      }
      res.status(200).json(result.rows[0]);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
