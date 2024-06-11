require('dotenv').config();
const express = require('express');
const http = require('http');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const { reservarMesa, acceptReservation, rejectReservation } = require('./index');

const app = express();
const server = http.createServer(app);

// Configuración del puerto
const PORT = process.env.PORT || 4000;
app.set('port', PORT);

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

module.exports = { app, server };
