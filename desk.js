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
      var mvh = parseFloat(el.getAttribute('data-maxvh'));
      if (mvh && !small.matches) max = Math.min(max, window.innerHeight * mvh);
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

  /* ---------- star turns only while you scroll ---------- */
  var star = $('.hero-star'), spinning = false;
  window.addEventListener('scroll', function () {
    if (spinning || reduce.matches || !star) return;
    spinning = true;
    requestAnimationFrame(function () { star.style.rotate = (window.scrollY * 0.06) + 'deg'; spinning = false; });
  }, { passive: true });

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
    var title = $('h3', car.closest('.folder')).textContent;
    var idx = 0, count = null;
    var ph = document.createElement('span');
    ph.className = 'ph';
    car.insertBefore(ph, car.firstChild);
    imgs.forEach(function (img) {
      img.addEventListener('error', function () { img.style.visibility = 'hidden'; show(idx); });
      if (img.complete && img.naturalWidth === 0) img.style.visibility = 'hidden';   // already failed before this ran
      img.addEventListener('click', function () {
        openLightbox(imgs.filter(function (i) { return i.style.visibility !== 'hidden'; })
          .map(function (i) { return { src: i.currentSrc || i.src, alt: i.alt }; }), title);
      });
    });
    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === idx); });
      ph.innerHTML = 'add image:<br>' + imgs[idx].getAttribute('src');
      car.classList.toggle('is-missing', imgs[idx].style.visibility === 'hidden');
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

  /* ---------- phone screens: click one to see the screens bigger ---------- */
  $$('.phones').forEach(function (group) {
    var title = (group.closest('.folder') || document).querySelector('h3, h1');
    $$('img', group).forEach(function (img) {
      img.addEventListener('click', function () {
        openLightbox($$('img', group).map(function (i) { return { src: i.currentSrc || i.src, alt: i.alt }; }), title ? title.textContent : '');
      });
    });
  });

  /* ---------- fill each folder page before tucking text into "More details" ----------
     Every detail that fits is shown on the page. Only the ones that would be cut off
     go into the "More details" drop-down, and it disappears when everything fits. */
  var fitters = $$('.folder .info').map(function (info) {
    var details = $('.more', info);
    if (!details) return null;
    var tucked = $('.facts', details);
    var shown = document.createElement('dl');
    shown.className = 'facts facts--shown';
    details.parentNode.insertBefore(shown, details);
    var groups = [];
    $$('dt', tucked).forEach(function (dt) {
      var g = [dt], n = dt.nextElementSibling;
      while (n && n.tagName === 'DD') { g.push(n); n = n.nextElementSibling; }
      groups.push(g);
    });
    return function fit() {
      groups.forEach(function (g) { g.forEach(function (el) { shown.appendChild(el); }); });
      details.hidden = true;
      if (!wide.matches) return;                               // smaller screens: the page just grows, so show everything
      var i = groups.length;
      while (i > 0 && info.scrollHeight > info.clientHeight + 1) {
        i--;
        details.hidden = false;
        groups[i].slice().reverse().forEach(function (el) { tucked.insertBefore(el, tucked.firstChild); });
      }
    };
  }).filter(Boolean);
  var fitQueued = false;
  function fitDetails() {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(function () { fitQueued = false; fitters.forEach(function (f) { f(); }); });
  }
  fitDetails();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitDetails);
  window.addEventListener('load', fitDetails);
  window.addEventListener('resize', fitDetails);

  /* =====================================================================
     PROJECT FOLDERS: a drawer of manila folders
     Click a tab: the chosen folder glides forward from its spot in the
     stack and its front flap swings open, all in one continuous motion.
     No hop: it simply comes to the front and opens.
     ===================================================================== */
  var drawer = $('#drawer');
  var folders = $$('.folder', drawer);
  var order = folders.map(function (_, i) { return i; });   // order[0] is the folder in front
  var arrived = false, moving = null;                       // moving = { folder, anim } while a folder is travelling
  var GLIDE = 620, FADE = 200;

  function layout() {
    order.forEach(function (fi, p) {
      var f = folders[fi];
      f.style.setProperty('--p', p);
      f.classList.toggle('front', p === 0);
      $('.f-tab', f).setAttribute('aria-pressed', p === 0 ? 'true' : 'false');
    });
  }
  function setOpen(f, on) {
    f.classList.toggle('open', on);
    var paper = $('.f-paper', f);
    if (on) paper.removeAttribute('inert'); else paper.setAttribute('inert', '');
  }
  function after(ms, fn) { return setTimeout(fn, reduce.matches ? 0 : ms); }
  function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; }

  // stop a folder mid-flight and let it glide on from wherever it is right now
  function stopMoving() {
    if (!moving) return;
    var f = moving.folder, now = getComputedStyle(f).transform;
    moving.anim.cancel();
    moving.fades.forEach(function (a) { a.cancel(); });
    f.style.transform = now === 'none' ? '' : now;
    f.classList.remove('moving');
    void f.offsetWidth;                                     // let the browser register the frozen spot
    f.style.transform = '';                                 // ...then the normal transition carries it on
    moving = null;
  }

  function choose(fi) {
    var target = folders[fi];
    if (moving && moving.folder === target) return;         // already on its way
    stopMoving();
    folders.forEach(function (f) { if (f !== target && f.classList.contains('open')) setOpen(f, false); });
    if (order[0] === fi) { setOpen(target, true); return; }

    var oldP = order.indexOf(fi);
    var r = rem();
    var fromY = oldP * -.8 * r;                             // where it sits in the stack now

    order = [fi].concat(order.filter(function (x) { return x !== fi; }));
    layout();                                               // the other folders start sliding back right away
    setOpen(target, true);                                  // flap opening is delayed in CSS so it happens on landing

    if (reduce.matches || !target.animate) return;

    target.classList.add('moving');                         // CSS transition steps aside; this animation drives it
    // one gentle glide from its slot to the front (no lift, no hop)...
    var anim = target.animate([
      { transform: 'translateY(' + fromY + 'px)', zIndex: 25 },
      { transform: 'translateY(0px)',             zIndex: 25 }
    ], { duration: GLIDE, easing: 'cubic-bezier(.3, .7, .25, 1)' });
    // ...while its body fades in over the old folder, so it never pops in front
    var fades = $$('.f-back, .f-paper, .f-front', target).map(function (el) {
      return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, easing: 'ease-out' });
    });
    moving = { folder: target, anim: anim, fades: fades };
    anim.onfinish = function () {
      target.classList.remove('moving');
      if (moving && moving.anim === anim) moving = null;
    };
  }

  folders.forEach(function (f, i) {
    var tab = $('.f-tab', f);
    tab.setAttribute('aria-label', 'Show project: ' + $('h3', f).textContent);
    $('.f-paper', f).setAttribute('inert', '');
    tab.addEventListener('click', function () {
      arrive(true);
      choose(i);
      if (!wide.matches) scrollToDrawer();
    });
    tab.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      $('.f-tab', folders[(i + d + folders.length) % folders.length]).focus();
    });
  });
  layout();

  function scrollToDrawer() {
    var y = drawer.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 12;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce.matches ? 'auto' : 'smooth' });
  }

  // when the drawer scrolls into view, the folders slide in and the front one opens
  function arrive(skipOpen) {
    if (arrived) return;
    arrived = true;
    drawer.classList.add('in');
    if (!skipOpen) after(600, function () { if (!moving && !folders[order[0]].classList.contains('open')) setOpen(folders[order[0]], true); });
  }
  if (hasIO) {
    var drawerIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { arrive(); drawerIO.disconnect(); }
    }, { threshold: .3 });
    drawerIO.observe(drawer);
  } else { arrive(); }

  // folder icons on the first screen: scroll so the whole folder fits, then pull that folder
  $$('[data-open]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var tag = a.getAttribute('data-open'), idx = 0;
      for (var i = 0; i < folders.length; i++) {
        if ((' ' + folders[i].getAttribute('data-tags') + ' ').indexOf(' ' + tag + ' ') > -1) { idx = i; break; }
      }
      arrive(true);
      scrollToDrawer();
      after(450, function () { choose(idx); });
    });
  });

  // links back from case-study pages (index.html#work)
  if (location.hash === '#work') {
    arrive(true);
    setTimeout(function () { scrollToDrawer(); after(400, function () { choose(order[0]); }); }, 60);
  }

  window.addEventListener('resize', fitText);
})();