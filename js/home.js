document.addEventListener("DOMContentLoaded", function () {
    const scrollElements = document.querySelectorAll(".scroll-effect");

    // Función para verificar si un elemento está en vista
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <=
            (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };

    // Función para mostrar un elemento con animación
    const displayScrollElement = (element) => {
        element.classList.add("active");
    };

    // Función para manejar la animación durante el scroll
    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            }
        });
    };

    // Detectar el evento de scroll
    window.addEventListener("scroll", handleScrollAnimation);

    // Inicializar animaciones para elementos ya en vista al cargar
    handleScrollAnimation();
});



