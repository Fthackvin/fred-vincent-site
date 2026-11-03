/* Shared: the email address, assembled here so it is not sitting in the
   markup for scrapers, and the page turning dark once the reader reaches the
   element marked data-dark-from (the same behaviour as the live homepage). */
(function () {
  'use strict';
  document.querySelectorAll('[data-mail]').forEach(function (a) {
    var addr = 'hello' + '@' + 'studiovincent.co'; a.href = 'mailto:' + addr; if (!a.textContent.trim()) a.textContent = addr;
    if (a.classList.contains('quiet')) a.textContent = 'Email';
  });
  var boundary = document.querySelector('[data-dark-from]');
  if (!boundary) return;
  var ticking = false;
  function apply() { document.documentElement.classList.toggle('dark-active', boundary.getBoundingClientRect().top <= innerHeight * .7); ticking = false; }
  function on() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }
  apply(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
})();
