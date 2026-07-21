// ─── CONFIG ───────────────────────────────────────────────
const INTERVALO_MS = 12000; // tiempo por slide en milisegundos
// ──────────────────────────────────────────────────────────

let slides = [];
let currentIndex = 0;
let timer = null;
let progressTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('bovinos_youtube_data.json');
    const data = await res.json();
    slides = data.filter(item => item.type === 'image' && item.image);
  } catch (e) {
    console.error('Error cargando JSON:', e);
    return;
  }

  if (slides.length === 0) return;

  buildDots();
  showSlide(0);
  startAuto();

  document.getElementById('btn-prev').addEventListener('click', () => {
    goTo((currentIndex - 1 + slides.length) % slides.length);
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    goTo((currentIndex + 1) % slides.length);
  });

  // Swipe táctil
  let touchStartX = 0;
  const sw = document.getElementById('slideshow');
  sw.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  sw.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(dx < 0
      ? (currentIndex + 1) % slides.length
      : (currentIndex - 1 + slides.length) % slides.length);
  });
});

function goTo(index) {
  stopAuto();
  showSlide(index);
  startAuto();
}

function showSlide(index) {
  currentIndex = index;
  const slide = slides[index];

  const img = document.getElementById('slide-img');

  // Fade out → cambiar src → fade in
  img.classList.add('fade-out');
  setTimeout(() => {
    img.src = slide.image;
    img.alt = slide.title || '';
    img.classList.remove('fade-out');
  }, 300);

  updateDots();
  resetProgress();
}

function startAuto() {
  timer = setTimeout(() => {
    const next = (currentIndex + 1) % slides.length;
    showSlide(next);
    startAuto();
  }, INTERVALO_MS);
}

function stopAuto() {
  clearTimeout(timer);
  clearTimeout(progressTimer);
}

// ── Dots ──
function buildDots() {
  const container = document.getElementById('slide-dots');
  container.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.addEventListener('click', () => goTo(i));
    container.appendChild(dot);
  });
}

function updateDots() {
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentIndex);
  });
}

// ── Barra de progreso ──
function resetProgress() {
  const fill = document.getElementById('progress-fill');
  fill.style.transition = 'none';
  fill.style.width = '0%';
  // forzar reflow
  fill.getBoundingClientRect();
  fill.style.transition = `width ${INTERVALO_MS}ms linear`;
  fill.style.width = '100%';
}
