document.getElementById('contactoForm').addEventListener('submit', function (event) {
    event.preventDefault();

    fetch('/enviar-mensaje', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nombre: document.getElementById('nombre').value,
            telefono: document.getElementById('telefono').value,
            email: document.getElementById('email').value,
            mensaje: document.getElementById('mensaje').value,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const popup = document.getElementById('popup');
                const overlay = document.getElementById('popupOverlay');
                overlay.style.display = 'block'; // Muestra el overlay
                popup.classList.add('show'); // Activa el popup con animación
            } else {
                alert('Error al enviar el mensaje: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al enviar el mensaje.');
        });
});

// Ocultar el popup y redirigir al inicio
document.getElementById('closePopup').addEventListener('click', function () {
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('popupOverlay');
    popup.classList.remove('show'); // Oculta el popup con animación
    setTimeout(() => {
        overlay.style.display = 'none';
        popup.style.display = 'none';
        // Redirigir al inicio
        window.location.href = 'index.html';
    }, 300); // Espera a que termine la animación
});
