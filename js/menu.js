document.addEventListener("DOMContentLoaded", () => {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.getElementById("lightbox-close");
    const links = document.querySelectorAll(".especial-link");

    // Abrir el Lightbox al hacer clic en cualquier imagen
    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const imgSrc = link.getAttribute("data-image");
            lightboxImg.src = imgSrc;
            lightbox.style.display = "flex";
        });
    });

    // Cerrar el Lightbox al hacer clic en el botón de cerrar
    closeBtn.addEventListener("click", () => {
        lightbox.style.display = "none";
        lightboxImg.src = "";
    });

    // Cerrar el Lightbox al hacer clic fuera de la imagen
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
            lightboxImg.src = "";
        }
    });
});
