/* =========================================================================
   LARIANNA RAMSEY: PORTFOLIO interactions
   - fits the big title, bouncy letters
   - nav highlight, scroll reveals
   - project folders (open one at a time; the first opens when you scroll to it)
   - image carousels + popup, photo flip, copy email, AirDrop card
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var wide = window.matchMedia('(min-width: 900px)');
  var small = window.matchMedia('(max-width: 700px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---------- big title: split letters + fit to width ---------- */
  $$('.split').forEach(function (el) {
    var txt = el.textContent;
    el.textContent = '';
    txt.split('').forEach(function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      s.style.setProperty('--i', i);
      el.appendChild(s);
    });
  });
  function fitText() {
    $$('[data-fit]').forEach(function (el) {
      var box = el.closest('.hero-title') || el.parentElement;
      var frac = parseFloat(el.getAttribute(small.matches ? 'data-fit-m' : 'data-fit')) || .8;
      var max = parseFloat(el.getAttribute('data-max')) || 9999;
      el.style.fontSize = '100px';
      var nat = el.offsetWidth;
      if (nat > 0) el.style.fontSize = Math.min(max, 100 * box.clientWidth * frac / nat) + 'px';
    });
  }
  fitText();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitText);

  /* ---------- nav ---------- */
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (hasIO) {
    var links = $$('.nav nav a[href^="#"]');
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { navIO.observe(s); });
  }

  /* ---------- scroll reveals ---------- */
  function revealAll() { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); }
  if (hasIO && !reduce.matches) {
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revIO.unobserve(en.target); }
      });
    }, { threshold: .15 });
    $$('.reveal').forEach(function (el) { revIO.observe(el); });
  } else { revealAll(); }

  var steps = $('#steps');
  if (hasIO && !reduce.matches) {
    var stepIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { steps.classList.add('in'); stepIO.disconnect(); }
    }, { threshold: .25 });
    stepIO.observe(steps);
  } else { steps.classList.add('in'); }

  /* ---------- copy email ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    function done() { toast('Email copied: ' + text); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { toast(text); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  });

  /* ---------- AirDrop ---------- */
  $$('.ad-no').forEach(function (b) {
    b.addEventListener('click', function () { toast('Okay, no pressure. It’s in the menu whenever you want it.'); });
  });

  /* ---------- photo flip ---------- */
  var pol = $('.polaroid'), polBtn = $('.polaroid-btn');
  function setPol(on) {
    pol.classList.toggle('is-flipped', on);
    polBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  polBtn.addEventListener('click', function () { setPol(!pol.classList.contains('is-flipped')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pol.classList.contains('is-flipped')) setPol(false); });

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbImgs = $('.lightbox-images', lb), lbCap = $('.lightbox-caption', lb);
  function openLightbox(items, caption) {
    lbImgs.innerHTML = '';
    items.forEach(function (it) {
      var im = document.createElement('img');
      im.src = it.src; im.alt = it.alt || '';
      lbImgs.appendChild(im);
    });
    lbCap.textContent = caption || '';
    if (typeof lb.showModal === 'function') { if (!lb.open) lb.showModal(); } else lb.setAttribute('open', '');
  }
  $('.lightbox-close', lb).addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbImgs) lb.close(); });

  /* ---------- image carousels ---------- */
  $$('.car').forEach(function (car) {
    var imgs = $$('img', car);
    var title = $('h3', car.closest('.fold')).textContent;
    var idx = 0, count = null;
    var ph = document.createElement('span');
    ph.className = 'ph';
    car.insertBefore(ph, car.firstChild);
    imgs.forEach(function (img) {
      img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
      img.addEventListener('click', function () {
        openLightbox(imgs.filter(function (i) { return i.style.visibility !== 'hidden'; })
          .map(function (i) { return { src: i.currentSrc || i.src, alt: i.alt }; }), title);
      });
    });
    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === idx); });
      ph.innerHTML = 'add image:<br>' + imgs[idx].getAttribute('src');
      if (count) count.textContent = (idx + 1) + ' / ' + imgs.length;
    }
    var media = car.parentElement;
    var zoom = document.createElement('span');
    zoom.className = 'car-zoom'; zoom.textContent = 'click to enlarge';
    media.appendChild(zoom);
    if (imgs.length > 1) {
      var p = document.createElement('button'), n = document.createElement('button');
      p.type = n.type = 'button';
      p.className = 'car-btn car-prev'; n.className = 'car-btn car-next';
      p.innerHTML = '&#8249;'; n.innerHTML = '&#8250;';
      p.setAttribute('aria-label', 'Previous image'); n.setAttribute('aria-label', 'Next image');
      count = document.createElement('span'); count.className = 'car-count';
      p.addEventListener('click', function () { show(idx - 1); });
      n.addEventListener('click', function () { show(idx + 1); });
      media.appendChild(p); media.appendChild(n); media.appendChild(count);
    }
    show(0);
  });

  /* =====================================================================
     PROJECT FOLDERS
     ===================================================================== */
  var cabinet = $('#cabinet');
  var folds = $$('.fold', cabinet);
  var current = -1;

  function sizePanels() {
    if (!wide.matches) { cabinet.style.removeProperty('--pw'); return; }
    var w = cabinet.clientWidth;
    var collapsed = folds[0] ? parseFloat(getComputedStyle(folds[0]).flexBasis) || 73.6 : 73.6;
    var gap = parseFloat(getComputedStyle(cabinet).columnGap) || 12;
    var pw = w - (folds.length - 1) * (collapsed + gap) - 2 * 17.6;
    cabinet.style.setProperty('--pw', Math.max(320, pw) + 'px');
  }

  function setFold(i) {
    current = i;
    folds.forEach(function (f, k) {
      var on = k === i;
      var tab = $('.fold-tab', f), panel = $('.fold-panel', f);
      f.classList.toggle('open', on);
      tab.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    });
  }

  folds.forEach(function (f, k) {
    var tab = $('.fold-tab', f);
    $('.fold-panel', f).setAttribute('inert', '');
    tab.addEventListener('click', function () {
      if (current === k) {
        if (!wide.matches) setFold(-1);   // on phones, tapping an open folder closes it
        return;
      }
      setFold(k);
      if (!wide.matches) setTimeout(function () { f.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); }, 30);
    });
    tab.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      $('.fold-tab', folds[(k + d + folds.length) % folds.length]).focus();
    });
  });

  function openByTag(tag) {
    for (var i = 0; i < folds.length; i++) {
      if ((' ' + folds[i].getAttribute('data-tags') + ' ').indexOf(' ' + tag + ' ') > -1) { setFold(i); return; }
    }
  }

  // scrolling to the work section opens the first folder
  var opened = false;
  function arrive() {
    if (opened) return;
    opened = true;
    cabinet.classList.add('in');
    if (current < 0 && wide.matches) setTimeout(function () { if (current < 0) setFold(0); }, reduce.matches ? 0 : 650);
  }
  if (hasIO) {
    var cabIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { arrive(); cabIO.disconnect(); }
    }, { threshold: .3 });
    cabIO.observe(cabinet);
  } else { arrive(); }

  // folder icons in the hero jump to a project type
  $$('[data-open]').forEach(function (a) {
    a.addEventListener('click', function () {
      arrive();
      openByTag(a.getAttribute('data-open'));
    });
  });

  // links back from case-study pages (index.html#work)
  if (location.hash === '#work') { arrive(); if (current < 0) setFold(0); }

  sizePanels();
  window.addEventListener('resize', function () { fitText(); sizePanels(); });
  if (wide.addEventListener) wide.addEventListener('change', sizePanels);
})();