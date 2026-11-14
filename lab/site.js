/* Shared: the email address, assembled here so it is not sitting in the
   markup for scrapers, and the page turning dark once the reader reaches the
   element marked data-dark-from (the same behaviour as the live homepage). */
(function () {
  'use strict';
  document.querySelectorAll('[data-mail]').forEach(function (a) {
    var addr = 'studiovincent.co' + '@' + 'gmail.com'; a.href = 'mailto:' + addr; if (!a.textContent.trim()) a.textContent = addr;
    if (a.classList.contains('quiet')) a.textContent = 'Email instead';
  });
  var boundary = document.querySelector('[data-dark-from]');
  if (!boundary) return;
  var ticking = false;
  var top = document.querySelector('.top');
  /* Near the top, where the header is on screen, the switch back from dark is
     instant, so the logo and nav never look as if they are fading in. */
  function apply() {
    var root = document.documentElement;
    root.classList.toggle('at-top', scrollY < (top ? top.offsetHeight : 80) + 40);
    root.classList.toggle('dark-active', boundary.getBoundingClientRect().top <= innerHeight * .7);
    ticking = false;
  }
  function on() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }
  apply(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
})();
