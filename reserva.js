document.getElementById('reservaForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita que se envíe el formulario de forma predeterminada

    // Obtener los datos del formulario
    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const email = document.getElementById('email').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const personas = document.getElementById('personas').value;

    // Realizar la solicitud al servidor
    try {
        const response = await fetch('/reservar-mesa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, telefono, email, fecha, hora, personas })
        });

        if (!response.ok) {
            throw new Error('Error al realizar la reserva.');
        }

        // Redirigir a la URL proporcionada en la respuesta
        const redirectUrl = response.url;
        window.location.href = redirectUrl;
    } catch (error) {
        console.error('Error al realizar la reserva:', error);
        alert('Error al realizar la reserva. Por favor, inténtalo de nuevo más tarde.');
    }
});
