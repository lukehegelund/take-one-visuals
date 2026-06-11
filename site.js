/* Take One Visuals — shared scripts */

// Nav background switch on scroll (transparent hero nav only)
const nav = document.getElementById('nav');
if (nav && !nav.classList.contains('solid')) {
  const onScroll = () => {
    if (window.scrollY > 80) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// YouTube modal
const modal = document.getElementById('ytModal');
const iframe = document.getElementById('ytIframe');
const closeBtn = document.getElementById('ytClose');
let lastFocused = null;

function openYt(id) {
  lastFocused = document.activeElement;
  iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  closeBtn.focus();
}
function closeYt() {
  modal.classList.remove('open');
  iframe.src = '';
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}
document.querySelectorAll('.film[data-yt]').forEach(el => {
  // Make cards keyboard-operable
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  const title = el.querySelector('h3');
  if (title) el.setAttribute('aria-label', `Play wedding film: ${title.textContent}`);
  el.addEventListener('click', () => openYt(el.dataset.yt));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openYt(el.dataset.yt);
    }
  });
});
closeBtn.addEventListener('click', closeYt);
modal.addEventListener('click', (e) => { if (e.target === modal) closeYt(); });
document.addEventListener('keydown', (e) => {
  if (!modal.classList.contains('open')) return;
  if (e.key === 'Escape') closeYt();
  // Keep keyboard focus inside the dialog while it is open
  if (e.key === 'Tab') {
    const focusables = [closeBtn, iframe];
    const i = focusables.indexOf(document.activeElement);
    const next = e.shiftKey
      ? focusables[(i - 1 + focusables.length) % focusables.length]
      : focusables[(i + 1) % focusables.length];
    e.preventDefault();
    next.focus();
  }
});

// Reviews carousel (home page only)
(function () {
  const carousel = document.getElementById('reviewCarousel');
  if (!carousel) return;
  const slides = carousel.querySelectorAll('.review-slide');
  const dots = document.querySelectorAll('#carouselDots .carousel-dot');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const ROTATE_MS = 7000;
  let current = 0;
  let timer = null;

  function show(i) {
    slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    current = i;
  }
  function next() { show((current + 1) % slides.length); }
  function prev() { show((current - 1 + slides.length) % slides.length); }
  function start() { stop(); timer = setInterval(next, ROTATE_MS); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  nextBtn.addEventListener('click', () => { next(); start(); });
  prevBtn.addEventListener('click', () => { prev(); start(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); start(); }));

  // Pause on hover / focus
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);

  // Pause when section scrolls offscreen (saves cycles)
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting ? start() : stop());
  }, { threshold: 0.2 });
  sectionIO.observe(carousel);

  start();
})();
