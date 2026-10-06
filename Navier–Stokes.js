document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('.theme-toggle');
  const themeIcon = document.querySelector('.theme-icon');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  const progressBar = document.getElementById('progress-bar');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    themeIcon.textContent = isDark ? '☀' : '☾';
    themeToggle.setAttribute('aria-pressed', String(!isDark));
    localStorage.setItem('navier-theme', theme);
  };

  const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const savedTheme = localStorage.getItem('navier-theme');
  applyTheme(savedTheme || systemTheme);

  themeToggle.addEventListener('click', () => {
    const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });

  if (navToggle && mobileMenu) {
    const closeMenu = () => {
      mobileMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menú');
    };

    navToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    menuLinks.forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  const fluidCanvas = document.getElementById('fluid-canvas');

  if (fluidCanvas) {
    const fluidCtx = fluidCanvas.getContext('2d');
    const particleCount = prefersReducedMotion ? 16 : 42;
    let particles = [];
    let animationFrameId = null;

    function setupCanvas() {
      const rect = fluidCanvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      fluidCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
      fluidCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
      fluidCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const width = rect.width;
      const height = rect.height;
      particles = Array.from({ length: particleCount }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        life: 0.5 + (index / particleCount) * 0.8,
        seed: Math.random() * 1000,
      }));
    }

    function fieldVector(x, y, time) {
      const nx = x / Math.max(1, fluidCanvas.clientWidth);
      const ny = y / Math.max(1, fluidCanvas.clientHeight);
      const swirl = Math.sin((nx * 15) + time * 0.0012) + Math.cos((ny * 13) - time * 0.0015);
      const drift = Math.sin((nx + ny) * 10 + time * 0.0018);
      const angle = swirl * 1.9 + drift * 1.3 + (nx - 0.5) * 3.2;

      return {
        x: Math.cos(angle) * 1.3,
        y: Math.sin(angle) * 1.1 + Math.sin((nx * 8) + time * 0.001) * 0.6,
      };
    }

    function drawFluid(time) {
      const width = fluidCanvas.clientWidth;
      const height = fluidCanvas.clientHeight;
      fluidCtx.clearRect(0, 0, width, height);

      particles.forEach((particle, index) => {
        const vector = fieldVector(particle.x, particle.y, time + particle.seed);
        particle.vx = particle.vx * 0.82 + vector.x * 0.18;
        particle.vy = particle.vy * 0.82 + vector.y * 0.18;
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;

        const alpha = 0.2 + (index / particles.length) * 0.6;
        fluidCtx.beginPath();
        fluidCtx.strokeStyle = `rgba(122, 202, 255, ${alpha})`;
        fluidCtx.lineWidth = 1.1;
        fluidCtx.moveTo(particle.x - particle.vx * 8, particle.y - particle.vy * 8);
        fluidCtx.lineTo(particle.x, particle.y);
        fluidCtx.stroke();

        fluidCtx.beginPath();
        fluidCtx.fillStyle = `rgba(142, 240, 209, ${alpha * 0.9})`;
        fluidCtx.arc(particle.x, particle.y, 1.2 + (index % 3) * 0.5, 0, Math.PI * 2);
        fluidCtx.fill();
      });
    }

    const renderFrame = () => {
      if (document.hidden) {
        return;
      }

      const time = performance.now();
      drawFluid(time);
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    if (prefersReducedMotion) {
      drawFluid(performance.now());
    } else {
      animationFrameId = requestAnimationFrame(renderFrame);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && animationFrameId === null) {
          animationFrameId = requestAnimationFrame(renderFrame);
        }
      });
    }

    window.addEventListener('resize', setupCanvas, { passive: true });
    window.addEventListener('pageshow', setupCanvas, { passive: true });
  }
});
