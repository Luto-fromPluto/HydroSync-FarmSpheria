/* ================================================================
   HydroSync — "Why Hydroponics?" Animated Infographic
   script.js — Heavy interactive animations & effects
   ================================================================ */

(function () {
  'use strict';

  // ─── CONSTANTS ───
  const PARTICLE_COUNT = 35;
  const COUNTER_DURATION = 2000; // ms
  const REVEAL_THRESHOLD = 0.15;
  const NAVBAR_SCROLL_OFFSET = 60;

  // ─── DOM CACHE ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loader = $('#loader');
  const progressBar = $('#progressBar');
  const cursorGlow = $('#cursorGlow');
  const cursorDot = $('#cursorDot');
  const cursorRing = $('#cursorRing');
  const navbar = $('#navbar');
  const navLinks = $('#navLinks');
  const hamburger = $('#hamburger');
  const backToTop = $('#backToTop');
  const particlesContainer = $('#particles');
  const toast = $('#toast');

  // ─── UTILITY FUNCTIONS ───

  /** Clamp a value between min and max */
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  /** Ease-out cubic for counter animation */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /** Throttle function execution */
  function throttle(fn, delay) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  /** Debounce function execution */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ================================================================
  // LOADING SCREEN
  // ================================================================
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      // Trigger hero animations after loader hides
      document.body.style.overflow = 'auto';
      initCounters();
    }, 800);
  });

  // Fallback: hide loader after max 3s even if load event hasn't fired
  setTimeout(() => {
    if (!loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  }, 3000);

  // ================================================================
  // GLOBAL MOUSE COORDINATES
  // ================================================================
  let mouseX = 0, mouseY = 0;

  // ================================================================
  // FLOATING PARTICLES (Interactive Repulsion)
  // ================================================================
  const particlesList = [];
  function createParticles() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      
      p.style.left = startX + 'px';
      p.style.top = startY + 'px';
      p.style.animation = 'none'; // Disable CSS animation
      p.style.opacity = 0.3 + Math.random() * 0.4;
      
      const size = 2 + Math.random() * 4;
      p.style.width = size + 'px';
      p.style.height = size + 'px';

      const hue = 130 + Math.random() * 30;
      const lightness = 50 + Math.random() * 30;
      p.style.background = `hsl(${hue}, 80%, ${lightness}%)`;

      particlesContainer.appendChild(p);

      particlesList.push({
        el: p,
        x: startX,
        y: startY,
        baseX: startX,
        baseY: startY,
        vx: 0,
        vy: 0,
        speed: 0.2 + Math.random() * 0.5
      });
    }
  }
  createParticles();

  function animateParticles() {
    for (let i = 0; i < particlesList.length; i++) {
      const p = particlesList[i];
      
      // Float upwards
      p.baseY -= p.speed;
      if (p.baseY < -50) {
        p.baseY = window.innerHeight + 50;
        p.baseX = Math.random() * window.innerWidth;
        p.x = p.baseX;
        p.y = p.baseY;
      }

      // Repel from mouse
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150 && mouseX > 0) {
        const force = (150 - dist) / 150;
        p.vx -= (dx / dist) * force * 3;
        p.vy -= (dy / dist) * force * 3;
      }

      // Spring back to base position
      p.vx += (p.baseX - p.x) * 0.02;
      p.vy += (p.baseY - p.y) * 0.05;

      // Friction
      p.vx *= 0.9;
      p.vy *= 0.9;

      p.x += p.vx;
      p.y += p.vy;

      p.el.style.transform = `translate3d(${p.x - p.baseX}px, ${p.y - p.baseY}px, 0)`;
      p.el.style.left = p.baseX + 'px';
      p.el.style.top = p.baseY + 'px';
    }
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // ================================================================
  // CUSTOM CURSOR LOGIC (Glow, Dot, Ring, Velocity Stretch, Canvas Trail)
  // ================================================================
  let glowX = 0, glowY = 0;
  let ringX = 0, ringY = 0;
  let dotX = 0, dotY = 0;

  // Create canvas-based cursor trail particles
  if (window.matchMedia('(pointer: fine)').matches) {
    const canvas = document.createElement('canvas');
    canvas.id = 'cursorTrailCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100001'; // Behind dot/ring
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const trailParticles = [];
    let lastMoveTime = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (cursorGlow && (cursorGlow.style.opacity === '0' || cursorGlow.style.opacity === '')) {
        cursorGlow.style.opacity = '1';
        if (cursorDot) cursorDot.style.opacity = '1';
        if (cursorRing) cursorRing.style.opacity = '1';
      }

      const now = Date.now();
      if (now - lastMoveTime > 16) { // ~60fps throttle
        lastMoveTime = now;
        // Spawn glowing particles behind the cursor
        for (let i = 0; i < 2; i++) {
          trailParticles.push({
            x: mouseX,
            y: mouseY,
            vx: (Math.random() - 0.5) * 1.8,
            vy: (Math.random() - 0.5) * 1.8 - 0.6, // float slightly upwards
            size: Math.random() * 3.5 + 1.5,
            alpha: 1.0,
            decay: Math.random() * 0.025 + 0.015,
            hue: 130 + Math.random() * 30 // green accent
          });
        }
      }
    });

    function drawTrail() {
      ctx.clearRect(0, 0, width, height);

      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          trailParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        ctx.shadowBlur = p.size * 2.5;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, 0.8)`;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, 1.0)`;
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(drawTrail);
    }
    drawTrail();

    // Spark burst particle generator
    function spawnBurst(x, y) {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1.5;
        trailParticles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          size: Math.random() * 4 + 2,
          alpha: 1.0,
          decay: Math.random() * 0.03 + 0.015,
          hue: 130 + Math.random() * 30
        });
      }
    }
    
    // Expose globally so we can trigger bursts on hover events
    window.spawnBurst = spawnBurst;

    // Trigger spark burst on any click
    document.addEventListener('click', (e) => {
      spawnBurst(e.clientX, e.clientY);
    });
  } else {
    // Touch/mobile fallback listener
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
  }

  document.addEventListener('mousedown', () => {
    if (cursorRing) cursorRing.classList.add('clicking');
  });

  document.addEventListener('mouseup', () => {
    if (cursorRing) cursorRing.classList.remove('clicking');
  });

  // Hover animations on interactive elements
  document.querySelectorAll('a, button, input, .faq-question, .stat-card, .benefit-card, .detail-modal-close').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (cursorRing) cursorRing.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      if (cursorRing) cursorRing.classList.remove('hovering');
    });
  });

  function animateCursors() {
    // Glow positioning (slow lerp)
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;

    // Ring positioning (medium lerp)
    ringX += (mouseX - ringX) * 0.25;
    ringY += (mouseY - ringY) * 0.25;

    // Dot positioning (fast lerp for absolute smoothness)
    dotX += (mouseX - dotX) * 0.8;
    dotY += (mouseY - dotY) * 0.8;

    if (cursorGlow) {
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
    }

    if (cursorDot) {
      cursorDot.style.left = dotX + 'px';
      cursorDot.style.top = dotY + 'px';
    }

    // Velocity stretch effect for the ring
    const rxSpeed = mouseX - ringX;
    const rySpeed = mouseY - ringY;
    const speed = Math.sqrt(rxSpeed * rxSpeed + rySpeed * rySpeed);
    
    // Stretch ratio based on speed
    const stretchX = 1 + Math.min(speed / 120, 0.45);
    const stretchY = 1 / stretchX;
    const angle = Math.atan2(rySpeed, rxSpeed) * (180 / Math.PI);

    if (cursorRing) {
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      
      let stateScale = 1.0;
      if (cursorRing.classList.contains('clicking')) {
        stateScale = 1.5;
      } else if (cursorRing.classList.contains('hovering')) {
        stateScale = 1.25;
      }

      // translate(-50%, -50%) shifts coordinate origin to center of cursor
      cursorRing.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${stateScale * stretchX}, ${stateScale * stretchY})`;
    }

    requestAnimationFrame(animateCursors);
  }
  
  if (window.matchMedia('(pointer: fine)').matches) {
    animateCursors();
  }

  // Hide custom cursors on mobile touch devices
  if ('ontouchstart' in window) {
    if (cursorGlow) cursorGlow.style.display = 'none';
    if (cursorDot) cursorDot.style.display = 'none';
    if (cursorRing) cursorRing.style.display = 'none';
    const trailCanvas = $('#cursorTrailCanvas');
    if (trailCanvas) trailCanvas.style.display = 'none';
  }

  // ================================================================
  // GLOW CARD & 3D TILT EFFECT (mouse-follow glow + interactive 3D rotation)
  // ================================================================
  $$('.glow-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');

      // 3D Tilt calculations
      if (window.matchMedia('(pointer: fine)').matches) {
        const width = rect.width;
        const height = rect.height;
        const rotateX = ((y / height) - 0.5) * -12; // tilt max +/- 12deg
        const rotateY = ((x / width) - 0.5) * 12;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        card.style.transition = 'transform 0.1s ease-out, border-color 0.4s, box-shadow 0.4s';
      }
    });

    card.addEventListener('mouseleave', () => {
      if (window.matchMedia('(pointer: fine)').matches) {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
        card.style.transition = 'transform 0.5s ease-out, border-color 0.4s, box-shadow 0.4s';
      }
    });

    // Tactile click scale down
    card.addEventListener('mousedown', () => {
      if (window.matchMedia('(pointer: fine)').matches) {
        const currentTransform = card.style.transform;
        card.style.transform = `${currentTransform} scale(0.97)`;
      }
    });

    card.addEventListener('mouseup', () => {
      if (window.matchMedia('(pointer: fine)').matches) {
        const currentTransform = card.style.transform.replace(' scale(0.97)', '');
        card.style.transform = currentTransform;
      }
    });
  });

  // ================================================================
  // NAVBAR SCROLL EFFECT
  // ================================================================
  const handleNavbarScroll = throttle(() => {
    if (window.scrollY > NAVBAR_SCROLL_OFFSET) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, 100);

  window.addEventListener('scroll', handleNavbarScroll);

  // ================================================================
  // MOBILE HAMBURGER MENU
  // ================================================================
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');

    // Animate hamburger lines
    const spans = hamburger.querySelectorAll('span');
    if (navLinks.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close menu on link click
  $$('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });

  // ================================================================
  // READING PROGRESS BAR
  // ================================================================
  const handleProgress = throttle(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = scrollPercent + '%';
  }, 30);

  window.addEventListener('scroll', handleProgress);

  // ================================================================
  // BACK TO TOP BUTTON
  // ================================================================
  const handleBackToTop = throttle(() => {
    if (window.scrollY > 600) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }, 200);

  window.addEventListener('scroll', handleBackToTop);

  // ================================================================
  // SMOOTH SCROLL (global function used by onclick)
  // ================================================================
  window.smoothScroll = function (target) {
    const el = document.querySelector(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ================================================================
  // COUNT-UP ANIMATION — Stat Counters
  // ================================================================
  let countersAnimated = false;

  function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'), 10);
    const suffix = element.getAttribute('data-suffix') || '';
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = clamp(elapsed / COUNTER_DURATION, 0, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue = Math.round(easedProgress * target);

      // Build display text
      let displayText = currentValue.toString();
      if (suffix) {
        displayText += `<span class="stat-suffix">${suffix}</span>`;
      }
      element.innerHTML = displayText;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.setAttribute('data-counted', 'true');
        // Eye-catching flash when counter finishes
        element.style.color = 'var(--neon-green)';
        element.style.textShadow = '0 0 20px rgba(0, 255, 136, 0.8)';
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
          element.style.color = '';
          element.style.textShadow = '';
          element.style.transform = 'scale(1)';
        }, 300);
      }
    }

    requestAnimationFrame(updateCounter);
  }

  // Pre-apply transition rule so the scale down is smooth
  document.querySelectorAll('.stat-number').forEach(el => {
    el.style.transition = 'all 0.3s var(--ease-spring)';
    el.style.display = 'inline-block';
  });

  function initCounters() {
    const statsSection = $('#statsGrid');
    if (!statsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersAnimated) {
            countersAnimated = true;
            const statNumbers = $$('.stat-number');
            statNumbers.forEach((el, i) => {
              setTimeout(() => animateCounter(el), i * 250);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(statsSection);
  }

  // ================================================================
  // SCROLL REVEAL ANIMATIONS
  // ================================================================
  function initScrollReveal() {
    const revealElements = $$('.reveal, .reveal-stagger, .reveal-scale, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: REVEAL_THRESHOLD,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    // Dynamic Row Entrance for Comparison Table
    const tableRows = document.querySelectorAll('.comparison-table tbody tr');
    tableRows.forEach((row, index) => {
      row.style.opacity = '0';
      row.style.transform = 'translateY(30px) scale(0.95)';
      row.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.15}s, background 0.3s ease, box-shadow 0.3s ease`;
      observer.observe(row);
    });
  }

  initScrollReveal();

  // Make the row visible when observed
  const rowObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0) scale(1)';
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.comparison-table tbody tr').forEach(row => {
    rowObserver.observe(row);
  });

  // ================================================================
  // FAQ ACCORDION
  // ================================================================
  window.toggleFaq = function (id) {
    const item = document.getElementById(id);
    if (!item) return;

    const isActive = item.classList.contains('active');

    // Close all
    $$('.faq-item').forEach((faq) => faq.classList.remove('active'));

    // Open clicked (if it wasn't already open)
    if (!isActive) {
      item.classList.add('active');
      
      // Hacker Text Scramble Effect
      const answerInner = item.querySelector('.faq-answer-inner');
      if (answerInner && !answerInner.dataset.scrambled) {
        answerInner.dataset.scrambled = "true";
        const originalText = answerInner.innerText;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
        let iterations = 0;
        
        const interval = setInterval(() => {
          answerInner.innerText = originalText.split("").map((letter, index) => {
            if(index < iterations) {
              return originalText[index];
            }
            return letters[Math.floor(Math.random() * letters.length)];
          }).join("");
          
          if(iterations >= originalText.length){
            clearInterval(interval);
            answerInner.dataset.scrambled = ""; // Reset so it can happen again
          }
          
          iterations += 2; // Speed of reveal
        }, 15);
      }
    }
  };

  // ================================================================
  // TOAST NOTIFICATION
  // ================================================================
  let toastTimer = null;

  window.showToast = function (message) {
    clearTimeout(toastTimer);
    toast.innerHTML = message;
    toast.classList.add('show');

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };

  // ================================================================
  // INTERACTIVE BENEFITS MODAL
  // ================================================================
  const benefitDetails = {
    "1": {
      badge: "Benefit 01",
      icon: "🏙️",
      title: "Urban Farming Revolution",
      desc: "Transform abandoned warehouses, rooftops, and basements into productive farms. Grow food directly where people live, eliminating food miles and supply chain fragility.",
      stats: "Reduces transport emissions by up to 95%, delivering 100% fresh, locally sourced produce on harvest day.",
      caseStudy: "AeroFarms in Newark, NJ converted a former steel mill into a vertical farm, producing millions of pounds of leafy greens annually right next to NYC.",
      solution: "HydroSync’s micro-growing setups allow anyone to turn vacant garages, rooftops, or basements into highly efficient growing hubs."
    },
    "2": {
      badge: "Benefit 02",
      icon: "🔬",
      title: "Precision Nutrition",
      desc: "Deliver the exact mineral formula each plant needs at every single growth stage. The result? Higher vitamin concentration, richer flavor profiles, and consistent quality every harvest.",
      stats: "Increases vitamin concentration by up to 30% without chemical residue or nutrient leaching into soil.",
      caseStudy: "University studies show hydroponic spinach and basil hold their nutrient density twice as long after harvest compared to soil equivalents.",
      solution: "HydroSync AI monitors dissolved salts (EC) and pH levels, feeding the perfect NPK recipe automatically."
    },
    "3": {
      badge: "Benefit 03",
      icon: "🌍",
      title: "Climate Resilience",
      desc: "Droughts, floods, cold snaps, and heatwaves don't affect indoor hydroponic farms. Build stable, local food security that easily withstands the global climate crisis.",
      stats: "100% weatherproof production that runs 365 days a year without season-based limitations.",
      caseStudy: "During severe droughts in California, indoor hydroponic facilities maintained their full agricultural output while soil farms lost up to 50% of their crops.",
      solution: "Our climate automation tracks indoor temperature, humidity, and CO₂ to keep systems in a perpetual growing season."
    },
    "4": {
      badge: "Benefit 04",
      icon: "📊",
      title: "10× Higher Yield",
      desc: "Vertical stacking and optimized spacing mean hydroponic farms produce up to 10 times more food per square foot than conventional farms. Maximize output on minimal land.",
      stats: "Produces up to 10x more yield per square foot while accelerating crop growth cycles by 30-50%.",
      caseStudy: "A vertical hydroponic lettuce farm occupying 1 acre yields the same crop output as a 10-acre flat soil farm.",
      solution: "Modular racking systems stack channels up to 8 layers high, paired with optimized LED light distribution."
    },
    "5": {
      badge: "Benefit 05",
      icon: "♻️",
      title: "Zero Soil Erosion",
      desc: "No soil means no topsoil depletion or degradation. Protect our planet's precious land resources while still feeding billions of people sustainably.",
      stats: "Saves 100% of topsoil and completely eliminates chemical fertilizer runoff into local rivers.",
      caseStudy: "The United Nations warns that 90% of Earth’s topsoil could be degraded by 2050. Hydroponics takes agricultural pressure off degraded soils.",
      solution: "HydroSync recirculates 100% of its nutrient-rich water in a closed loop, ensuring zero runoff leaks into nature."
    },
    "6": {
      badge: "Benefit 06",
      icon: "⚡",
      title: "Energy Efficient",
      desc: "Modern LED grow lights and automated systems cut energy costs dramatically. Photosynthetically Active Radiation (PAR) spectrums target the exact wavelengths plants absorb.",
      stats: "Consumes up to 70% less electricity than older metal-halide lighting, easily powered by off-grid solar panels.",
      caseStudy: "Modern smart greenhouse networks in Spain utilize rooftop solar arrays to power their automated fans and irrigation pumps, hitting carbon-neutral status.",
      solution: "HydroSync LED arrays operate on low-voltage DC grids, perfectly compatible with standard solar battery backups."
    }
  };

  const benefitCards = $$('.benefit-card');
  const detailModal = $('#detailModal');
  const detailModalClose = $('#detailModalClose');

  if (benefitCards && detailModal && detailModalClose) {
    benefitCards.forEach((card, idx) => {
      const benefitId = (idx + 1).toString();
      card.style.cursor = 'pointer';

      card.addEventListener('click', () => {
        const details = benefitDetails[benefitId];
        if (details) {
          $('#modalBadge').innerText = details.badge;
          $('#modalIcon').innerText = details.icon;
          $('#modalTitle').innerText = details.title;
          $('#modalDesc').innerHTML = details.desc;
          $('#modalStats').innerText = details.stats;
          $('#modalCase').innerText = details.caseStudy;
          $('#modalSolution').innerText = details.solution;

          detailModal.classList.add('active');
          document.body.style.overflow = 'hidden';

          if (window.showToast) {
            window.showToast(`Opened detailed info on: ${details.title} 🔬`);
          }
        }
      });
    });

    detailModalClose.addEventListener('click', () => {
      detailModal.classList.remove('active');
      document.body.style.overflow = '';
    });

    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) {
        detailModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && detailModal.classList.contains('active')) {
        detailModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ================================================================
  // PARALLAX EFFECT ON HERO (subtle)
  // ================================================================
  const hero = $('#hero');
  const handleParallax = throttle(() => {
    if (!hero) return;
    const scrollY = window.scrollY;
    const heroHeight = hero.offsetHeight;

    if (scrollY < heroHeight) {
      const parallaxValue = scrollY * 0.3;
      const opacityValue = 1 - scrollY / heroHeight;
      hero.style.transform = `translateY(${parallaxValue}px)`;
      hero.style.opacity = clamp(opacityValue, 0, 1);
    }
  }, 16);

  window.addEventListener('scroll', handleParallax);

  // ================================================================
  // 3D TILT EFFECT ON HERO TEXT (Excitement on initial load)
  // ================================================================
  const heroTitle = $('.hero-title');
  const heroSubtitle = $('.hero-subtitle');
  if (hero && heroTitle && heroSubtitle) {
    heroTitle.style.transition = 'transform 0.1s ease-out';
    heroSubtitle.style.transition = 'transform 0.1s ease-out';
    
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      heroTitle.style.transform = `perspective(1000px) rotateX(${y * -15}deg) rotateY(${x * 15}deg) translateZ(20px)`;
      heroSubtitle.style.transform = `perspective(1000px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) translateZ(10px)`;
    });

    hero.addEventListener('mouseleave', () => {
      heroTitle.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      heroSubtitle.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      
      // Re-apply original transition for mouseleave smoothness
      heroTitle.style.transition = 'transform 0.5s ease-out';
      heroSubtitle.style.transition = 'transform 0.5s ease-out';
    });
    
    hero.addEventListener('mouseenter', () => {
       heroTitle.style.transition = 'transform 0.1s ease-out';
       heroSubtitle.style.transition = 'transform 0.1s ease-out';
    });
  }

  // ================================================================
  // TILT EFFECT ON STAT CARDS
  // ================================================================
  $$('.stat-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const tiltX = y * -8; // degrees
      const tiltY = x * 8;

      card.style.transform = `translateY(-8px) perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ================================================================
  // TILT EFFECT ON BENEFIT CARDS
  // ================================================================
  $$('.benefit-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      card.style.transform = `translateY(-6px) perspective(600px) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ================================================================
  // COMPARISON TABLE ROW HIGHLIGHT ANIMATION
  // ================================================================
  $$('.comparison-table tbody tr').forEach((row, i) => {
    row.style.opacity = '0';
    row.style.transform = 'translateX(-20px)';
    row.style.transition = `all 0.5s ${0.05 * i}s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))`;
  });

  const tableObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$('.comparison-table tbody tr').forEach((row) => {
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
          });
          tableObserver.disconnect();
        }
      });
    },
    { threshold: 0.2 }
  );

  const compTable = $('#comparisonTable');
  if (compTable) tableObserver.observe(compTable);

  // ================================================================
  // ACTIVE NAV LINK HIGHLIGHT ON SCROLL
  // ================================================================
  const sections = $$('section[id]');

  const handleActiveNav = throttle(() => {
    const scrollPos = window.scrollY + 200;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        $$('.nav-links a').forEach((link) => {
          link.style.color = '';
          if (link.getAttribute('href') === '#' + id) {
            link.style.color = '#00ff88';
          }
        });
      }
    });
  }, 150);

  window.addEventListener('scroll', handleActiveNav);

  // ================================================================
  // TYPING EFFECT ON HERO BADGE (one-time)
  // ================================================================
  const heroBadge = $('.hero-badge');
  if (heroBadge) {
    heroBadge.style.animation = 'fadeSlideDown 0.8s 0.2s both, floatBadge 3s 2s ease-in-out infinite';
  }

  // ================================================================
  // EASTER EGG — Konami Code
  // ================================================================
  const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];
  let konamiIndex = 0;

  document.addEventListener('keydown', (e) => {
    if (e.code === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        konamiIndex = 0;
        activateEasterEgg();
      }
    } else {
      konamiIndex = 0;
    }
  });

  function activateEasterEgg() {
    // Rainbow particles burst
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: hsl(${Math.random() * 360}, 80%, 60%);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        z-index: 99999;
        pointer-events: none;
        animation: easterEggBurst 1.5s ease-out forwards;
      `;

      const angle = (Math.PI * 2 * i) / 50;
      const distance = 100 + Math.random() * 300;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      p.animate(
        [
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 },
        ],
        { duration: 1500, easing: 'ease-out', fill: 'forwards' }
      );

      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }

    showToast('🌈 You found the easter egg! Hydroponic magic! ✨');
  }

  // ================================================================
  // INTERSECTION-BASED LAZY ANIMATIONS (extra polish)
  // ================================================================

  // Animate timeline dots sequentially
  const timelineDots = $$('.timeline-dot');
  timelineDots.forEach((dot, i) => {
    dot.style.opacity = '0';
    dot.style.transform = 'scale(0)';
    dot.style.transition = `all 0.5s ${0.2 * i}s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1))`;
  });

  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          timelineDots.forEach((dot) => {
            dot.style.opacity = '1';
            dot.style.transform = 'scale(1)';
          });
          timelineObserver.disconnect();
        }
      });
    },
    { threshold: 0.15 }
  );

  const timelineEl = $('.timeline');
  if (timelineEl) timelineObserver.observe(timelineEl);

  // ================================================================
  // MAGNETIC BUTTON EFFECT ON CTA
  // ================================================================
  const ctaBtn = $('#ctaJoin');
  if (ctaBtn) {
    ctaBtn.addEventListener('mousemove', (e) => {
      const rect = ctaBtn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      ctaBtn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.03)`;
    });

    ctaBtn.addEventListener('mouseleave', () => {
      ctaBtn.style.transform = '';
    });
  }

  // ================================================================
  // DYNAMIC STAT RIPPLE on click
  // ================================================================
  $$('.stat-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      const ripple = document.createElement('div');
      const rect = card.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(0, 255, 136, 0.2), transparent 70%);
        border-radius: 50%;
        top: ${e.clientY - rect.top - size / 2}px;
        left: ${e.clientX - rect.left - size / 2}px;
        pointer-events: none;
        z-index: 10;
        animation: rippleOut 0.8s ease-out forwards;
      `;

      card.style.position = 'relative';
      card.appendChild(ripple);
      setTimeout(() => ripple.remove(), 800);
    });
  });

  // Inject ripple keyframes
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes rippleOut {
      0%   { transform: scale(0); opacity: 1; }
      100% { transform: scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(rippleStyle);

  // ================================================================
  // SMOOTH ANCHOR LINK SCROLLING (for all internal # links)
  // ================================================================
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ================================================================
  // MARQUEE PAUSE ON HOVER
  // ================================================================
  const marqueeTrack = $('#marqueeTrack');
  if (marqueeTrack) {
    marqueeTrack.addEventListener('mouseenter', () => {
      marqueeTrack.style.animationPlayState = 'paused';
    });
    marqueeTrack.addEventListener('mouseleave', () => {
      marqueeTrack.style.animationPlayState = 'running';
    });
  }

  // ================================================================
  // KEYBOARD ACCESSIBILITY for FAQ
  // ================================================================
  $$('.faq-question').forEach((question) => {
    question.setAttribute('tabindex', '0');
    question.setAttribute('role', 'button');
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });

  // ================================================================
  // DYNAMIC YEAR IN FOOTER
  // ================================================================
  const footerYear = document.querySelector('.footer-bottom p');
  if (footerYear) {
    const currentYear = new Date().getFullYear();
    footerYear.innerHTML = footerYear.innerHTML.replace('2026', currentYear);
  }

  // ================================================================
  // PRINT INITIALIZATION LOG
  // ================================================================
  console.log(
    '%c🌱 HydroSync — Why Hydroponics? %c Loaded successfully!',
    'background: #10b981; color: #0a0f0d; padding: 6px 12px; border-radius: 4px 0 0 4px; font-weight: bold;',
    'background: #1a2b23; color: #00ff88; padding: 6px 12px; border-radius: 0 4px 4px 0;'
  );

  // ================================================================
  // AI CHATBOT LOGIC — Offline Agriculture Knowledge Base
  // ================================================================
  const chatInput = $('#aiChatInput');
  const chatBtn = $('#aiChatBtn');
  const chatBody = $('#aiChatBody');

  if (chatInput && chatBtn && chatBody) {

    // ── Agriculture keyword → topic mapping ──
    const AGRI_KEYWORDS = [
      'farm','farming','crop','crops','plant','plants','seed','seeds','soil',
      'water','irrigation','fertilizer','fertiliser','nutrient','nutrients',
      'harvest','harvesting','grow','growing','garden','gardening','organic',
      'pesticide','pest','pests','insect','insects','weed','weeds','herbicide',
      'fungicide','compost','mulch','manure','livestock','cattle','poultry',
      'dairy','fish','aquaculture','aquaponics','hydroponics','hydroponic',
      'aeroponics','aeroponic','greenhouse','polyhouse','vertical','indoor',
      'outdoor','agriculture','agri','horticulture','floriculture','silviculture',
      'permaculture','sustainable','sustainability','regenerative','food',
      'vegetable','vegetables','fruit','fruits','grain','grains','rice','wheat',
      'corn','maize','soybean','tomato','lettuce','strawberry','herb','herbs',
      'basil','mint','spinach','kale','pepper','cucumber','bean','beans',
      'potato','onion','garlic','carrot','cabbage','broccoli','pea','peas',
      'sunflower','cotton','sugarcane','tea','coffee','cocoa','rubber',
      'drip','sprinkler','flood','furrow','rain','rainfall','drought',
      'climate','weather','season','monsoon','temperature','humidity',
      'ph','ec','ppm','tds','nitrogen','phosphorus','potassium','npk',
      'calcium','magnesium','iron','zinc','boron','manganese','sulfur',
      'nft','dwc','ebb','flow','kratky','wick','dutch','bucket',
      'rockwool','perlite','vermiculite','coco','coir','clay','pebbles',
      'led','grow light','light','photosynthesis','chlorophyll',
      'root','roots','stem','leaf','leaves','flower','flowers','bloom',
      'pollination','pollinator','bee','bees','butterfly',
      'tractor','plow','plough','tillage','no-till','drone','sensor',
      'iot','smart','precision','gmo','hybrid','heirloom','variety',
      'yield','production','acre','hectare','field','terrace','raised bed',
      'row','spacing','transplant','germination','seedling','propagation',
      'prune','pruning','graft','grafting','cutting','clone',
      'disease','blight','rot','mildew','fungus','fungi','virus','bacteria',
      'aphid','mite','caterpillar','slug','snail','nematode','whitefly',
      'ipm','biological control','biocontrol','trap','companion planting',
      'rotation','cover crop','green manure','intercropping','monoculture',
      'polyculture','agroforestry','silvopasture','windbreak',
      'goat','sheep','pig','chicken','duck','turkey','rabbit','cow','buffalo',
      'milk','egg','eggs','meat','wool','honey','beekeeping','apiculture',
      'feed','fodder','hay','silage','pasture','grazing','rangeland',
      'market','price','export','import','supply','demand','cold storage',
      'processing','value','chain','cooperative','subsidy','loan','insurance',
      'fao','usda','icar','krishi','msp','apmc',
      'erosion','conservation','watershed','biodiversity','ecosystem',
      'carbon','footprint','emission','renewable','solar','biogas',
      'vermicompost','biofertilizer','biopesticide','neem','azadirachtin',
      'mushroom','algae','seaweed','microgreen','sprout','fodder',
      'saffron','vanilla','cinnamon','turmeric','ginger','chili','spice',
      'plantation','orchard','vineyard','nursery','tissue culture',
      'macro','micro','deficiency','toxicity','chlorosis','necrosis',
      'reservoir','pump','timer','air stone','net pot','medium',
      'ph meter','ec meter','solution','concentrate','dilute',
      'tropical','subtropical','temperate','arid','semi-arid','humid',
      'loam','sandy','clay','silt','peat','alkaline','acidic','saline',
      'tube well','canal','dam','borewell','sprinkler','center pivot',
      'subsurface','fogponics','bioponics','organics',
      'farmspherica','hydrosync'
    ];

    // ── Knowledge Base (60+ detailed entries) ──
    const knowledgeBase = [
      // ===== HYDROPONICS CORE =====
      {
        keys: ['hydroponics','hydroponic','what is hydroponics','define hydroponics','hydro'],
        answer: `<strong>🌿 Hydroponics</strong> is the science of growing plants <em>without soil</em>, using mineral nutrient solutions dissolved in water. The roots sit in an inert medium (like perlite, rockwool, or clay pebbles) or directly in nutrient-rich water.<br><br>
        <strong>Key advantages:</strong><br>
        • Uses <strong>90% less water</strong> than traditional farming<br>
        • Plants grow <strong>30–50% faster</strong><br>
        • No soil-borne diseases or weeds<br>
        • Can be done <strong>anywhere</strong> — rooftops, basements, deserts<br>
        • Year-round production regardless of climate<br><br>
        It's literally the future of food production! 🚀`
      },
      {
        keys: ['nft','nutrient film technique','nutrient film'],
        answer: `<strong>🔬 Nutrient Film Technique (NFT)</strong> is a hydroponic method where a <em>thin film</em> of nutrient solution continuously flows over the plant roots in a sloped channel.<br><br>
        <strong>How it works:</strong><br>
        • Channels tilted at 1–3% slope<br>
        • Pump circulates solution from a reservoir<br>
        • Roots absorb nutrients as solution flows past<br>
        • Excess drains back to reservoir (recirculating)<br><br>
        <strong>Best for:</strong> Lettuce, herbs, strawberries, and lightweight leafy greens.<br>
        <strong>Watch out:</strong> Power failures can dry roots quickly since there's no growing medium to retain moisture.`
      },
      {
        keys: ['dwc','deep water culture','deep water','kratky'],
        answer: `<strong>💧 Deep Water Culture (DWC)</strong> suspends plant roots directly in a <em>deep reservoir</em> of oxygenated nutrient solution.<br><br>
        <strong>Components:</strong> Reservoir, net pots, air pump, air stones, nutrient solution<br>
        <strong>Key point:</strong> Air stones constantly bubble oxygen into the water — without this, roots drown!<br><br>
        <strong>Kratky Method</strong> is the <em>passive</em> version — no pump needed. You fill the reservoir once and let the water level drop as the plant drinks. An air gap forms naturally above the water, giving roots oxygen.<br><br>
        DWC is beginner-friendly and great for lettuce, basil, and fast-growing herbs! 🌱`
      },
      {
        keys: ['ebb','flow','ebb and flow','flood and drain','flood drain'],
        answer: `<strong>🌊 Ebb & Flow (Flood and Drain)</strong> periodically floods the grow tray with nutrient solution, then drains it back to the reservoir.<br><br>
        • A timer controls the pump cycle (typically floods every 2–4 hours)<br>
        • Roots get nutrients during flood, oxygen during drain<br>
        • Works great with clay pebbles, perlite, or rockwool<br><br>
        <strong>Best for:</strong> Tomatoes, peppers, cucumbers, and larger fruiting plants.<br>
        Very versatile and forgiving — one of the most popular systems for hobby growers! 🍅`
      },
      {
        keys: ['aeroponics','aeroponic'],
        answer: `<strong>☁️ Aeroponics</strong> is the most high-tech hydroponic method. Plant roots hang in <em>mid-air</em> inside a closed chamber and are misted with nutrient solution every few seconds.<br><br>
        <strong>Benefits:</strong><br>
        • Uses <strong>95% less water</strong> than soil farming<br>
        • Maximum oxygen exposure = explosive growth<br>
        • NASA researched it for growing food in space! 🚀<br><br>
        <strong>Challenge:</strong> Expensive setup, nozzles can clog, and any system failure means roots dry out fast.<br>
        Used commercially by companies like AeroFarms for large-scale vertical farming.`
      },
      {
        keys: ['aquaponics','aquaponic','fish','tilapia'],
        answer: `<strong>🐟 Aquaponics</strong> combines <em>aquaculture</em> (raising fish) with <em>hydroponics</em> in a symbiotic loop:<br><br>
        1. Fish produce waste (ammonia) 🐟<br>
        2. Beneficial bacteria convert it to nitrates 🦠<br>
        3. Plants absorb nitrates as fertilizer 🌿<br>
        4. Cleaned water returns to the fish tank 💧<br><br>
        <strong>Popular fish:</strong> Tilapia, catfish, trout, koi, goldfish<br>
        <strong>Best crops:</strong> Leafy greens, herbs, tomatoes<br><br>
        It's a <em>zero-waste ecosystem</em> — you get both fresh vegetables AND fish protein! 🎯`
      },
      {
        keys: ['vertical farming','vertical farm','vertical','indoor farming','indoor farm'],
        answer: `<strong>🏢 Vertical Farming</strong> grows crops in stacked layers inside controlled indoor environments.<br><br>
        <strong>Features:</strong><br>
        • LED grow lights replace sunlight<br>
        • Climate-controlled (temperature, humidity, CO₂)<br>
        • Uses hydroponics or aeroponics<br>
        • Can produce food <strong>365 days a year</strong><br>
        • Located in cities — reduces transportation emissions<br><br>
        <strong>Companies leading the charge:</strong> AeroFarms, Plenty, Bowery Farming, Infarm<br>
        One acre of vertical farm = <strong>10–20 acres</strong> of traditional farmland in output! 📈`
      },
      // ===== NUTRIENTS & pH =====
      {
        keys: ['nutrient','nutrients','npk','nitrogen','phosphorus','potassium','fertilizer','fertiliser','plant food','plant nutrition'],
        answer: `<strong>🧪 Plant Nutrients — The Big 3 (N-P-K):</strong><br><br>
        • <strong>Nitrogen (N):</strong> Drives leafy growth, makes plants green & lush<br>
        • <strong>Phosphorus (P):</strong> Powers root development, flowering & fruiting<br>
        • <strong>Potassium (K):</strong> Strengthens overall plant health, disease resistance<br><br>
        <strong>Secondary nutrients:</strong> Calcium, Magnesium, Sulfur<br>
        <strong>Micronutrients:</strong> Iron, Zinc, Boron, Manganese, Copper, Molybdenum<br><br>
        In hydroponics, <strong>all nutrients must be supplied in the water</strong> since there's no soil. Pre-mixed solutions like General Hydroponics Flora Series make this easy!<br><br>
        <strong>Pro tip:</strong> Nutrient deficiencies show up as yellowing leaves (nitrogen), purple stems (phosphorus), or brown leaf edges (potassium). 🔍`
      },
      {
        keys: ['ph','acid','alkaline','ph level','ph balance','ph meter'],
        answer: `<strong>⚗️ pH in Agriculture</strong> controls whether plants can absorb nutrients properly.<br><br>
        <strong>Optimal ranges:</strong><br>
        • Hydroponics: <strong>5.5–6.5</strong><br>
        • Soil growing: <strong>6.0–7.0</strong><br>
        • Aquaponics: <strong>6.8–7.2</strong> (compromise between fish & plants)<br><br>
        If pH is too high or too low, nutrients get "locked out" even if they're present in the water — the plant simply can't absorb them!<br><br>
        <strong>To lower pH:</strong> Use phosphoric acid or pH Down<br>
        <strong>To raise pH:</strong> Use potassium hydroxide or pH Up<br>
        Always test daily with a digital pH meter for accuracy! 📏`
      },
      {
        keys: ['ec','ppm','tds','electrical conductivity','total dissolved'],
        answer: `<strong>📊 EC / PPM / TDS — Measuring Nutrient Strength:</strong><br><br>
        • <strong>EC (Electrical Conductivity):</strong> Measures total dissolved salts in water (mS/cm)<br>
        • <strong>PPM (Parts Per Million):</strong> Another way to express the same thing<br>
        • <strong>TDS (Total Dissolved Solids):</strong> Same concept, different scale<br><br>
        <strong>Typical EC ranges:</strong><br>
        • Seedlings: 0.5–0.8 EC<br>
        • Leafy greens: 1.0–1.6 EC<br>
        • Fruiting crops: 1.8–2.8 EC<br><br>
        Too high = nutrient burn (brown crispy tips). Too low = slow, weak growth. Monitor and adjust regularly! 🎛️`
      },
      // ===== GROWING MEDIA =====
      {
        keys: ['rockwool','perlite','vermiculite','coco','coir','clay pebbles','growing media','medium','grow medium','substrate'],
        answer: `<strong>🧱 Hydroponic Growing Media:</strong><br><br>
        • <strong>Rockwool:</strong> Spun basalt rock fibers. Excellent water retention. Industry standard for commercial grows<br>
        • <strong>Perlite:</strong> Volcanic glass, super lightweight. Great drainage, good aeration<br>
        • <strong>Vermiculite:</strong> Expanded mica. High water retention, often mixed with perlite<br>
        • <strong>Coco Coir:</strong> Coconut husk fiber. Sustainable, pH-neutral, great root aeration<br>
        • <strong>Clay Pebbles (LECA):</strong> Lightweight expanded clay. Reusable, pH-stable, excellent drainage<br><br>
        <strong>Rule of thumb:</strong> Leafy greens prefer moisture-retentive media. Fruiting plants prefer well-draining media. 🌱`
      },
      // ===== GROW LIGHTS =====
      {
        keys: ['led','grow light','light','lighting','photosynthesis','par','spectrum','lumens','ppfd'],
        answer: `<strong>💡 Grow Lights for Indoor Farming:</strong><br><br>
        • <strong>LED:</strong> Most efficient. Low heat, tunable spectrum, long lifespan (50,000+ hrs). Industry standard now<br>
        • <strong>HPS (High Pressure Sodium):</strong> Old school, very hot, great for flowering<br>
        • <strong>Fluorescent (T5/CFL):</strong> Budget option for seedlings & herbs<br><br>
        <strong>Key metrics:</strong><br>
        • <strong>PAR (Photosynthetically Active Radiation):</strong> The light wavelengths plants actually use (400–700nm)<br>
        • <strong>PPFD:</strong> How much usable light hits the plant canopy<br><br>
        Plants need <strong>blue light</strong> for vegetative growth and <strong>red light</strong> for flowering & fruiting. Full-spectrum LEDs provide both! 🌈`
      },
      // ===== SOIL FARMING =====
      {
        keys: ['soil','soil type','loam','sandy','clay soil','silt','soil health','soil test','soil composition'],
        answer: `<strong>🌍 Soil Types & Health:</strong><br><br>
        • <strong>Sandy soil:</strong> Drains fast, low nutrients. Good for carrots, radishes<br>
        • <strong>Clay soil:</strong> Retains water, compacts easily. Rich but heavy<br>
        • <strong>Silt soil:</strong> Smooth texture, fertile, retains moisture well<br>
        • <strong>Loam:</strong> The GOLD STANDARD — balanced mix of sand, silt, clay. Best for most crops!<br>
        • <strong>Peat:</strong> Acidic, high organic matter. Great for blueberries<br><br>
        <strong>Healthy soil contains:</strong> 45% minerals, 25% water, 25% air, 5% organic matter<br>
        <strong>Pro tip:</strong> Get a soil test before planting! It tells you pH, nutrients, and what amendments you need. 🧪`
      },
      {
        keys: ['compost','composting','vermicompost','worm','decompose','organic matter','humus'],
        answer: `<strong>♻️ Composting — Nature's Recycling:</strong><br><br>
        Composting turns kitchen scraps, yard waste, and organic matter into <em>nutrient-rich humus</em>.<br><br>
        <strong>Types:</strong><br>
        • <strong>Hot composting:</strong> Piles reach 55–65°C, breaks down in 1–3 months<br>
        • <strong>Cold composting:</strong> Passive, takes 6–12 months<br>
        • <strong>Vermicomposting:</strong> Red wiggler worms do the work! Produces premium worm castings<br><br>
        <strong>Recipe:</strong> 3 parts "browns" (carbon: dry leaves, cardboard) + 1 part "greens" (nitrogen: food scraps, grass clippings)<br>
        Keep moist like a wrung-out sponge, turn regularly for oxygen. 🪱`
      },
      // ===== IRRIGATION =====
      {
        keys: ['irrigation','drip','sprinkler','flood irrigation','furrow','watering','water management','center pivot','subsurface'],
        answer: `<strong>💦 Irrigation Methods:</strong><br><br>
        • <strong>Drip irrigation:</strong> Most efficient (90–95%). Water drips directly to roots through emitters. Saves water massively<br>
        • <strong>Sprinkler:</strong> Mimics rainfall. 70–80% efficient. Good for large fields<br>
        • <strong>Center pivot:</strong> Giant rotating sprinkler arms. Used on massive farms<br>
        • <strong>Flood/Furrow:</strong> Oldest method. Water flows through channels. Only 40–50% efficient<br>
        • <strong>Subsurface drip:</strong> Buried drip lines. Minimal evaporation loss<br><br>
        <strong>Fun fact:</strong> Agriculture uses <strong>70% of global freshwater</strong>. Switching to drip irrigation alone could save trillions of liters annually! 🌊`
      },
      // ===== PESTS & DISEASES =====
      {
        keys: ['pest','pests','insect','insects','aphid','mite','caterpillar','whitefly','slug','nematode','bug','bugs','pest control'],
        answer: `<strong>🐛 Common Crop Pests:</strong><br><br>
        • <strong>Aphids:</strong> Tiny sap-suckers. Spread viruses. Blast with water or use neem oil<br>
        • <strong>Spider mites:</strong> Microscopic web-spinners. Thrive in dry conditions<br>
        • <strong>Whiteflies:</strong> Cloud up when disturbed. Yellow sticky traps work great<br>
        • <strong>Caterpillars:</strong> Chew leaves ragged. Use Bt (Bacillus thuringiensis)<br>
        • <strong>Slugs/Snails:</strong> Night feeders. Beer traps or diatomaceous earth<br>
        • <strong>Nematodes:</strong> Microscopic root parasites. Rotate crops & use marigolds<br><br>
        <strong>IPM (Integrated Pest Management)</strong> combines biological control, crop rotation, and minimal chemical use. Always the smartest approach! 🛡️`
      },
      {
        keys: ['disease','blight','rot','mildew','fungus','fungi','virus','bacteria','plant disease','wilt','rust','canker'],
        answer: `<strong>🦠 Common Plant Diseases:</strong><br><br>
        • <strong>Powdery mildew:</strong> White powder on leaves. Improve air circulation, use sulfur spray<br>
        • <strong>Root rot:</strong> Caused by overwatering/poor drainage. Roots turn brown & mushy<br>
        • <strong>Late blight:</strong> The one that caused the Irish Potato Famine! Brown lesions on leaves & fruit<br>
        • <strong>Fusarium wilt:</strong> Fungus blocks water transport. Plant wilts despite watering<br>
        • <strong>Bacterial leaf spot:</strong> Dark water-soaked spots. Remove infected leaves immediately<br>
        • <strong>Mosaic virus:</strong> Mottled yellow-green pattern on leaves. No cure — remove plant<br><br>
        <strong>Prevention > Cure:</strong> Good hygiene, proper spacing, resistant varieties, and crop rotation. 🏥`
      },
      {
        keys: ['pesticide','herbicide','fungicide','insecticide','chemical','spray','neem','organic pest','biological control','biocontrol','ipm'],
        answer: `<strong>🧴 Pest & Disease Control Methods:</strong><br><br>
        <strong>Organic options:</strong><br>
        • <strong>Neem oil:</strong> Natural insecticide & fungicide. Works on 200+ pest species<br>
        • <strong>Bt spray:</strong> Kills caterpillars but safe for bees<br>
        • <strong>Diatomaceous earth:</strong> Shreds soft-bodied insects<br>
        • <strong>Companion planting:</strong> Marigolds repel nematodes, basil repels aphids<br><br>
        <strong>Biological control:</strong><br>
        • Ladybugs eat aphids (1 ladybug = 50 aphids/day!)<br>
        • Lacewings, parasitic wasps, predatory mites<br><br>
        <strong>Chemical pesticides</strong> should be a LAST resort. Always follow label instructions and observe pre-harvest intervals. ⚠️`
      },
      // ===== SPECIFIC CROPS =====
      {
        keys: ['tomato','tomatoes'],
        answer: `<strong>🍅 Growing Tomatoes:</strong><br><br>
        • <strong>Temperature:</strong> 20–30°C (love warmth, hate frost)<br>
        • <strong>pH:</strong> 5.8–6.5 (hydro) or 6.0–6.8 (soil)<br>
        • <strong>Spacing:</strong> 45–60cm apart<br>
        • <strong>Sunlight:</strong> 6–8 hours minimum<br>
        • <strong>Nutrients:</strong> Heavy feeders! Need lots of calcium to prevent blossom end rot<br><br>
        <strong>Types:</strong> Determinate (bush, all fruit at once) vs Indeterminate (vine, continuous harvest)<br>
        <strong>Pro tip:</strong> Prune suckers (side shoots) for bigger fruits. Stake or cage for support. Best crop for hydroponic beginners! 🌱`
      },
      {
        keys: ['lettuce','leafy','greens','salad'],
        answer: `<strong>🥬 Growing Lettuce & Leafy Greens:</strong><br><br>
        • <strong>Temperature:</strong> 15–22°C (cool-season crop, bolts in heat)<br>
        • <strong>pH:</strong> 5.5–6.5<br>
        • <strong>Harvest:</strong> 30–45 days from seed<br>
        • <strong>Light:</strong> 10–14 hours of moderate light<br><br>
        <strong>Varieties:</strong> Butterhead, Romaine, Iceberg, Loose-leaf, Arugula, Spinach, Kale<br><br>
        Lettuce is the <strong>#1 hydroponic crop worldwide</strong> because it's fast, easy, and profitable. Perfect for NFT and DWC systems. Most commercial vertical farms grow primarily lettuce! 💚`
      },
      {
        keys: ['strawberry','strawberries','berry','berries'],
        answer: `<strong>🍓 Growing Strawberries:</strong><br><br>
        • <strong>Temperature:</strong> 15–26°C<br>
        • <strong>pH:</strong> 5.5–6.5<br>
        • <strong>Sunlight:</strong> 8+ hours<br>
        • <strong>Systems:</strong> NFT, vertical towers, Dutch buckets<br><br>
        <strong>Hydroponic strawberries</strong> produce <strong>3x more</strong> fruit per square foot than soil-grown. Plus no soil splash = cleaner berries!<br>
        <strong>Pro tip:</strong> Remove first flowers to strengthen the plant, then let it fruit. Use day-neutral varieties for year-round production. 🫐`
      },
      {
        keys: ['herb','herbs','basil','mint','cilantro','parsley','thyme','rosemary','oregano'],
        answer: `<strong>🌿 Growing Herbs:</strong><br><br>
        Herbs are the <em>easiest</em> and most <em>profitable</em> crops for hydroponic systems!<br><br>
        • <strong>Basil:</strong> King of hydroponic herbs. Loves warmth (20–25°C). Harvest from top to encourage bushy growth<br>
        • <strong>Mint:</strong> Aggressive grower. Keep separate or it takes over!<br>
        • <strong>Cilantro:</strong> Bolts quickly in heat. Keep cool (15–20°C)<br>
        • <strong>Parsley:</strong> Slow to germinate (2–3 weeks) but grows for months<br>
        • <strong>Rosemary/Thyme:</strong> Prefer drier conditions. Lower EC nutrients<br><br>
        <strong>Profit tip:</strong> Fresh herbs sell for $15–30/kg at farmers markets. Massive markup vs. growing cost! 💰`
      },
      {
        keys: ['rice','paddy','wetland','flooded'],
        answer: `<strong>🌾 Rice Farming:</strong><br><br>
        Rice feeds <strong>half the world's population</strong>! It's grown in flooded paddies (standing water suppresses weeds).<br><br>
        • <strong>Temperature:</strong> 20–35°C<br>
        • <strong>Water:</strong> Requires 3,000–5,000 liters per kg of rice produced<br>
        • <strong>Growth cycle:</strong> 3–6 months depending on variety<br>
        • <strong>Major producers:</strong> China, India, Indonesia, Bangladesh, Vietnam<br><br>
        <strong>Modern innovation:</strong> SRI (System of Rice Intensification) uses less water, wider spacing, and produces 20–100% more yield! 📈`
      },
      {
        keys: ['wheat','bread','cereal','grain','grains','roti','chapati'],
        answer: `<strong>🌾 Wheat — The World's Most Important Crop:</strong><br><br>
        Wheat feeds <strong>2.5 billion people</strong> globally and is the #1 source of plant-based protein.<br><br>
        • <strong>Temperature:</strong> 12–25°C (cool-season crop)<br>
        • <strong>Soil:</strong> Well-drained loam, pH 6.0–7.0<br>
        • <strong>Growth cycle:</strong> 100–130 days<br>
        • <strong>Types:</strong> Hard (bread), Soft (cakes/pastries), Durum (pasta)<br>
        • <strong>Major producers:</strong> China, India, Russia, USA, France<br><br>
        <strong>Fun fact:</strong> One bushel of wheat makes about 42 loaves of bread! 🍞`
      },
      // ===== FARMING TECHNIQUES =====
      {
        keys: ['organic','organic farming','chemical free','natural farming','zero budget'],
        answer: `<strong>🌿 Organic Farming:</strong><br><br>
        Farming without synthetic chemicals — relies on natural processes and inputs.<br><br>
        <strong>Core principles:</strong><br>
        • No synthetic pesticides or fertilizers<br>
        • No GMOs<br>
        • Crop rotation & companion planting<br>
        • Composting & green manures for fertility<br>
        • Biological pest control<br><br>
        <strong>Certifications:</strong> USDA Organic, EU Organic, India Organic (Jaivik Bharat)<br>
        <strong>Market:</strong> Global organic food market is worth <strong>$200+ billion</strong> and growing 10% annually!<br>
        <strong>Zero Budget Natural Farming (ZBNF)</strong> in India uses cow dung-based preparations and zero external inputs. 🐄`
      },
      {
        keys: ['greenhouse','polyhouse','protected','controlled environment','glasshouse'],
        answer: `<strong>🏡 Greenhouse / Polyhouse Farming:</strong><br><br>
        Growing crops in enclosed structures with controlled climate conditions.<br><br>
        <strong>Benefits:</strong><br>
        • Protection from extreme weather, pests, and diseases<br>
        • Temperature & humidity control<br>
        • Extended growing seasons or year-round production<br>
        • 5–10x higher yields per area than open fields<br><br>
        <strong>Types:</strong><br>
        • Fan-and-pad cooled greenhouses<br>
        • Naturally ventilated polyhouses<br>
        • High-tech climate-controlled glass houses<br><br>
        <strong>Common crops:</strong> Tomatoes, cucumbers, peppers, flowers, herbs. The Netherlands grows $10B+ in exports from greenhouse agriculture alone! 🇳🇱`
      },
      {
        keys: ['crop rotation','rotate','rotation','cover crop','green manure','intercropping'],
        answer: `<strong>🔄 Crop Rotation & Smart Planting:</strong><br><br>
        <strong>Crop Rotation:</strong> Growing different crops in sequence on the same field to break pest cycles and balance nutrients.<br>
        Example: Corn → Soybeans → Wheat → Cover crop<br><br>
        <strong>Cover Crops:</strong> Planted between main crops to prevent erosion, fix nitrogen, and improve soil. Examples: Clover, rye, vetch<br><br>
        <strong>Intercropping:</strong> Growing two+ crops simultaneously. The Three Sisters (corn + beans + squash) is a famous Native American technique!<br><br>
        <strong>Companion Planting:</strong> Tomato + basil, carrot + onion, corn + beans. Some plants genuinely help each other grow! 🤝`
      },
      {
        keys: ['precision','smart farming','iot','sensor','drone','technology','agritech','data','ai farming','automation'],
        answer: `<strong>🤖 Precision Agriculture & AgriTech:</strong><br><br>
        Using technology to optimize every aspect of farming:<br><br>
        • <strong>Drones:</strong> Aerial crop monitoring, spraying, mapping<br>
        • <strong>IoT Sensors:</strong> Real-time soil moisture, temperature, nutrient levels<br>
        • <strong>GPS-guided tractors:</strong> Centimeter-level accuracy for planting & spraying<br>
        • <strong>AI/ML:</strong> Predict yields, detect diseases from photos, optimize irrigation<br>
        • <strong>Satellite imagery:</strong> Monitor crop health across thousands of acres<br>
        • <strong>Robotics:</strong> Automated harvesting, weeding, planting<br><br>
        The global AgriTech market is projected to hit <strong>$22 billion by 2025</strong>. The farm of the future runs on data! 📡`
      },
      {
        keys: ['sustainable','sustainability','regenerative','environment','climate','carbon','footprint','eco','green'],
        answer: `<strong>🌍 Sustainable Agriculture:</strong><br><br>
        Farming that meets today's food needs <em>without compromising future generations</em>.<br><br>
        <strong>Key practices:</strong><br>
        • Reduced water usage (drip irrigation, rainwater harvesting)<br>
        • No-till or minimal tillage (preserves soil carbon)<br>
        • Integrated pest management (less chemicals)<br>
        • Renewable energy (solar-powered irrigation, biogas)<br>
        • Reducing food waste (30% of food is wasted globally!)<br><br>
        <strong>Regenerative agriculture</strong> goes further — it actively <em>restores</em> soil health, sequesters carbon, and builds biodiversity. It's not just sustaining, it's healing the land. 🌱`
      },
      {
        keys: ['permaculture','food forest','agroforestry','silvopasture'],
        answer: `<strong>🌳 Permaculture & Agroforestry:</strong><br><br>
        <strong>Permaculture:</strong> Designing agricultural systems that mimic natural ecosystems. Self-sustaining, minimum inputs.<br><br>
        <strong>Agroforestry:</strong> Integrating trees with crops and/or livestock:<br>
        • <strong>Silvopasture:</strong> Trees + grazing animals<br>
        • <strong>Alley cropping:</strong> Rows of trees with crops in between<br>
        • <strong>Food forests:</strong> 7-layer system mimicking a natural forest (canopy → ground cover)<br><br>
        These systems build soil, sequester carbon, increase biodiversity, and can be <strong>more profitable</strong> than monoculture long-term! 🌿`
      },
      // ===== LIVESTOCK =====
      {
        keys: ['livestock','cattle','cow','buffalo','goat','sheep','pig','animal','animal husbandry','dairy','milk','meat','poultry','chicken','duck','turkey','egg','eggs'],
        answer: `<strong>🐄 Livestock & Animal Husbandry:</strong><br><br>
        <strong>Major sectors:</strong><br>
        • <strong>Dairy:</strong> Cattle, buffalo, goats. India is the world's largest milk producer (200+ million tonnes/year)<br>
        • <strong>Poultry:</strong> Chickens, ducks, turkeys. Fastest-growing livestock sector<br>
        • <strong>Meat:</strong> Cattle, pigs, sheep, goats<br>
        • <strong>Small ruminants:</strong> Goats & sheep — ideal for small farmers<br><br>
        <strong>Key considerations:</strong> Proper feed & nutrition, disease prevention (vaccination), clean housing, breeding programs<br><br>
        <strong>Integrated farming</strong> (crops + livestock) is the most sustainable model — animal waste fertilizes crops, crop residues feed animals! ♻️`
      },
      {
        keys: ['beekeeping','apiculture','bee','bees','honey','pollination','pollinator'],
        answer: `<strong>🐝 Beekeeping & Pollination:</strong><br><br>
        Bees are <em>essential</em> — they pollinate <strong>75% of all food crops</strong>!<br><br>
        <strong>Beekeeping basics:</strong><br>
        • A single hive can produce 10–30 kg of honey per year<br>
        • Also produces beeswax, propolis, royal jelly, pollen<br>
        • Start with 2–3 hives minimum<br>
        • Best bees for beginners: Italian honey bees<br><br>
        <strong>Crisis:</strong> Colony Collapse Disorder has killed billions of bees worldwide. Causes include pesticides (neonicotinoids), habitat loss, and parasites (Varroa mite).<br>
        <strong>Help bees:</strong> Plant flowers, avoid pesticides, support local beekeepers! 🌸`
      },
      // ===== MUSHROOMS & SPECIALTY =====
      {
        keys: ['mushroom','mushrooms','fungi','fungiculture','mycelium','shiitake','oyster mushroom'],
        answer: `<strong>🍄 Mushroom Farming:</strong><br><br>
        Mushrooms don't need sunlight or soil — they grow on organic substrates in dark, humid conditions!<br><br>
        <strong>Popular varieties:</strong><br>
        • <strong>Oyster mushrooms:</strong> Easiest to grow, ready in 3–4 weeks<br>
        • <strong>Shiitake:</strong> High value, grows on hardwood logs<br>
        • <strong>Button mushrooms:</strong> Most commercially grown worldwide<br>
        • <strong>Lion's Mane:</strong> Medicinal, promotes nerve growth<br><br>
        <strong>Growing medium:</strong> Straw, sawdust, coffee grounds, cotton waste<br>
        <strong>Conditions:</strong> 20–25°C, 85–95% humidity, fresh air exchange<br>
        Very profitable — can earn <strong>₹1–5 lakh per month</strong> from a small setup! 💰`
      },
      {
        keys: ['microgreen','microgreens','sprout','sprouts'],
        answer: `<strong>🌱 Microgreens & Sprouts:</strong><br><br>
        Microgreens are seedlings harvested at 7–14 days. Tiny but packed with <strong>4–40x more nutrients</strong> than mature plants!<br><br>
        <strong>Popular varieties:</strong> Sunflower, pea shoots, radish, broccoli, mustard, amaranth<br><br>
        <strong>How to grow:</strong><br>
        • Shallow tray + thin layer of soil or coco coir<br>
        • Spread seeds densely, mist daily<br>
        • Harvest when first true leaves appear<br><br>
        <strong>Business potential:</strong> Sells for $30–80/kg at restaurants and farmers markets. Can grow in <strong>any small space</strong> — apartment balcony, kitchen counter! 🏠`
      },
      // ===== WATER & CLIMATE =====
      {
        keys: ['water','water conservation','rainwater','harvesting','drought','water scarcity','water saving'],
        answer: `<strong>💧 Water in Agriculture:</strong><br><br>
        Agriculture uses <strong>70% of global freshwater</strong> — water conservation is critical.<br><br>
        <strong>Water-saving strategies:</strong><br>
        • Drip irrigation (saves 30–70% vs flood irrigation)<br>
        • Mulching (reduces evaporation by 25–50%)<br>
        • Rainwater harvesting (collect & store monsoon water)<br>
        • Deficit irrigation (controlled water stress at non-critical stages)<br>
        • Hydroponics (90% less water than soil farming!)<br><br>
        <strong>1 kg of food requires:</strong><br>
        • Rice: 3,500L | Beef: 15,400L | Wheat: 1,300L | Lettuce: 130L | Tomato: 180L<br>
        Hydroponics dramatically reduces these numbers! 🌊`
      },
      {
        keys: ['climate change','global warming','weather','monsoon','season','temperature change'],
        answer: `<strong>🌡️ Climate Change & Agriculture:</strong><br><br>
        Climate change is the <em>biggest threat</em> to global food security.<br><br>
        <strong>Impacts:</strong><br>
        • Unpredictable monsoons and rainfall patterns<br>
        • More frequent droughts, floods, and heatwaves<br>
        • Shifting growing zones — tropical pests moving to new areas<br>
        • Reduced crop yields (wheat could decline 6% per °C of warming)<br><br>
        <strong>Solutions:</strong><br>
        • Climate-resilient crop varieties<br>
        • Protected cultivation (greenhouses, polyhouses)<br>
        • Controlled environment agriculture (vertical farms, hydroponics)<br>
        • Carbon-sequestering farming practices<br><br>
        Hydroponics and indoor farming are <strong>climate-proof</strong> — no weather dependency! 🛡️`
      },
      // ===== SEED & PROPAGATION =====
      {
        keys: ['seed','seeds','germination','germinate','seedling','propagation','sow','sowing','transplant'],
        answer: `<strong>🌱 Seeds & Germination:</strong><br><br>
        <strong>Germination needs:</strong> Water + warmth + oxygen (most seeds DON'T need light to germinate)<br><br>
        <strong>Steps:</strong><br>
        1. Soak seeds 12–24 hours (optional but speeds things up)<br>
        2. Plant in moist medium at proper depth (rule: 2x seed diameter)<br>
        3. Keep warm (20–28°C for most crops)<br>
        4. Maintain moisture — don't let it dry out!<br><br>
        <strong>Seed types:</strong><br>
        • <strong>Heirloom:</strong> Open-pollinated, true to type, can save seeds<br>
        • <strong>Hybrid (F1):</strong> Cross of two parents, higher yields but can't save seeds reliably<br>
        • <strong>GMO:</strong> Genetically modified for specific traits<br><br>
        <strong>Seed viability:</strong> Most vegetable seeds last 2–5 years if stored cool and dry. 📦`
      },
      {
        keys: ['graft','grafting','cutting','clone','tissue culture','propagate','vegetative'],
        answer: `<strong>✂️ Vegetative Propagation:</strong><br><br>
        Growing new plants <em>without seeds</em> — from parts of an existing plant.<br><br>
        • <strong>Stem cuttings:</strong> Cut a stem, dip in rooting hormone, plant. Works for herbs, roses, many houseplants<br>
        • <strong>Grafting:</strong> Join two plants — rootstock (bottom) + scion (top). Used for fruit trees, tomatoes<br>
        • <strong>Layering:</strong> Bend a branch to soil, it roots while still attached<br>
        • <strong>Division:</strong> Split a mature plant into pieces<br>
        • <strong>Tissue culture:</strong> Lab-based micro-propagation. Produces thousands of identical disease-free plants<br><br>
        Clones are genetically <em>identical</em> to the parent — guaranteed same traits! 🧬`
      },
      // ===== ECONOMICS & MARKET =====
      {
        keys: ['market','price','profit','income','business','sell','selling','money','cost','investment','startup','commercial'],
        answer: `<strong>💰 Agriculture as a Business:</strong><br><br>
        <strong>Most profitable crops per acre:</strong><br>
        • Saffron ($75,000/acre) | Microgreens ($50,000) | Mushrooms ($60,000)<br>
        • Herbs ($40,000) | Lettuce hydroponic ($20,000) | Tomato hydroponic ($15,000)<br><br>
        <strong>Hydroponic startup costs:</strong><br>
        • Small home system: $200–500<br>
        • Small commercial (1000 sq ft): $10,000–30,000<br>
        • Large commercial: $100,000+<br><br>
        <strong>Revenue channels:</strong> Farmers markets, restaurants, grocery stores, CSA boxes, online direct-to-consumer<br>
        <strong>Key:</strong> Start small, learn the craft, then scale. Most hydroponic farms break even in 12–18 months. 📊`
      },
      // ===== FOOD SECURITY =====
      {
        keys: ['food security','hunger','famine','population','world food','feeding','malnutrition','food crisis'],
        answer: `<strong>🌍 Global Food Security:</strong><br><br>
        • <strong>9.7 billion people by 2050</strong> — we need 60% more food<br>
        • <strong>828 million</strong> people currently face hunger<br>
        • <strong>30–40%</strong> of food produced is wasted<br><br>
        <strong>How hydroponics helps:</strong><br>
        • Grow food in cities (urban farms = less transportation)<br>
        • Produce food in deserts, Arctic, and space<br>
        • Year-round production regardless of weather<br>
        • 10–20x more food per square meter<br><br>
        The combination of <strong>vertical farming + hydroponics + renewable energy</strong> could feed the world sustainably. That's why this technology matters! 🚀`
      },
      // ===== FARMSPHERICA =====
      {
        keys: ['farmspherica','hydrosync','about','website','who made','creator','sharan'],
        answer: `<strong>🌐 FarmSpherica</strong> is this very website you're exploring right now! Created by <strong>Sharan Tilak</strong> for The Founder's Web Hackathon.<br><br>
        <strong>Mission:</strong> To educate and inspire people about <em>hydroponics</em> and how it will revolutionize the world of agriculture.<br><br>
        The site covers:<br>
        • What hydroponics is and why it matters<br>
        • Key statistics and comparisons vs traditional farming<br>
        • Different hydroponic methods and systems<br>
        • The environmental benefits of soilless agriculture<br><br>
        And yes, you're talking to <strong>HydroSync AI</strong> — the site's built-in agriculture assistant! Feel free to ask me anything about farming! 🤖🌱`
      },
      // ===== GENERAL GREETINGS =====
      {
        keys: ['hello','hi','hey','greetings','sup','yo','what\'s up','howdy','good morning','good evening','good afternoon'],
        answer: `<strong>👋 Hey there!</strong> I'm <strong>HydroSync AI</strong>, your agriculture assistant!<br><br>
        I can answer questions about:<br>
        • 🌿 Hydroponics & soilless farming<br>
        • 🌾 Traditional agriculture & soil science<br>
        • 💧 Irrigation & water management<br>
        • 🐛 Pests, diseases & crop protection<br>
        • 🍅 Growing specific crops (tomatoes, lettuce, herbs, etc.)<br>
        • 🐄 Livestock & animal husbandry<br>
        • 🤖 AgriTech & precision farming<br>
        • 💰 Farming as a business<br><br>
        Go ahead, ask me anything about farming! 🌱`
      },
      {
        keys: ['thank','thanks','thx','ty','appreciate'],
        answer: `<strong>😊 You're welcome!</strong> Happy to help with your agriculture questions anytime. Keep growing, keep learning! 🌱<br><br>Got more questions? Fire away!`
      },
      {
        keys: ['help','what can you do','capabilities','how do you work','what do you know'],
        answer: `<strong>🤖 I'm HydroSync AI</strong> — a built-in agriculture knowledge assistant!<br><br>
        <strong>Try asking me about:</strong><br>
        • "What is hydroponics?"<br>
        • "How does NFT work?"<br>
        • "Best crops for vertical farming?"<br>
        • "How to control aphids organically?"<br>
        • "Drip irrigation vs sprinkler"<br>
        • "Is organic farming profitable?"<br>
        • "How to grow tomatoes hydroponically?"<br>
        • "What is aquaponics?"<br><br>
        I cover the <strong>entire agriculture sector</strong> — from soil to soilless, crops to livestock, traditional to futuristic! 🚜`
      },
      // ===== ADDITIONAL TOPICS =====
      {
        keys: ['mulch','mulching'],
        answer: `<strong>🍂 Mulching:</strong><br><br>
        A layer of material spread over soil to conserve moisture, suppress weeds, and regulate temperature.<br><br>
        <strong>Types:</strong><br>
        • <strong>Organic:</strong> Straw, wood chips, leaves, compost (breaks down and feeds soil)<br>
        • <strong>Inorganic:</strong> Plastic film, gravel, landscape fabric<br><br>
        <strong>Benefits:</strong> Reduces watering by 25–50%, prevents soil erosion, and suppresses weeds naturally.<br>
        Apply 5–10 cm thick. Keep mulch a few inches away from plant stems to prevent rot. 🌿`
      },
      {
        keys: ['tillage','no-till','plow','plough','tilling'],
        answer: `<strong>🚜 Tillage vs No-Till:</strong><br><br>
        <strong>Conventional tillage:</strong> Plowing/turning soil before planting. Loosens soil, buries weeds, incorporates amendments.<br>
        ⚠️ But damages soil structure, kills earthworms, releases stored carbon.<br><br>
        <strong>No-till farming:</strong> Seeds planted directly into undisturbed soil through crop residue.<br>
        ✅ Preserves soil biology, reduces erosion by 90%, sequesters carbon, saves fuel<br><br>
        <strong>Fun fact:</strong> 1 teaspoon of healthy no-till soil contains more microorganisms than there are people on Earth! 🌍`
      },
      {
        keys: ['spice','spices','saffron','vanilla','cinnamon','turmeric','ginger','chili','pepper','cardamom'],
        answer: `<strong>🌶️ Spice Farming:</strong><br><br>
        • <strong>Saffron:</strong> World's most expensive spice ($5,000–10,000/kg!). Grown in Iran, India (Kashmir), Spain<br>
        • <strong>Vanilla:</strong> Second most expensive. Hand-pollinated! Madagascar produces 80%<br>
        • <strong>Turmeric:</strong> India produces 80% globally. Called "golden spice" for health benefits<br>
        • <strong>Black pepper:</strong> "King of spices." India, Vietnam, Indonesia<br>
        • <strong>Cardamom:</strong> "Queen of spices." Guatemala is the largest producer<br><br>
        Spice farming can be incredibly lucrative for small-scale farmers. Many spices also grow well in controlled environments! 💰`
      },
      {
        keys: ['algae','seaweed','spirulina'],
        answer: `<strong>🌊 Algae & Seaweed Farming:</strong><br><br>
        Algae is the <em>fastest-growing organism on Earth</em> and could be a future superfood.<br><br>
        • <strong>Spirulina:</strong> 60–70% protein! Used as a supplement. Grows in alkaline water<br>
        • <strong>Chlorella:</strong> Rich in vitamins, minerals, and chlorophyll<br>
        • <strong>Seaweed:</strong> Used for food, fertilizer, cosmetics, biofuel<br><br>
        <strong>Benefits:</strong> No arable land needed, absorbs CO₂, minimal freshwater use, grows extremely fast<br>
        <strong>Applications:</strong> Food, animal feed, bioplastics, biofuels, fertilizer<br><br>
        Some scientists call algae farming "the agriculture of the future." 🔬`
      },
      {
        keys: ['biogas','renewable','solar','energy','power','electricity'],
        answer: `<strong>⚡ Renewable Energy in Agriculture:</strong><br><br>
        • <strong>Solar-powered irrigation:</strong> Solar panels run water pumps — free energy after installation!<br>
        • <strong>Biogas:</strong> Convert animal waste & crop residues into methane gas for cooking/electricity. 1 cow's waste = enough biogas for 3 hours of cooking daily<br>
        • <strong>Agrivoltaics:</strong> Solar panels ABOVE crops — the panels provide shade, crops get grown underneath. Win-win!<br>
        • <strong>Wind energy:</strong> Farms often have great wind exposure<br><br>
        A <strong>self-sufficient farm</strong> using renewable energy, water recycling, and closed-loop nutrients is the ultimate goal of sustainable agriculture! 🌞`
      },
      {
        keys: ['gmo','genetically modified','genetic','biotechnology','biotech','crispr','gene editing'],
        answer: `<strong>🧬 GMOs & Agricultural Biotechnology:</strong><br><br>
        <strong>GMO (Genetically Modified Organism):</strong> Organisms with DNA altered using genetic engineering.<br><br>
        <strong>Common GMO crops:</strong> Bt cotton (pest-resistant), Roundup Ready soybeans (herbicide-tolerant), Golden Rice (vitamin A enriched)<br><br>
        <strong>CRISPR gene editing:</strong> Newer, more precise technology. Can create drought-tolerant, disease-resistant, or more nutritious varieties WITHOUT inserting foreign DNA.<br><br>
        <strong>The debate:</strong><br>
        ✅ Pro: Higher yields, less pesticide use, more nutrition<br>
        ⚠️ Con: Corporate control of seeds, ecological concerns, consumer hesitancy<br><br>
        Scientific consensus: Currently approved GMOs are safe to eat. The debate is more ethical and economic than health-related. 🔬`
      }
    ];

    // ── Smart Stemming and Text Normalization ──
    function normalizeText(text) {
      let cleaned = text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
        .replace(/\s+/g, ' ')        // collapse whitespace
        .trim();

      // Simple plural-to-singular stemmer rules
      const words = cleaned.split(' ').map(word => {
        if (word.length <= 2) return word;
        if (word.endsWith('ies')) return word.slice(0, -3) + 'y'; // e.g. berries -> berry
        if (word.endsWith('es') && !word.endsWith('ees') && !word.endsWith('o-es')) return word.slice(0, -2); // e.g. boxes -> box
        if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) return word.slice(0, -1); // e.g. crops -> crop
        return word;
      });

      return words.join(' ');
    }

    // ── Agriculture topic detection ──
    function isAgriRelated(text) {
      const normalized = normalizeText(text);
      const words = normalized.split(/\s+/);
      
      // Check if any agriculture keyword appears in the query
      for (const word of words) {
        for (const keyword of AGRI_KEYWORDS) {
          if (word === keyword || word.includes(keyword) || keyword.includes(word)) {
            return true;
          }
        }
      }
      
      // Also check multi-word phrases
      const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
      for (const keyword of AGRI_KEYWORDS) {
        if (lower.includes(keyword)) {
          return true;
        }
      }
      
      // Allow greetings and meta questions
      const metaKeys = ['hello','hi','hey','sup','yo','help','thanks','thank','what','how','why','who','when','where','can you','tell me','explain','define','greetings','good morning','good evening','good afternoon','howdy','thx','ty','appreciate','what\'s up'];
      for (const mk of metaKeys) {
        if (lower.includes(mk)) return true;
      }
      
      return false;
    }

    // ── Find best matching answer ──
    function findAnswer(query) {
      const normalizedQuery = normalizeText(query);
      const queryWords = normalizedQuery.split(' ');
      
      // Stopwords to ignore in word-by-word matching
      const stopwords = new Set([
        'what', 'is', 'how', 'do', 'you', 'explain', 'define', 'the', 'about', 
        'can', 'please', 'tell', 'me', 'on', 'a', 'an', 'some', 'why', 'where', 
        'who', 'to', 'for', 'with', 'in', 'of', 'at', 'by', 'from', 'get', 'give'
      ]);

      let bestMatch = null;
      let bestScore = 0;
      
      for (const entry of knowledgeBase) {
        let score = 0;
        
        for (const key of entry.keys) {
          const normalizedKey = normalizeText(key);
          
          if (normalizedQuery === normalizedKey) {
            score += 150; // Exact match of query to key
          } else if (normalizedQuery.includes(normalizedKey)) {
            score += 50 + normalizedKey.length * 2; // Key is a full phrase in the query
          } else if (normalizedKey.includes(normalizedQuery)) {
            score += 30 + normalizedQuery.length; // Query is a sub-phrase of key
          } else {
            // Word intersection score
            const keyWords = normalizedKey.split(' ');
            for (const kw of keyWords) {
              if (stopwords.has(kw)) continue;
              if (queryWords.includes(kw)) {
                score += kw.length * 4; // Longer matched words get higher weight
              }
            }
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }
      
      // Match needs to hit a basic confidence threshold
      return bestScore >= 6 ? bestMatch : null;
    }

    // Store recent answers to guarantee non-identity on consecutive asks
    const recentAnswers = [];

    // ── Dynamic Response Variation Generator ──
    function generateDynamicResponse(match, query) {
      const baseText = match.answer;
      
      // Determine topic name
      let topic = match.keys[0];
      topic = topic.charAt(0).toUpperCase() + topic.slice(1);

      // Intro variations
      const intros = [
        `Yo! Let's talk about <strong>${topic}</strong>. Here's the lowdown, bro:`,
        `Oh, <strong>${topic}</strong>? That's a total game-changer. Let me break it down for you real quick:`,
        `Nice choice! <strong>${topic}</strong> is super key in modern farming. Check this out:`,
        `Sure thing, mate! Here is everything you need to know about <strong>${topic}</strong>:`,
        `Aha! You're curious about <strong>${topic}</strong>. Honestly, it's one of the coolest parts of agriculture:`,
        `Let's dive into <strong>${topic}</strong>, friend. Here's the real story:`,
        `That's a classic question. Here is the quick, no-nonsense breakdown on <strong>${topic}</strong>:`,
        `Oh, absolutely! <strong>${topic}</strong> is fascinating. Here is a neat breakdown of how it works:`
      ];

      // Conclusion / farming tips and facts variations
      const tips = [
        `🌱 <strong>Quick farming tip:</strong> Make sure your water temperature is around 18–22°C (65–72°F). If it gets too hot, plants can't hold oxygen properly and their roots suffer!`,
        `💡 <strong>Fun fact, bro:</strong> The Aztecs actually did hydroponics first! They built floating gardens called 'Chinampas' on lakes. Pretty genius, right?`,
        `🌱 <strong>Farmer's Tip:</strong> Wash out your water reservoir every 2 to 3 weeks. You really don't want algae taking over your root zone!`,
        `💡 <strong>Mind-blowing fact:</strong> Hydroponic plants grow up to 50% faster than soil plants because their nutrients are delivered straight to their roots. No digging required!`,
        `🌱 <strong>Pro Tip:</strong> Got yellow leaves with green veins? That's probably a Magnesium deficiency. Try dissolving a tiny bit of Epsom salt in your reservoir!`,
        `💡 <strong>Check this out:</strong> Ladybugs are basically organic hitmen. One ladybug can eat up to 5,000 aphids. Keep them around!`,
        `🌱 <strong>Pro Tip:</strong> Healthy roots should look bright white and smell clean. If they look brown or slimy, you've got root rot, bro. Treat it immediately!`,
        `💡 <strong>Did you know?</strong> NASA is actively researching aeroponics to grow fresh vegetables for future Mars missions! 🚀`,
        `🌱 <strong>Farmer's Tip:</strong> Always calibrate your pH meter weekly. A tiny drift in calibration can make you lock out nutrients without realizing it.`,
        `💡 <strong>Did you know?</strong> Drip irrigation is up to 95% water-efficient, compared to only 40% for traditional flood irrigation. Save that water!`,
        `🌱 <strong>Pro Tip:</strong> Tomatoes are super heavy calcium feeders. Add a Cal-Mag supplement to prevent Blossom End Rot (where the bottom turns black).`,
        `💡 <strong>Quick fact:</strong> Mint is a very aggressive grower. Seriously, grow it in a separate channel or it'll take over the whole system!`,
        `🌱 <strong>Pro Tip:</strong> Organic neem oil is a great natural pesticide. Apply it at dusk so the leaves don't burn under your grow lights.`,
        `💡 <strong>Did you know?</strong> Saffron is the most expensive spice in the world, costing up to $10,000 per kilogram!`,
        `💡 <strong>Did you know?</strong> LED grow lights use up to 70% less energy than old-school bulbs, and you can tune the spectrum for growth vs. bloom!`
      ];

      let finalResponse = '';
      for (let attempt = 0; attempt < 5; attempt++) {
        let text = baseText;

        // Synonym replacements (probabilistic)
        const substitutions = [
          { regex: /without soil/gi, options: ['without soil', 'in a soilless environment', 'without using any soil'] },
          { regex: /traditional farming/gi, options: ['conventional agriculture', 'traditional soil farming', 'soil-based farming'] },
          { regex: /Key advantages:/gi, options: ['Main benefits:', 'Core advantages:', 'Key strengths:', 'Why it works:'] },
          { regex: /How it works:/gi, options: ['The mechanism:', 'How it operates:', 'Operational steps:', 'How it works:'] },
          { regex: /Watch out:/gi, options: ['Key challenges:', 'Common pitfalls:', 'Things to watch out for:', 'Important warnings:'] },
          { regex: /Best for:/gi, options: ['Ideally suited for:', 'Recommended for:', 'Perfect for:', 'Best crops:'] },
          { regex: /future of food production/gi, options: ['future of farming', 'next generation of sustainable agriculture', 'future of food production'] },
          { regex: /beginner-friendly/gi, options: ['perfect for beginners', 'great for novices', 'easy to start with', 'highly beginner-friendly'] },
          { regex: /commercial/gi, options: ['large-scale', 'professional', 'commercial'] }
        ];

        substitutions.forEach(({ regex, options }) => {
          if (Math.random() > 0.35) { // 65% chance to swap
            text = text.replace(regex, () => options[Math.floor(Math.random() * options.length)]);
          }
        });

        // Randomize bullet point icons
        const bulletIcons = ['•', '🔹', '🟢', '✔️', '🔸', '▫️'];
        const chosenBullet = bulletIcons[Math.floor(Math.random() * bulletIcons.length)];
        text = text.replace(/•/g, chosenBullet);

        // Pick random intro and outro
        const intro = intros[Math.floor(Math.random() * intros.length)];
        const tip = tips[Math.floor(Math.random() * tips.length)];

        finalResponse = `${intro}<br><br>${text}<br><br>${tip}`;

        if (!recentAnswers.includes(finalResponse)) {
          break;
        }
      }

      recentAnswers.push(finalResponse);
      if (recentAnswers.length > 15) {
        recentAnswers.shift();
      }

      return finalResponse;
    }

    // ── Generate fully randomized fallback responses ──
    function generateDynamicFallback() {
      const greetings = [
        "Hmm, good question!",
        "Ah, that's a unique query, bro!",
        "Let me help you out with that one!",
        "Nice topic!",
        "Good point, mate!"
      ];
      
      const statements = [
        "I don't have a direct database match for that exact question, but here is some general farming wisdom:",
        "That's a bit beyond my immediate database, but here's a general agriculture tip:",
        "While I don't have a specific guide for that in my memory bank, let's look at the basic principles:"
      ];
      
      const coreTips = [
        "the absolute key fundamentals are always water purity, nutrient quality, correct pH levels, and adequate lighting.",
        "successful plant growth depends on root oxygenation, correct watering schedules, and keeping pests away.",
        "every crop needs a proper balance of NPK nutrients, healthy roots, and protection from fungal blights."
      ];
      
      const outros = [
        "Try rephrasing your question to ask about specific systems like NFT or DWC, or crops like tomatoes and lettuce! 🌱",
        "You can ask me about topics like composting, organic pest control, pH levels, or crop rotation! 💡",
        "Check out our comparison table or ask me how hydroponics differs from soil farming! 🚀"
      ];

      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      const statement = statements[Math.floor(Math.random() * statements.length)];
      const coreTip = coreTips[Math.floor(Math.random() * coreTips.length)];
      const outro = outros[Math.floor(Math.random() * outros.length)];

      return `<strong>${greeting}</strong> ${statement}<br><br>Whether you grow in soil or hydroponically, ${coreTip}<br><br>${outro}`;
    }

    const addMessage = (text, sender) => {
      const msg = document.createElement('div');
      msg.classList.add('ai-msg', sender);
      msg.innerHTML = text;
      chatBody.appendChild(msg);
      chatBody.scrollTop = chatBody.scrollHeight;
    };

    const showTyping = () => {
      const msg = document.createElement('div');
      msg.classList.add('ai-msg', 'ai', 'typing-indicator-msg');
      msg.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
      chatBody.appendChild(msg);
      chatBody.scrollTop = chatBody.scrollHeight;
      return msg;
    };

    const handleChat = () => {
      const query = chatInput.value.trim();
      if (!query) return;

      addMessage(query, 'user');
      chatInput.value = '';

      const typing = showTyping();

      // Simulate a short "thinking" delay for realism
      setTimeout(() => {
        typing.remove();

        // Check if it's agriculture-related
        if (!isAgriRelated(query)) {
          addMessage(`<strong>🚫 Stick to the topic, Bro!</strong><br><br>I'm <strong>HydroSync AI</strong> — I only talk about agriculture, farming, hydroponics, crops, livestock, and everything green. 🌿<br><br>Try asking me something like:<br>• "What is hydroponics?"<br>• "How to grow tomatoes?"<br>• "Best irrigation method?"`, 'ai');
          return;
        }

        const match = findAnswer(query);

        if (match) {
          addMessage(generateDynamicResponse(match, query), 'ai');
        } else {
          addMessage(generateDynamicFallback(), 'ai');
        }
      }, 600 + Math.random() * 800); // 600–1400ms delay for natural feel
    };

    chatBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleChat();
    });
  }

  // ================================================================
  // FLOATING LEAF PARTICLES SYSTEM
  // ================================================================
  function initLeafParticles() {
    const leafEmojis = ['🥬', '🌿', '🍀', '🍃', '🌱', '🥦'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden;';
    document.body.appendChild(container);

    const maxLeaves = 15;
    for (let i = 0; i < maxLeaves; i++) {
      const leaf = document.createElement('div');
      leaf.classList.add('leaf-particle');
      leaf.innerText = leafEmojis[Math.floor(Math.random() * leafEmojis.length)];
      
      // Random positions
      leaf.style.left = Math.random() * 100 + 'vw';
      leaf.style.top = Math.random() * 100 + 'vh';
      leaf.style.fontSize = (12 + Math.random() * 16) + 'px';
      
      // Random animation delay and duration
      leaf.style.animationDelay = (Math.random() * -15) + 's';
      leaf.style.animationDuration = (12 + Math.random() * 10) + 's';
      
      container.appendChild(leaf);
    }
  }
  
  initLeafParticles();

  // ================================================================
  // INSANE 3D HOVER ANIMATIONS FOR CARDS
  // ================================================================
  function init3DCards() {
    const cards = document.querySelectorAll('.benefit-card, .stat-card, .compare-card');
    
    cards.forEach(card => {
      // Apply a base transition for smooth tracking
      card.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease';

      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -8; // Max rotation 8deg
        const rotateY = ((x - centerX) / centerX) * 8;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
      });
      
      card.addEventListener('mouseenter', e => {
        if (window.spawnBurst) {
          const rect = card.getBoundingClientRect();
          window.spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.6s var(--ease-spring), box-shadow 0.6s ease';
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        
        // Reset to fast tracking after it settles
        setTimeout(() => {
          card.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease';
        }, 600);
      });
    });
  }

  init3DCards();

  // ================================================================
  // CINEMATIC EFFECTS (FLASHLIGHT & PARALLAX)
  // ================================================================
  function initCinematicEffects() {
    const flashlight = document.getElementById('flashlight');
    const heroInner = document.querySelector('.hero-inner');

    // Global flashlight tracking
    if (flashlight) {
      document.addEventListener('mousemove', (e) => {
        flashlight.style.setProperty('--mouse-x', `${e.clientX}px`);
        flashlight.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    }

    // Hero Parallax Scroll
    if (heroInner) {
      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        // Parallax effect: moves down half as fast as the scroll
        heroInner.style.transform = `translateY(${scrolled * 0.4}px)`;
      });
    }
  }

  initCinematicEffects();

  // ================================================================
  // EPIC BATTLE TABLE — Score Ticker + Victory Bar
  // ================================================================
  function initBattleTable() {
    const hydroScoreEl = document.getElementById('hydroScore');
    const tradScoreEl  = document.getElementById('tradScore');
    const victoryBanner = document.getElementById('victoryBanner');
    const victoryFill   = document.getElementById('victoryFill');
    const rows = document.querySelectorAll('.comparison-table tbody tr');

    if (!hydroScoreEl || !rows.length) return;

    let battleStarted = false;

    const battleObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !battleStarted) {
          battleStarted = true;
          startBattle();
        }
      });
    }, { threshold: 0.3 });

    const tableWrapper = document.querySelector('.comparison-table-wrapper');
    if (tableWrapper) battleObserver.observe(tableWrapper);

    function startBattle() {
      let hydroCount = 0;
      const totalRows = rows.length;

      rows.forEach((row, i) => {
        setTimeout(() => {
          // Row slam-in animation
          row.style.opacity = '1';
          row.style.transform = 'translateY(0) scale(1)';

          // Count up the hydro score
          hydroCount++;
          animateNumber(hydroScoreEl, 0, hydroCount, 300);
          animateNumber(tradScoreEl,  0, 0,          300); // always 0

          // When last row reveals, show victory banner
          if (i === totalRows - 1) {
            setTimeout(() => {
              if (victoryBanner) victoryBanner.classList.add('visible');
              if (victoryFill)   victoryFill.style.width = '100%';
            }, 400);
          }
        }, i * 160);
      });
    }

    function animateNumber(el, from, to, duration) {
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(from + (to - from) * p);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  initBattleTable();

  // ================================================================
  // INTERACTIVE GROW LAB LOGIC
  // ================================================================
  function initGrowLab() {
    const sLight = $('#sliderLight');
    const sNutrient = $('#sliderNutrient');
    const sPh = $('#sliderPh');
    
    if (!sLight || !sNutrient || !sPh) return;

    const vLight = $('#valLight');
    const vNutrient = $('#valNutrient');
    const vPh = $('#valPh');
    
    const holoPlant = $('#holoPlant');
    const holoGlow = $('#holoGlow');
    const labStatus = $('#labStatus');
    const metricYield = $('#metricYield');
    const metricGrowth = $('#metricGrowth');
    const metricHealth = $('#metricHealth');
    
    const barYield = $('#barYield');
    const barGrowth = $('#barGrowth');
    const barHealth = $('#barHealth');
    
    const leavesLeft = $$('.leaf-left');
    const leavesRight = $$('.leaf-right');

    const OPTIMAL = { light: 85, nutrient: 60, ph: 62 };

    function updateLab() {
      const light = parseInt(sLight.value);
      const nutrient = parseInt(sNutrient.value);
      const ph = parseInt(sPh.value);

      vLight.textContent = light + '%';
      vNutrient.textContent = nutrient + ' mg/L';
      vPh.textContent = (ph / 10).toFixed(1);

      // Calculate deviations (0 = perfect, higher = worse)
      const devLight = Math.abs(light - OPTIMAL.light) / 100;
      const devNutrient = Math.abs(nutrient - OPTIMAL.nutrient) / 100;
      const devPh = Math.abs(ph - OPTIMAL.ph) / 45;

      const totalDeviation = devLight + devNutrient + devPh;
      
      // Health Score (0 to 1)
      let health = 1 - (totalDeviation * 1.5);
      health = Math.max(0.1, Math.min(1, health));

      // Visual Updates
      // Plant Height (Max 150px)
      const height = 40 + (health * 110);
      holoPlant.style.height = height + 'px';

      // Colors based on health
      let color = '#00ff88'; // Optimal Green
      let statusText = 'SYSTEM OPTIMAL';
      
      if (health < 0.4) {
        color = '#ff3366'; // Danger Red
        statusText = 'CRITICAL WARNING';
      } else if (health < 0.7) {
        color = '#ffcc00'; // Warning Yellow
        statusText = 'SUB-OPTIMAL YIELD';
      }

      holoPlant.style.background = color;
      holoPlant.style.boxShadow = `0 0 ${10 + health*20}px ${color}`;
      holoGlow.style.background = `linear-gradient(to top, ${color}88, transparent)`;
      
      labStatus.textContent = statusText;
      labStatus.style.color = color;
      labStatus.style.borderColor = color;
      labStatus.style.backgroundColor = `${color}11`;

      // Update Leaves
      leavesLeft.forEach(leaf => {
        leaf.style.background = `${color}44`;
        leaf.style.borderColor = color;
        leaf.style.boxShadow = `0 0 10px ${color}`;
        // Wilt if unhealthy
        const wilt = (1 - health) * 60; // Up to 60deg droop
        leaf.style.transform = `rotate(${-30 + wilt}deg) scale(${health})`;
      });

      leavesRight.forEach(leaf => {
        leaf.style.background = `${color}44`;
        leaf.style.borderColor = color;
        leaf.style.boxShadow = `0 0 10px ${color}`;
        // Wilt if unhealthy
        const wilt = (1 - health) * 60; 
        leaf.style.transform = `rotate(${30 - wilt}deg) scale(${health})`;
      });

      // Update Metrics
      const yieldVal = Math.round(health * 150);
      const growthVal = (health * 3.5).toFixed(1);
      const healthPct = Math.round(health * 100);

      metricYield.textContent = yieldVal + ' lbs';
      metricGrowth.textContent = growthVal + 'x';
      metricHealth.textContent = healthPct + '%';
      
      metricYield.style.color = color;
      metricGrowth.style.color = color;
      metricHealth.style.color = color;

      barYield.style.width = (yieldVal / 150 * 100) + '%';
      barGrowth.style.width = (growthVal / 3.5 * 100) + '%';
      barHealth.style.width = healthPct + '%';
      
      barYield.style.background = color;
      barGrowth.style.background = color;
      barHealth.style.background = color;
      barYield.style.boxShadow = `0 0 10px ${color}`;
      barGrowth.style.boxShadow = `0 0 10px ${color}`;
      barHealth.style.boxShadow = `0 0 10px ${color}`;
    }

    [sLight, sNutrient, sPh].forEach(slider => {
      slider.addEventListener('input', updateLab);
    });

    updateLab(); // Initial call
  }

  initGrowLab();

})();
