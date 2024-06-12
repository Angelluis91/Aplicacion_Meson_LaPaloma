require('dotenv').config();
const express = require('express');
const http = require('http');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const { reservarMesa, acceptReservation, rejectReservation } = require('./index'); // Importar las funciones

const app = express();
const server = http.createServer(app);

// Configuración del puerto (cambiado a 5000)
const PORT = process.env.PORT || 6000;
app.set('port', PORT);

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));  // Permitir solicitudes desde cualquier origen

// Deshabilitar la cabecera 'X-Powered-By' por razones de seguridad
app.disable('x-powered-by');

// Servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '/')));

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/nosotros', (req, res) => {
    res.sendFile(path.join(__dirname, 'nosotros.html'));
});

app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'menu.html'));
});

app.get('/contacto', (req, res) => {
    res.sendFile(path.join(__dirname, 'contacto.html'));
});

app.get('/reservas', (req, res) => {
    res.sendFile(path.join(__dirname, 'reservas.html'));
});

app.get('/reserva_exitosa', (req, res) => {
    res.sendFile(path.join(__dirname, 'reserva_exitosa.html'));
});

app.get('/reserva_erronea', (req, res) => {
    res.sendFile(path.join(__dirname, 'reserva_erronea.html'));
});

// Ruta para la reserva de mesa
app.post('/reservar-mesa', reservarMesa);

// Rutas para aceptar o rechazar reservas
app.get('/aceptar-reserva/:id', acceptReservation);
app.get('/rechazar-reserva/:id', rejectReservation);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en el servidor:', err);
    res.status(err.status || 500).send('Error en el servidor');
});

// Ruta de ejemplo para la página de contacto
app.post('/enviar-mensaje', (req, res) => {
    const { nombre, telefono, email, mensaje } = req.body;
    // Aquí puedes agregar la lógica para manejar el mensaje enviado
    console.log(`Nombre: ${nombre}, Teléfono: ${telefono}, Email: ${email}, Mensaje: ${mensaje}`);
    res.send('Mensaje recibido');
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

module.exports = { app, server };
