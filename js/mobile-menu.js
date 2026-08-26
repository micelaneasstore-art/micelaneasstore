(function(){
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.header-menu');
    if (!toggle || !menu) return;

    const closeMenu = () => {
        menu.classList.remove('mobile-open');
        toggle.setAttribute('aria-expanded','false');
    };

    toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        menu.classList.toggle('mobile-open', !open);
    });

    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeMenu();
    });
})();
