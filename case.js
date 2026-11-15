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
