/* Case study pages: tabs for the user stories, and click a picture,
   phone screen or sketch to see it bigger. */
(function () {
  'use strict';

  /* ---------- tabs ----------
     Without this script every panel shows, one after another. */
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); select(j, true); }
      });
    });
    panels.forEach(function (p) { p.tabIndex = 0; });
    box.classList.add('is-tabbed');
    select(0);
  });

  /* ---------- lightbox ---------- */
  var lb = document.getElementById('lightbox');
  if (!lb || typeof lb.showModal !== 'function') return;
  var holder = lb.querySelector('.lightbox-images');
  var caption = lb.querySelector('.lightbox-caption');

  function open(imgs, text) {
    holder.innerHTML = '';
    imgs.forEach(function (i) {
      var big = document.createElement('img');
      big.src = i.currentSrc || i.src;
      big.alt = i.alt;
      holder.appendChild(big);
    });
    caption.textContent = text || '';
    lb.showModal();
  }

  // one picture with its own caption
  document.querySelectorAll('.shot img, .sketches--grid img').forEach(function (img) {
    img.addEventListener('click', function () {
      var cap = img.parentNode.querySelector('figcaption');
      open([img], cap ? cap.textContent : '');
    });
  });
  // a row of screens opens together
  document.querySelectorAll('.phones, .sketches--strip').forEach(function (group) {
    var imgs = Array.prototype.slice.call(group.querySelectorAll('img'));
    // use the group's own caption if it has one, otherwise the page title
    var fig = group.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    var text = cap ? cap.textContent : document.querySelector('h1').textContent;
    imgs.forEach(function (img) {
      img.addEventListener('click', function () { open(imgs, text); });
    });
  });

  lb.querySelector('.lightbox-close').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === holder) lb.close(); });
})();
