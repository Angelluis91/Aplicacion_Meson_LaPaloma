const nodemailer = require('nodemailer');
const path = require('path');

async function reservarMesa(req, res, db) {
    try {
        const { nombre, telefono, email, fecha, hora, personas } = req.body;

        // Validación de datos
        if (!nombre || !telefono || !email || !fecha || !hora || isNaN(personas) || personas < 1) {
            console.log('Validación fallida: datos incompletos o inválidos.');
            return res.redirect('/reserva_erronea.html');
        }

        // Buscar una mesa disponible que cumpla con el número de comensales
        const [mesasDisponibles] = await db.query(
            `SELECT mesa_id 
             FROM Mesas 
             WHERE NrocomensalesXmesa >= ? 
             AND NrocomensalesXmesa <= ? + 2 
             AND mesa_id NOT IN (
                 SELECT mesa_id 
                 FROM MesasReservas 
                 JOIN Reservas ON MesasReservas.reserva_id = Reservas.reserva_id 
                 WHERE Reservas.fechaYhora_reserva BETWEEN ? AND ADDTIME(?, '01:30:00')
             ) 
             LIMIT 1`,
            [personas, personas, `${fecha} ${hora}`, `${fecha} ${hora}`]
        );

        if (mesasDisponibles.length === 0) {
            console.log('No hay mesas disponibles para la cantidad de personas solicitada.');
            return res.redirect('/reserva_erronea.html');
        }

        const mesaId = mesasDisponibles[0].mesa_id;

        // Verificar si el cliente ya existe
        const [clienteExistente] = await db.query('SELECT clientes_id FROM Clientes WHERE email = ?', [email]);

        let clienteId = clienteExistente.length ? clienteExistente[0].clientes_id : null;

        if (!clienteId) {
            const [nuevoCliente] = await db.query(
                'INSERT INTO Clientes (telefono, email, fechaCreacion) VALUES (?, ?, NOW())',
                [telefono, email]
            );
            clienteId = nuevoCliente.insertId;
        }

        // Insertar reserva en la tabla Reservas
        const [nuevaReserva] = await db.query(
            'INSERT INTO Reservas (clientes_id, NroComensales, NroMesas, fechaYhora_reserva) VALUES (?, ?, ?, ?)',
            [clienteId, personas, mesaId, `${fecha} ${hora}`]
        );

        const reservaId = nuevaReserva.insertId;

        // Relacionar la mesa con la reserva
        await db.query(
            'INSERT INTO MesasReservas (mesa_id, reserva_id) VALUES (?, ?)',
            [mesaId, reservaId]
        );

        // Configurar nodemailer para enviar correos electrónicos
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Ruta absoluta del logo
        const logoPath = path.join(__dirname, '../img/logonegroMeson.png');

        // Correo para el dueño
        const mailOptionsOwner = {
            from: process.env.EMAIL_USER,
            to: 'angelluis1991@gmail.com',
            subject: 'Nueva Solicitud de Reserva',
            html: `
                <div>
                    <img src="cid:logo" alt="Mesón La Paloma" style="width: 150px; height: auto; margin-bottom: 20px;">
                    <h2>Nueva reserva</h2>
                    <p><strong>Nombre:</strong> ${nombre}</p>
                    <p><strong>Teléfono:</strong> ${telefono}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Fecha:</strong> ${fecha}</p>
                    <p><strong>Hora:</strong> ${hora}</p>
                    <p><strong>Personas:</strong> ${personas}</p>
                </div>
            `,
            attachments: [
                {
                    filename: 'logonegroMeson.png',
                    path: logoPath,
                    cid: 'logo', // Identificador único para referenciar la imagen
                },
            ],
        };

        // Correo para el cliente
        const mailOptionsClient = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Confirmación de Solicitud de Reserva',
            html: `
                <div>
                    <img src="cid:logo" alt="Mesón La Paloma" style="width: 150px; height: auto; margin-bottom: 20px;">
                    <h2>Confirmación de Solicitud de Reserva</h2>
                    <p>Gracias por realizar tu solicitud de reserva en Mesón La Paloma.</p>
                    <p><strong>Fecha:</strong> ${fecha}</p>
                    <p><strong>Hora:</strong> ${hora}</p>
                    <p><strong>Personas:</strong> ${personas}</p>
                    <p>Si necesitas realizar cambios o cancelar, contacta con el restaurante.</p>
                </div>
            `,
            attachments: [
                {
                    filename: 'logonegroMeson.png',
                    path: logoPath,
                    cid: 'logo',
                },
            ],
        };

        // Enviar correos electrónicos
        await transporter.sendMail(mailOptionsOwner);
        await transporter.sendMail(mailOptionsClient);

        console.log('Reserva creada y correos enviados correctamente.');
        res.redirect('/reserva_exitosa.html');
    } catch (error) {
        console.error('Error al procesar la reserva:', error);
        res.redirect('/reserva_erronea.html');
    }
}

// Nueva función para manejar el formulario de contacto
async function enviarMensaje(req, res) {
    const { nombre, telefono, email, mensaje } = req.body;

    if (!nombre || !telefono || !email || !mensaje) {
        console.log('Datos incompletos en el formulario de contacto.');
        return res.status(400).json({ success: false, message: 'Datos incompletos.' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'angelluis1991@gmail.com',
        subject: `Nuevo mensaje de contacto de ${nombre}`,
        text: `Nombre: ${nombre}\nTeléfono: ${telefono}\nEmail: ${email}\nMensaje: ${mensaje}`,
    };

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail(mailOptions);
        console.log('Correo enviado con éxito.');
        return res.status(200).json({ success: true, message: 'Correo enviado con éxito.' });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ success: false, message: 'Error al enviar el correo.' });
    }
}

module.exports = { reservarMesa, enviarMensaje };
