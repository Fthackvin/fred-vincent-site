(() => {
  const section = document.querySelector('.portrait-sequence');
  const young = document.querySelector('.young');
  const title = document.querySelector('.story-title');
  const cue = document.querySelector('.scroll-cue');
  const shade = document.querySelector('.portrait-shade');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const artwork = [...document.querySelectorAll('.image_one, .image_two, .image_three, .image_four, .image_five, .image_six')];
  const videos = [...document.querySelectorAll('video[data-motion-src]')];
  const visibleVideos = new Set();
  const clamp = value => Math.max(0, Math.min(1, value));
  let pending = false;

  function render() {
    pending = false;
    if (document.hidden || reduced.matches) return;
    const bounds = section.getBoundingClientRect();
    if (bounds.top <= innerHeight && bounds.bottom >= 0) {
      const progress = clamp(-bounds.top / Math.max(1, bounds.height - innerHeight));
      // Hold the first portrait, then fade over most of the extended scroll.
      const fade = clamp((progress - .2) / .65);
      young.style.opacity = String(1 - fade);
      const entering = clamp((progress - .72) / .28);
      title.style.opacity = String(entering);
      shade.style.opacity = String(.32 * entering);
      title.style.transform = 'translateY(' + (90 * (1 - entering)) + 'px)';
      cue.style.opacity = String(1 - clamp(progress * 8));
    }
    artwork.forEach(frame => {
      const box = frame.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      const image = frame.querySelector('img');
      if (image) image.style.transform = 'translate3d(0,' + ((.5 - clamp((innerHeight - box.top) / (innerHeight + box.height))) * 40) + 'px,0)';
    });
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  function syncVideos() {
    videos.forEach(video => {
      if (document.hidden || reduced.matches || !visibleVideos.has(video)) video.pause();
      else if (video.currentSrc) video.play().catch(() => {});
    });
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', () => { schedule(); syncVideos(); });
  reduced.addEventListener('change', () => { schedule(); syncVideos(); });

  if (!reduced.matches && 'IntersectionObserver' in window) {
    const entrances = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-shown');
        entrances.unobserve(entry.target);
      }
    }), { threshold: .12 });
    artwork.forEach(frame => { frame.classList.add('scroll-art'); entrances.observe(frame); });
    const near = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      video.muted = true;
      video.src = video.dataset.motionSrc;
      video.load();
      near.unobserve(video);
      syncVideos();
    }), { rootMargin: '150px' });
    const visible = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visibleVideos.add(entry.target) : visibleVideos.delete(entry.target));
      syncVideos();
    }, { threshold: .1 });
    videos.forEach(video => { video.addEventListener('loadeddata', syncVideos); near.observe(video); visible.observe(video); });
  }
  const note = document.querySelector('.recreation-note');
  try { note.hidden = sessionStorage.getItem('gazza-recreation-dismissed') === '1'; } catch {}
  note.querySelector('button').addEventListener('click', () => {
    note.hidden = true;
    try { sessionStorage.setItem('gazza-recreation-dismissed', '1'); } catch {}
  });
  schedule();
})();
