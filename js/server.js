require('dotenv').config();
const express = require('express');
const http = require('http');
const logger = require('morgan');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const { reservarMesa, enviarMensaje } = require('./reserva'); // Añadido `enviarMensaje`

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

// Configuración de la base de datos
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'mesondb',
});

// Verificar conexión a la base de datos
db.getConnection()
    .then(() => console.log('Conexión a la base de datos establecida correctamente.'))
    .catch((err) => console.error('Error al conectar con la base de datos:', err.message));

// Deshabilitar la cabecera 'X-Powered-By' por razones de seguridad
app.disable('x-powered-by');

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../')));

// Rutas principales para servir páginas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.get('/reservas', (req, res) => res.sendFile(path.join(__dirname, '../reservas.html')));
app.get('/reserva_exitosa', (req, res) => res.sendFile(path.join(__dirname, '../reserva_exitosa.html')));
app.get('/reserva_erronea', (req, res) => res.sendFile(path.join(__dirname, '../reserva_erronea.html')));

// Ruta para procesar reservas
app.post('/reservar-mesa', (req, res) => reservarMesa(req, res, db));

// Ruta para procesar formulario de contacto
app.post('/enviar-mensaje', enviarMensaje);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en el servidor:', err);
    res.status(err.status || 500).send('Error en el servidor');
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

module.exports = { app, server };
