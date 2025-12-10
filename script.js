document.addEventListener('DOMContentLoaded', () => {
    
    // --- Obsługa Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 150;

        revealElements.forEach((element) => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    // Wywołaj raz na starcie
    revealOnScroll();

    // --- Obsługa przycisku Demo w script.js ---
    const demoLink = document.getElementById('demoLink');

    if (demoLink) {
        demoLink.addEventListener('click', (e) => {
            e.preventDefault(); // Zatrzymuje natychmiastowe przejście
            
            // Zapisz oryginalny tekst
            const originalContent = demoLink.innerHTML;
            
            // Symulacja procesu logowania/ładowania
            demoLink.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ładowanie...';
            demoLink.style.opacity = '0.8';
            
            // Czekamy 1.5 sekundy dla efektu, potem przekierowanie
            setTimeout(() => {
                // Przekierowanie do pliku demo.html
                window.location.href = 'demo.html';
            }, 1500);
        });
    }

    // --- Navbar Sticky Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = "0 5px 20px rgba(0,0,0,0.1)";
            navbar.style.background = "rgba(255, 255, 255, 0.98)";
        } else {
            navbar.style.boxShadow = "none";
            navbar.style.background = "rgba(255, 255, 255, 0.9)";
        }
    });
});