/* Case study pages: click a picture or phone screen to see it bigger. */
(function () {
  'use strict';
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

  document.querySelectorAll('.shot img').forEach(function (img) {
    img.addEventListener('click', function () {
      var cap = img.parentNode.querySelector('figcaption');
      open([img], cap ? cap.textContent : '');
    });
  });
  document.querySelectorAll('.phones').forEach(function (group) {
    var imgs = Array.prototype.slice.call(group.querySelectorAll('img'));
    imgs.forEach(function (img) {
      img.addEventListener('click', function () { open(imgs, document.querySelector('h1').textContent); });
    });
  });

  lb.querySelector('.lightbox-close').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === holder) lb.close(); });
})();
