(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  $('#year').textContent = new Date().getFullYear();

  // Toast notifications
  const toast = $('#toast');
  let toastTimer;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
  }

  // Animated starfield
  const canvas = $('#stars');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w = 0;
  let h = 0;
  let raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars = Array.from(
      { length: Math.min(110, Math.floor(w / 8)) },
      () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.65 + 0.1,
        v: Math.random() * 0.22 + 0.04
      })
    );
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const star of stars) {
      star.y += star.v;

      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.z, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(172,224,255,${star.a})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  resize();
  draw();

  window.addEventListener('resize', resize, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      draw();
    }
  });

  // Cursor glow and 3D planet movement
  const glow = $('#cursorGlow');
  const scene = $('#orbScene');

  window.addEventListener('pointermove', event => {
    glow.style.left = event.clientX + 'px';
    glow.style.top = event.clientY + 'px';

    if (event.pointerType === 'mouse' && innerWidth > 800) {
      const rect = $('#universe').getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      scene.style.transform =
        `rotateY(${x * 8}deg) rotateX(${y * -6}deg)`;
    }
  }, { passive: true });

  $('#universe').addEventListener('pointerleave', () => {
    scene.style.transform = '';
  });

  // Responsive navigation
  const menu = $('#menuBtn');
  const nav = $('#nav');

  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    menu.textContent = open ? '×' : '☰';
  });

  $$('nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      menu.textContent = '☰';
    });
  });

  // Scroll reveal and active navigation
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    $$('.reveal').forEach((element, index) => {
      element.style.transitionDelay = (index % 4) * 65 + 'ms';
      revealObserver.observe(element);
    });

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('nav a').forEach(link => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === '#' + entry.target.id
            );
          });
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });

    $$('main section[id]').forEach(section => sectionObserver.observe(section));
  } else {
    $$('.reveal').forEach(element => element.classList.add('visible'));
  }

  // Interactive card glow
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (event.clientY - rect.top) + 'px');
    });
  });

  // Energy core
  let energy = 0;
  const energyNames = [
    'Calm energy',
    'Solar energy',
    'Ocean energy',
    'Cosmic energy'
  ];

  function changeEnergy() {
    energy = (energy + 1) % 4;
    $('#toyCore').className = 'toy-core' + (energy ? ' energy' + energy : '');
    $('#energyLabel').textContent = energyNames[energy] + '. Tap to shift again.';
    notify(energyNames[energy]);
  }

  $('#toyCore').addEventListener('click', changeEnergy);
  $('#energyBtn').addEventListener('click', changeEnergy);

  // Color reactor
  function setColor(color) {
    document.documentElement.style.setProperty('--cyan', color);
    $('#colorPreview').style.setProperty('--chosen', color);
    $('#colorCode').textContent = color.toUpperCase();

    $$('.swatch').forEach(button => {
      button.classList.toggle(
        'active',
        button.dataset.color.toUpperCase() === color.toUpperCase()
      );
    });

    notify('Accent updated: ' + color.toUpperCase());
  }

  $$('.swatch').forEach(button => {
    button.addEventListener('click', () => setColor(button.dataset.color));
  });

  $('#randomColor').addEventListener('click', () => {
    const colors = $$('.swatch').map(button => button.dataset.color);
    setColor(colors[Math.floor(Math.random() * colors.length)]);
  });

  // Reaction-time mini-game
  const target = $('#gameTarget');
  let state = 'idle';
  let timer = 0;
  let startAt = 0;
  let best = null;

  try {
    best = Number(localStorage.getItem('nexora-best')) || null;
  } catch (error) {
    // Storage may be unavailable in private browsing.
  }

  function updateBest() {
    $('#bestScore').textContent = 'Personal best: ' + (best ? best + ' ms' : '—');
  }

  updateBest();

  function resetGame() {
    clearTimeout(timer);
    state = 'idle';
    target.className = 'game-target';
    $('#gameText').textContent = 'START';
    $('#gameCaption').textContent = 'REACTION PROTOCOL / READY';
    $('#gameMessage').textContent = 'Tap start. Wait for green.';
  }

  target.addEventListener('click', () => {
    if (state === 'idle' || state === 'done' || state === 'early') {
      clearTimeout(timer);
      state = 'wait';
      target.className = 'game-target wait';
      $('#gameText').textContent = 'WAIT';
      $('#gameCaption').textContent = 'SIGNAL INCOMING…';
      $('#gameMessage').textContent = 'Do not tap yet';

      timer = setTimeout(() => {
        if (state !== 'wait') return;

        state = 'go';
        startAt = performance.now();
        target.className = 'game-target go';
        $('#gameText').textContent = 'TAP!';
        $('#gameCaption').textContent = 'SIGNAL DETECTED / GO';
        $('#gameMessage').textContent = 'NOW NOW NOW';
      }, 900 + Math.random() * 2400);

      return;
    }

    if (state === 'wait') {
      clearTimeout(timer);
      state = 'early';
      target.className = 'game-target';
      $('#gameText').textContent = 'TOO SOON';
      $('#gameCaption').textContent = 'FALSE START';
      $('#gameMessage').textContent = 'Tap to try again';
      return;
    }

    if (state === 'go') {
      const milliseconds = Math.round(performance.now() - startAt);
      state = 'done';
      target.className = 'game-target';
      $('#gameText').textContent = milliseconds + 'ms';
      $('#gameCaption').textContent = 'REACTION RECORDED';

      $('#gameMessage').textContent =
        milliseconds < 220 ? 'Insane reflexes!' :
        milliseconds < 320 ? 'Nice reaction. Try to beat it.' :
        'Again. You can go faster.';

      if (!best || milliseconds < best) {
        best = milliseconds;
        updateBest();

        try {
          localStorage.setItem('nexora-best', String(best));
        } catch (error) {
          // Game remains playable without storage.
        }

        notify('New personal best: ' + milliseconds + ' ms!');
      }
    }
  });

  $('#resetGame').addEventListener('click', resetGame);

  // Project filters
  $$('.filter').forEach(button => {
    button.addEventListener('click', () => {
      $$('.filter').forEach(item => item.classList.toggle('active', item === button));

      $$('.project').forEach(project => {
        project.classList.toggle(
          'filtered',
          button.dataset.filter !== 'all' &&
          project.dataset.category !== button.dataset.filter
        );
      });
    });
  });

  // Project detail dialogs
  const projects = {
    nova: {
      n: 'PROJECT FILE / 001',
      title: 'Nova / Studio',
      desc: 'A future-facing creative studio website concept: bold editorial typography, soft cosmic gradients, and a focused journey from first impression to action.',
      tags: ['Web design', 'Responsive UI', 'Visual concept']
    },
    pulse: {
      n: 'PROJECT FILE / 002',
      title: 'Pulse / Frequency',
      desc: 'An interactive visual playground inspired by sound, rhythm, and motion. A study in making interfaces feel alive rather than static.',
      tags: ['Interaction', 'Motion design', 'Play']
    },
    level: {
      n: 'PROJECT FILE / 003',
      title: 'Level Up / Identity',
      desc: 'A punchy visual identity direction inspired by gaming culture, achievement systems, electric color, and the feeling of reaching the next level.',
      tags: ['Graphic design', 'Typography', 'Gaming']
    },
    nexora: {
      n: 'PROJECT FILE / 004',
      title: 'NEXORA / Playground',
      desc: 'The home base for curious minds: tiny experiments, playful interactions, and concept worlds in one neon-lit digital space.',
      tags: ['HTML', 'CSS', 'JavaScript', 'Interactive']
    }
  };

  let lastFocus = null;
  const modal = $('#modalBackdrop');

  function openProject(key) {
    const project = projects[key];
    if (!project) return;

    lastFocus = document.activeElement;
    $('#modalEyebrow').textContent = project.n;
    $('#modalTitle').textContent = project.title;
    $('#modalDescription').textContent = project.desc;

    const tags = $('#modalTags');
    tags.replaceChildren();

    project.tags.forEach(tag => {
      const element = document.createElement('span');
      element.textContent = tag;
      tags.appendChild(element);
    });

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#closeModal').focus();
  }

  function closeProject() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (lastFocus) lastFocus.focus();
  }

  $$('.project').forEach(project => {
    project.addEventListener('click', () => openProject(project.dataset.project));

    project.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProject(project.dataset.project);
      }
    });
  });

  $('#closeModal').addEventListener('click', closeProject);
  $('#doneModal').addEventListener('click', closeProject);

  modal.addEventListener('click', event => {
    if (event.target === modal) closeProject();
  });

  // Command palette
  const command = $('#commandBackdrop');

  function openCommand() {
    command.classList.add('open');
    command.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#closeCommand').focus();
  }

  function closeCommand() {
    command.classList.remove('open');
    command.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  $('#commandButton').addEventListener('click', openCommand);
  $('#closeCommand').addEventListener('click', closeCommand);

  command.addEventListener('click', event => {
    if (event.target === command) closeCommand();
  });

  $$('.command-links a').forEach(link => {
    link.addEventListener('click', closeCommand);
  });

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openCommand();
    }

    if (event.key === 'Escape') {
      if (modal.classList.contains('open')) closeProject();
      if (command.classList.contains('open')) closeCommand();
    }
  });

  // Back to top
  $('#topBtn').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
