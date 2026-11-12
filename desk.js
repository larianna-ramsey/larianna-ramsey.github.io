/* =========================================================================
   DESK PORTFOLIO: interactions
   - Desk objects (lamp, mug, plant, pencils, sticky note, polaroid, business card)
   - The binder: builds pages from the project list in index.html and flips them
   - Image popup (lightbox), copy-email, toast messages
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function mk(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function onMQ(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else mq.addListener(fn); }

  var stage = $('#stage');
  var desk = window.matchMedia('(min-width: 1000px) and (min-height: 540px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2300);
  }

  /* ---------- name: split into letter circles ---------- */
  $$('.name-line').forEach(function (line) {
    var txt = line.textContent;
    line.textContent = '';
    txt.split('').forEach(function (c, i) {
      var s = mk('span', 'ch');
      s.textContent = c;
      s.style.setProperty('--i', i);
      line.appendChild(s);
    });
  });

  /* ---------- hints ---------- */
  function dismissHint(el) {
    if (!el) return;
    $$('.hint', el).forEach(function (h) { h.classList.add('gone'); });
  }

  /* ---------- copy to clipboard ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    function done() { toast('Email copied: ' + text); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { toast('Copy it here: ' + text); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
  });

  /* ---------- polaroid ---------- */
  var pol = $('.polaroid'), polBtn = $('.polaroid-btn');
  function setPol(on) {
    pol.classList.toggle('is-flipped', on);
    polBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    polBtn.setAttribute('aria-label', on ? 'Flip the polaroid back over' : 'Flip the polaroid to read about me');
  }
  polBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    setPol(!pol.classList.contains('is-flipped'));
    dismissHint(pol);
  });
  document.addEventListener('click', function (e) {
    if (pol.classList.contains('is-flipped') && !pol.contains(e.target)) setPol(false);
  });

  /* ---------- lamp ---------- */
  var lamp = $('#lamp'), overlay = $('.night-overlay');
  function placeLight() {
    if (!lamp || !overlay) return;
    var r = lamp.getBoundingClientRect();
    overlay.style.setProperty('--lx', (r.left + r.width * 1.0) + 'px');
    overlay.style.setProperty('--ly', (r.top + r.height * 0.9) + 'px');
  }
  lamp.addEventListener('click', function () {
    var on = !document.body.classList.contains('night');
    placeLight();
    document.body.classList.toggle('night', on);
    lamp.setAttribute('aria-pressed', on ? 'true' : 'false');
    dismissHint(lamp);
  });
  window.addEventListener('resize', placeLight);

  /* ---------- little desk toys ---------- */
  function toy(id, msg) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('click', function () {
      el.classList.remove('jiggle');
      void el.offsetWidth;
      el.classList.add('jiggle');
      setTimeout(function () { el.classList.remove('jiggle'); }, 1300);
      toast(msg);
    });
  }
  toy('#mug', 'Fresh cup of coffee.');
  toy('#pencils', 'Pencils sharpened.');
  toy('#plant', 'Plant watered.');

  /* ---------- sticky note -> process dialog ---------- */
  var noteDlg = $('#note-dialog');
  function closeOnBackdrop(dlg) {
    dlg.addEventListener('click', function (e) {
      var r = dlg.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
  }
  $('#open-process').addEventListener('click', function () {
    if (typeof noteDlg.showModal === 'function') noteDlg.showModal();
    else noteDlg.setAttribute('open', '');
  });
  $('#note-close').addEventListener('click', function () { noteDlg.close(); });
  closeOnBackdrop(noteDlg);

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
    if (typeof lb.showModal === 'function') { if (!lb.open) lb.showModal(); }
    else lb.setAttribute('open', '');
  }
  $('.lightbox-close', lb).addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbImgs) lb.close(); });

  // list view (phones): tap a picture to enlarge
  $$('.proj-images img').forEach(function (img) {
    img.addEventListener('click', function () {
      if (desk.matches) return;
      var proj = img.closest('.proj');
      var items = $$('.proj-images img', proj).map(function (i) { return { src: i.getAttribute('src'), alt: i.getAttribute('alt') }; });
      openLightbox(items, $('h3', proj).textContent);
    });
  });

  /* =====================================================================
     THE BINDER
     ===================================================================== */
  var view = $('#binder-view');
  var pagesEl = $('#pages');
  var tabsEl = $('#tabs');
  var statusEl = $('#bv-status');
  var prevBtn = $('#bv-prev'), nextBtn = $('#bv-next');
  var peelPrev = $('#peel-prev'), peelNext = $('#peel-next');
  var projects = $$('#projects .proj');
  var N = projects.length;
  var built = false, isOpen = false, current = 0, opener = null;
  var leaves = [], tabBtns = [], allFaces = [], faceFor = {};

  function clone(sel, root) { var n = $(sel, root); return n ? n.cloneNode(true) : null; }

  function buildCarousel(imgs, title) {
    var car = mk('div', 'pv-car');
    car.setAttribute('role', 'group');
    car.setAttribute('aria-label', title + ' images');
    var open = mk('button', 'pv-open'); open.type = 'button';
    open.setAttribute('aria-label', 'View larger: ' + title);
    var ph = mk('span', 'ph');
    var img = document.createElement('img');
    open.appendChild(ph); open.appendChild(img);
    open.appendChild(mk('span', 'pv-zoom', 'click to enlarge'));
    car.appendChild(open);
    var idx = 0, count = null;
    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      img.style.visibility = '';
      img.onload = function () { img.style.visibility = ''; };
      img.onerror = function () { img.style.visibility = 'hidden'; };
      img.src = imgs[idx].src;
      img.alt = imgs[idx].alt;
      ph.innerHTML = 'add image:<br>' + imgs[idx].src;
      if (count) count.textContent = (idx + 1) + ' / ' + imgs.length;
    }
    if (imgs.length > 1) {
      var p = mk('button', 'pv-arrow pv-arrow--prev', '&#8249;'); p.type = 'button'; p.setAttribute('aria-label', 'Previous image');
      var n = mk('button', 'pv-arrow pv-arrow--next', '&#8250;'); n.type = 'button'; n.setAttribute('aria-label', 'Next image');
      count = mk('span', 'pv-count');
      p.addEventListener('click', function () { show(idx - 1); });
      n.addEventListener('click', function () { show(idx + 1); });
      car.appendChild(p); car.appendChild(n); car.appendChild(count);
    }
    open.addEventListener('click', function () { openLightbox(imgs, title); });
    show(0);
    return car;
  }

  function previewFace(p) {
    var f = mk('div', 'face-in face-in--top');
    var title = $('h3', p).textContent;
    var imgs = $$('.proj-images img', p).map(function (im) { return { src: im.getAttribute('src'), alt: im.getAttribute('alt') || '' }; });
    var media = mk('div', 'pv');
    if (imgs.length) {
      media.appendChild(buildCarousel(imgs, title));
    } else {
      var res = $('.proj-result', p);
      var text = res ? res.textContent.replace(/^\s*Result\s*/, '') : '';
      var q = mk('blockquote', 'pv-quote');
      q.appendChild(mk('span', 'pv-qlabel', 'Result'));
      var qp = document.createElement('p'); qp.textContent = text;
      q.appendChild(qp);
      media.appendChild(q);
    }
    var head = mk('div', 'pv-head');
    head.innerHTML = $('.proj-head', p).innerHTML;
    f.appendChild(media); f.appendChild(head);
    f._hasImgs = imgs.length > 0;
    return f;
  }

  function detailsFace(p) {
    var f = mk('div', 'face-in face-in--bot');
    var hasImgs = $$('.proj-images img', p).length > 0;
    var main = mk('div', 'bt-main');
    ['.proj-blurb', hasImgs ? '.proj-result' : null, '.proj-tools', '.proj-links'].forEach(function (sel) {
      if (!sel) return;
      var c = clone(sel, p); if (c) main.appendChild(c);
    });
    var side = mk('div', 'bt-side');
    var facts = clone('.proj-facts', p); if (facts) side.appendChild(facts);
    f.appendChild(main); f.appendChild(side);
    return f;
  }

  function tplFace(id) {
    var f = mk('div');
    f.appendChild(document.getElementById(id).content.cloneNode(true));
    return f.firstElementChild;
  }

  function mkFace(kind, inner) {
    var d = mk('div', 'face face--' + kind);
    d.appendChild(inner);
    allFaces.push(d);
    return d;
  }

  function buildBinder() {
    if (built) return;
    built = true;

    // rings
    var rings = $('.rings', view);
    for (var r = 0; r < 12; r++) rings.appendChild(document.createElement('i'));

    // base halves
    var baseTop = mk('div', 'half half--top');
    baseTop.appendChild(mkFace('static', previewFace(projects[0])));
    var baseBot = mk('div', 'half half--bottom');
    var baseBotFace = mkFace('static', tplFace('tpl-contact-bottom'));
    baseBot.appendChild(baseBotFace);
    pagesEl.appendChild(baseTop);
    pagesEl.appendChild(baseBot);

    faceFor.top0 = baseTop.firstChild;
    faceFor.bottomEnd = baseBotFace;
    faceFor.back = [];
    faceFor.front = [];

    // leaves
    for (var i = 0; i < N; i++) {
      var leaf = mk('div', 'leaf');
      var front = mkFace('front', detailsFace(projects[i]));
      var backInner = (i + 1 < N) ? previewFace(projects[i + 1]) : tplFace('tpl-contact-top');
      var back = mkFace('back', backInner);
      leaf.appendChild(front); leaf.appendChild(back);
      leaf._want = false;
      leaf.style.zIndex = N - i;
      pagesEl.appendChild(leaf);
      leaves.push(leaf);
      faceFor.front.push(front);
      faceFor.back.push(back);
    }

    // tabs
    for (var k = 0; k <= N; k++) {
      (function (k) {
        var t = mk('button', 'tab', k < N ? ('0' + (k + 1)).slice(-2) : '&#9993;');
        t.type = 'button';
        var title = k < N ? $('h3', projects[k]).textContent : 'Get in touch';
        t.title = title;
        t.setAttribute('aria-label', 'Go to ' + title);
        t.addEventListener('click', function () { goTo(k); });
        tabsEl.appendChild(t);
        tabBtns.push(t);
      })(k);
    }
  }

  function refresh() {
    tabBtns.forEach(function (t, k) {
      t.classList.toggle('active', k === current);
      if (k === current) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    statusEl.textContent = current < N ? 'Project ' + (current + 1) + ' of ' + N : 'Get in touch';
    prevBtn.disabled = peelPrev.disabled = current === 0;
    nextBtn.disabled = peelNext.disabled = current === N;
    var topVis = current === 0 ? faceFor.top0 : faceFor.back[current - 1];
    var botVis = current < N ? faceFor.front[current] : faceFor.bottomEnd;
    allFaces.forEach(function (f) {
      var vis = (f === topVis || f === botVis);
      if (vis) { f.removeAttribute('inert'); f.removeAttribute('aria-hidden'); }
      else { f.setAttribute('inert', ''); f.setAttribute('aria-hidden', 'true'); }
    });
  }

  function settleZ(li) {
    var leaf = leaves[li];
    leaf.style.zIndex = leaf._want ? (li + 1) : (N - li);
  }

  function goTo(target, instant) {
    if (!built) return;
    target = Math.max(0, Math.min(N, target));
    var forward = target > current;
    var todo = [];
    for (var i = 0; i < N; i++) {
      var want = i < target;
      if (leaves[i]._want !== want) todo.push(i);
    }
    if (!forward) todo.reverse();
    current = target;

    var fast = instant || reduce.matches;
    if (fast) pagesEl.classList.add('no-anim');
    todo.forEach(function (li, k) {
      var leaf = leaves[li];
      var want = li < target;
      leaf._want = want;
      clearTimeout(leaf._d); clearTimeout(leaf._s);
      function go() {
        leaf.style.zIndex = 1000 + (want ? li : (N - li));
        leaf.classList.toggle('is-flipped', want);
        leaf._s = setTimeout(function () { settleZ(li); }, fast ? 0 : 1050);
      }
      if (fast) go(); else leaf._d = setTimeout(go, k * 140);
    });
    if (fast) {
      void pagesEl.offsetWidth;
      pagesEl.classList.remove('no-anim');
    }
    refresh();
  }

  function setInert(on) {
    Array.prototype.forEach.call(stage.children, function (c) {
      if (c === view) return;
      if (on) c.setAttribute('inert', ''); else c.removeAttribute('inert');
    });
  }

  function openBinder(spread, instant) {
    if (!desk.matches || isOpen) return;
    buildBinder();
    opener = document.activeElement;
    isOpen = true;
    setInert(true);
    view.hidden = false;
    goTo(spread || 0, true);
    if (instant || reduce.matches) view.classList.add('open');
    else requestAnimationFrame(function () { requestAnimationFrame(function () { view.classList.add('open'); }); });
    $('#bv-close').focus({ preventScroll: true });
    dismissHint($('#open-binder'));
  }

  function closeBinder(instant) {
    if (!isOpen) return;
    isOpen = false;
    view.classList.remove('open');
    setInert(false);
    setTimeout(function () { if (!isOpen) view.hidden = true; }, instant || reduce.matches ? 0 : 320);
    var back = (opener && opener.focus && document.contains(opener)) ? opener : $('#open-binder');
    if (back && back.focus) back.focus({ preventScroll: true });
    if (/^#(work|projects|contact)$/.test(location.hash) && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  $('#open-binder').addEventListener('click', function () { openBinder(0); });
  $('#bv-close').addEventListener('click', function () { closeBinder(); });
  view.addEventListener('click', function (e) { if (e.target === view) closeBinder(); });
  prevBtn.addEventListener('click', function () { goTo(current - 1); });
  nextBtn.addEventListener('click', function () { goTo(current + 1); });
  peelPrev.addEventListener('click', function () { goTo(current - 1); });
  peelNext.addEventListener('click', function () { goTo(current + 1); });

  // mouse wheel over the pages flips them
  var wheelLock = 0;
  $('.binder-pages', view).addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) < 20) return;
    e.preventDefault();
    var now = Date.now();
    if (now - wheelLock < 700) return;
    wheelLock = now;
    goTo(current + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  // keyboard
  document.addEventListener('keydown', function (e) {
    if (lb.open || noteDlg.open) return;
    if (e.key === 'Escape') {
      if (isOpen) { e.preventDefault(); closeBinder(); return; }
      if (pol.classList.contains('is-flipped')) setPol(false);
      return;
    }
    if (!isOpen) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); goTo(current - 1); }
    else if (k === 'Home') { e.preventDefault(); goTo(0); }
    else if (k === 'End') { e.preventDefault(); goTo(N); }
  });

  // leaving desktop size closes the binder
  onMQ(desk, function () { if (!desk.matches && isOpen) closeBinder(true); });

  /* ---------- links from other pages (index.html#work etc.) ---------- */
  var biz = $('.bizcard'); if (biz && !biz.id) biz.id = 'contact';
  function handleHash() {
    var h = location.hash;
    if (h === '#work' || h === '#projects') {
      if (desk.matches) openBinder(0, true);
      else { var p = $('#projects'); if (p) p.scrollIntoView(); }
    } else if (h === '#contact') {
      if (desk.matches) openBinder(N, true);
      else if (biz) biz.scrollIntoView();
    } else if (h === '#about') {
      if (desk.matches) setPol(true);
    }
  }
  window.addEventListener('hashchange', handleHash);
  handleHash();
})();