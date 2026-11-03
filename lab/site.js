/* Shared: the email address, assembled here so it is not sitting in the
   markup for scrapers, and the page turning dark once the reader reaches the
   element marked data-dark-from (the same behaviour as the live homepage). */
(function () {
  'use strict';
  document.querySelectorAll('[data-mail]').forEach(function (a) {
    var addr = 'hello' + '@' + 'studiovincent.co'; a.href = 'mailto:' + addr; if (!a.textContent.trim()) a.textContent = addr;
    if (a.classList.contains('quiet')) {
      a.innerHTML = '<svg class="email-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m21 3-7 18-4-7-7-4 18-7Z"/><path d="m10 14 5-5"/></svg><span>Email</span>';
    }
  });
  var boundary = document.querySelector('[data-dark-from]');
  if (!boundary) return;
  var ticking = false;
  function apply() { document.documentElement.classList.toggle('dark-active', boundary.getBoundingClientRect().top <= innerHeight * .7); ticking = false; }
  function on() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }
  apply(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
})();
