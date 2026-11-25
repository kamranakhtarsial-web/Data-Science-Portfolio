document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('menu-toggle');
  const navigation = document.getElementById('nav-links');
  const icon = toggle?.querySelector('i');
  const setMenuOpen = (isOpen) => {
    navigation?.classList.toggle('open', isOpen);
    toggle?.setAttribute('aria-expanded', String(isOpen));
    toggle?.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    icon?.classList.toggle('fa-bars', !isOpen);
    icon?.classList.toggle('fa-xmark', isOpen);
  };

  toggle?.addEventListener('click', () => {
    setMenuOpen(!navigation.classList.contains('open'));
  });

  navigation?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuOpen(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation?.classList.contains('open')) {
      setMenuOpen(false);
      toggle?.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (navigation?.classList.contains('open') && !event.target.closest('.nav-wrap')) {
      setMenuOpen(false);
    }
  });

  const visual = document.querySelector('.hero-visual');
  const portrait = document.querySelector('.portrait-frame');
  const canvas = document.getElementById('ai-network');
  const context = canvas?.getContext('2d');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (visual && portrait && canvas && context) {
    let reduceMotion = motionPreference.matches;
    let width = 0;
    let height = 0;
    let particles = [];
    let pointer = null;
    let frameRequested = false;
    let networkVisible = !('IntersectionObserver' in window);
    const linkDistance = 104;

    function drawNetwork(animate = true) {
      frameRequested = false;
      context.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        if (animate && !reduceMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < 0 || particle.x > width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > height) particle.vy *= -1;
          particle.x = Math.max(0, Math.min(width, particle.x));
          particle.y = Math.max(0, Math.min(height, particle.y));

          if (pointer) {
            const dx = pointer.x - particle.x;
            const dy = pointer.y - particle.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 118 && distance > 0) {
              const force = (118 - distance) / 1180;
              particle.vx += (dx / distance) * force;
              particle.vy += (dy / distance) * force;
              const speed = Math.hypot(particle.vx, particle.vy);
              if (speed > 0.62) {
                particle.vx = (particle.vx / speed) * 0.62;
                particle.vy = (particle.vy / speed) * 0.62;
              }
            }
          }
        }
      });

      for (let i = 0; i < particles.length; i += 1) {
        const point = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const other = particles[j];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance < linkDistance) {
            const alpha = (1 - distance / linkDistance) * 0.3;
            context.strokeStyle = `rgba(101, 237, 202, ${alpha})`;
            context.lineWidth = 0.75;
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }

        context.beginPath();
        context.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
        context.fillStyle = 'rgba(142, 255, 224, 0.8)';
        context.fill();
      }

      if (animate && !reduceMotion && networkVisible && document.visibilityState === 'visible') {
        frameRequested = true;
        window.requestAnimationFrame(() => drawNetwork(true));
      }
    }

    motionPreference.addEventListener?.('change', (event) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        drawNetwork(false);
      } else if (networkVisible && document.visibilityState === 'visible' && !frameRequested) {
        drawNetwork(true);
      }
    });

    function resizeNetwork() {
      const bounds = visual.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const particleCount = width < 520 ? 18 : 28;
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.62,
        vy: (Math.random() - 0.5) * 0.62,
      }));
      drawNetwork(!reduceMotion);
    }

    visual.addEventListener('pointermove', (event) => {
      const bounds = visual.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      if (!frameRequested) drawNetwork(!reduceMotion);

      if (event.pointerType === 'mouse') {
        const x = (pointer.x / width - 0.5) * 5;
        const y = (pointer.y / height - 0.5) * -5;
        portrait.style.transform = `rotateX(${y}deg) rotateY(${x}deg) translateZ(4px)`;
      }
    });

    visual.addEventListener('pointerleave', () => {
      pointer = null;
      portrait.style.transform = '';
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && networkVisible && !reduceMotion && !frameRequested) {
        drawNetwork(true);
      }
    });

    if ('IntersectionObserver' in window) {
      const networkObserver = new IntersectionObserver(([entry]) => {
        networkVisible = entry.isIntersecting;
        visual.classList.toggle('is-in-view', networkVisible);
        if (networkVisible && !reduceMotion && document.visibilityState === 'visible' && !frameRequested) {
          drawNetwork(true);
        }
      }, { rootMargin: '80px' });
      networkObserver.observe(visual);
    } else {
      visual.classList.add('is-in-view');
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(resizeNetwork).observe(visual);
    } else {
      window.addEventListener('resize', resizeNetwork, { passive: true });
    }
    resizeNetwork();
  }

  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navigation?.querySelectorAll('a').forEach((link) => {
          const isActive = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', isActive);
          if (isActive) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -58% 0px' });

    document.querySelectorAll('main section[id]').forEach((section) => navObserver.observe(section));

    const revealTargets = document.querySelectorAll('.project-card, .experience-card, .skill-group, .degree-card, .cert-list, .contact-inner, .footer');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealTargets.forEach((element, index) => {
      element.classList.add('reveal-on-scroll');
      element.style.setProperty('--reveal-delay', `${(index % 3) * 60}ms`);
      revealObserver.observe(element);
    });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});
