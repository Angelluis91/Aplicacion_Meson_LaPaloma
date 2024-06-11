document.getElementById('reservaForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita que se envíe el formulario de forma predeterminada
    
    // Obtener los datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const email = document.getElementById('email').value.trim();
    const fecha = new Date(document.getElementById('fecha').value);
    const hora = document.getElementById('hora').value;
    const personas = parseInt(document.getElementById('personas').value);

    // Validar los datos del formulario
    if (!nombre || !telefono || !email || isNaN(fecha.getTime()) || !hora || isNaN(personas) || personas <= 0) {
        window.location.href = 'reserva_erronea.html';
        return;
    }

    // Obtener día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
    const diaSemana = fecha.getUTCDay();

    // Validar horario de reserva
    if (!esHorarioValido(diaSemana, hora)) {
        window.location.href = 'reserva_erronea.html';
        return;
    }

    // Realizar la solicitud al servidor
    try {
        const response = await fetch('/reservar-mesa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, telefono, email, fecha: fecha.toISOString().split('T')[0], hora, personas })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        window.location.href = 'reserva_exitosa.html'; // Redirigir a la página de éxito
    } catch (error) {
        console.error('Error al realizar la reserva:', error);
        window.location.href = 'reserva_erronea.html'; // Redirigir a la página de error
    }
});

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
