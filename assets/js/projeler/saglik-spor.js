// Sağlık Spor — açılış, Lenis kaydırma, hero slaytları, kayan bant,
// üyelik sekmeleri, açık/kapalı durumu ve kaydırma animasyonları.
// GSAP yüklenemezse ya da kullanıcı azaltılmış hareket isterse sayfa
// animasyonsuz ama eksiksiz çalışır.
(function () {
  'use strict';

  const root = document.documentElement;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );

  root.classList.add('is-js');
  if (hasGsap) {
    root.classList.add('has-gsap');
    gsap.registerPlugin(ScrollTrigger);
  }

  // --- LENIS (yumuşak kaydırma) ---
  let lenis = null;
  if (hasGsap && !REDUCED && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // --- METİN BÖLME ---
  function splitWords(el) {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', text);
    el.innerHTML = text
      .split(' ')
      .map((w) => `<span class="w" aria-hidden="true"><span>${esc(w)}</span></span>`)
      .join(' ');
    return $$('.w > span', el);
  }
  function splitChars(el) {
    el.innerHTML = Array.from(el.textContent.trim())
      .map((c) => `<span class="ch">${esc(c)}</span>`)
      .join('');
    return $$('.ch', el);
  }

  // --- MOBİL MENÜ ---
  let closeMenu = () => {};
  (function menu() {
    const btn = $('[data-menu-toggle]');
    if (!btn) return;
    const set = (open) => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    btn.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') set(false);
    });
    closeMenu = () => set(false);
  })();

  // --- SAYFA İÇİ BAĞLANTILAR ---
  $$('a[href^="#"]:not(.skip)').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') {
        e.preventDefault();
        return;
      }
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { duration: 1.5 });
      else target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
    });
  });

  // --- AÇIK / KAPALI (footer'daki saatlerden okunur) ---
  (function status() {
    const rows = $$('.hours-list li[data-days]');
    if (!rows.length) return;
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const toMin = (s) => {
      const [h, m] = s.split(':').map(Number);
      return h * 60 + m;
    };
    let open = false;
    rows.forEach((li) => {
      const [a, b = a] = li.dataset.days.split('-').map(Number);
      const today = day >= a && day <= b;
      li.classList.toggle('is-today', today);
      if (today && li.dataset.open) {
        open = mins >= toMin(li.dataset.open) && mins < toMin(li.dataset.close);
      }
    });
    const el = $('[data-status]');
    if (el) {
      el.textContent = open ? 'ŞU AN AÇIK' : 'ŞU AN KAPALI';
      el.classList.toggle('is-open', open);
      el.hidden = false;
    }
  })();

  // --- ÜYELİK SEKMELERİ (WAI-ARIA tabs) ---
  (function tabs() {
    const list = $('.tabs');
    if (!list) return;
    const btns = $$('.tab-btn', list);
    const ind = $('.tabs__ind', list);
    let tl = null;

    const place = (btn, instant) => {
      if (!ind || !btn) return;
      if (instant) ind.style.transition = 'none';
      ind.style.width = btn.offsetWidth + 'px';
      ind.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
      if (instant) {
        void ind.offsetWidth;
        ind.style.transition = '';
      }
    };
    const activeBtn = () => btns.find((b) => b.classList.contains('is-active'));

    const activate = (btn, focus) => {
      if (tl) tl.progress(1).kill();
      const from = $('.tab-content.is-active');
      const to = document.getElementById(btn.dataset.tab);
      btns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      if (focus) btn.focus();
      place(btn);
      if (!to || from === to) return;

      if (!hasGsap || REDUCED) {
        from.classList.remove('is-active');
        to.classList.add('is-active');
        if (hasGsap) ScrollTrigger.refresh();
        return;
      }
      tl = gsap
        .timeline()
        .to(from.children, {
          y: -26,
          autoAlpha: 0,
          duration: 0.28,
          stagger: 0.035,
          ease: 'power2.in',
        })
        .add(() => {
          from.classList.remove('is-active');
          gsap.set(from.children, { clearProps: 'transform,opacity,visibility' });
          to.classList.add('is-active');
          ScrollTrigger.refresh();
        })
        .fromTo(
          to.children,
          { y: 60, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.95,
            stagger: 0.07,
            ease: 'expo.out',
            clearProps: 'transform,opacity,visibility',
          },
        );
    };

    btns.forEach((btn) => btn.addEventListener('click', () => activate(btn, false)));
    list.addEventListener('keydown', (e) => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % btns.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + btns.length) % btns.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = btns.length - 1;
      if (n === null) return;
      e.preventDefault();
      activate(btns[n], true);
    });

    place(activeBtn(), true);
    window.addEventListener('resize', () => place(activeBtn(), true));
    if (document.fonts) document.fonts.ready.then(() => place(activeBtn(), true));
  })();

  // --- HERO SLAYTLARI ---
  function startSlides() {
    const slides = $$('.slide');
    const cur = $('[data-slide-current]');
    const total = $('[data-slide-total]');
    const bar = $('[data-slide-progress]');
    if (slides.length < 2) return;
    if (total) total.textContent = pad(slides.length);
    let i = 0;
    const DUR = 6;
    const show = (n) => {
      slides[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      if (cur) cur.textContent = pad(i + 1);
    };
    if (!hasGsap || !bar) {
      setInterval(() => show(i + 1), DUR * 1000);
      return;
    }
    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      { scaleX: 1, duration: DUR, ease: 'none', repeat: -1, onRepeat: () => show(i + 1) },
    );
    // hero görünmüyorken saat durur
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
    });
  }

  // --- KAYAN BANT (kaydırma hızına ve yönüne tepki verir) ---
  function marquees() {
    if (REDUCED) return;
    const tweens = $$('[data-marquee]').map((track) => {
      const dir = Number(track.dataset.marquee) < 0 ? -1 : 1;
      const tw = gsap.fromTo(
        track,
        { xPercent: dir > 0 ? 0 : -50 },
        { xPercent: dir > 0 ? -50 : 0, duration: 70, ease: 'none', repeat: -1 },
      );
      tw.totalTime(tw.duration() * 400); // geriye de sonsuz akabilsin
      return tw;
    });
    let boost = null;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate(self) {
        const dir = self.direction;
        const speed = 1 + Math.min(Math.abs(self.getVelocity()) / 180, 9);
        if (boost) boost.kill();
        boost = gsap
          .timeline()
          .to(tweens, { timeScale: speed * dir, duration: 0.2, ease: 'power1.out' })
          .to(tweens, { timeScale: dir, duration: 1.4, ease: 'power2.out' });
      },
    });
  }

  // --- KAYDIRMA ANİMASYONLARI ---
  function scrollFx() {
    if (REDUCED) return;

    // hero: arka plan yavaş, başlık hızlı kayar
    gsap.to('[data-hero-slides]', {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__title', {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    $$('[data-reveal-words]').forEach((el) => {
      gsap.from(splitWords(el), {
        yPercent: 115,
        duration: 1.25,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      });
    });

    $$('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 44,
        autoAlpha: 0,
        duration: 1.15,
        ease: 'expo.out',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    gsap.from('#standart .price-card', {
      y: 80,
      autoAlpha: 0,
      duration: 1.15,
      stagger: 0.08,
      ease: 'expo.out',
      clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: '#standart', start: 'top 86%', once: true },
    });

    $$('[data-parallax]').forEach((el) => {
      gsap.fromTo(
        el,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    });

    // footer'daki dev yazı kaydırdıkça pas rengiyle dolar
    const mark = $('[data-footer-mark]');
    if (mark) {
      gsap.fromTo(
        mark,
        { '--fill': '0%' },
        {
          '--fill': '100%',
          ease: 'none',
          scrollTrigger: { trigger: mark, start: 'top bottom', end: 'bottom bottom', scrub: true },
        },
      );
    }
  }

  // --- İMLEÇ ---
  function cursor() {
    const c = $('.cursor');
    if (!c || REDUCED || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    gsap.set(c, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener(
      'mousemove',
      (e) => {
        xTo(e.clientX);
        yTo(e.clientY);
        c.classList.add('is-visible');
      },
      { passive: true },
    );
    document.addEventListener('mouseleave', () => c.classList.remove('is-visible'));
    document.addEventListener('mouseover', (e) => {
      c.classList.toggle('is-hover', !!e.target.closest('a, button, input, textarea, .price-card'));
    });
  }

  // --- AÇILIŞ ---
  function intro() {
    const pre = $('.preloader');
    const chars = $$('[data-split]').flatMap(splitChars);
    const fades = $$('[data-hero-fade]');
    const late = performance.now() > 2800; // CSS yedeği perdeyi çoktan kaldırdıysa
    if (pre) pre.style.animation = 'none';

    if (!pre || !hasGsap || REDUCED || late) {
      if (pre) pre.remove();
      startSlides();
      return;
    }

    if (lenis) lenis.stop();
    window.scrollTo(0, 0);
    gsap.set(chars, { yPercent: 118 });
    gsap.set(fades, { autoAlpha: 0, y: 18 });
    gsap.set(pre, { clipPath: 'inset(0% 0% 0% 0%)' });

    const out = $('[data-count]');
    const count = { v: 0 };
    gsap
      .timeline({ defaults: { ease: 'expo.out' } })
      .to(count, {
        v: 100,
        duration: 1.5,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (out) out.textContent = String(Math.round(count.v)).padStart(3, '0');
        },
      })
      .to('.preloader__bar i', { scaleX: 1, duration: 1.5, ease: 'power3.inOut' }, 0)
      .to(pre, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.15, ease: 'expo.inOut' }, '+=0.12')
      .to(chars, { yPercent: 0, duration: 1.35, stagger: 0.045 }, '-=0.55')
      .to(fades, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.09 }, '-=1.05')
      .add(() => {
        pre.remove();
        if (lenis) lenis.start();
        startSlides();
      });
  }

  if (hasGsap) {
    marquees();
    scrollFx();
    cursor();
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
  intro();
})();
