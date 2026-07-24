let bovinosData = [];
let ytPlayer = null;
let ytAPIReady = false;
let currentIndex = -1;
let flatList = [];
let imageTimer = null; // timer para autoavance de imágenes

const ORDERED_CATEGORIES = [
  "AGENDA ANGUS",
  "EXPO RURAL 26 - ANUNCIOS"
];

// ── YouTube IFrame API ──
function onYouTubeIframeAPIReady() {
  ytAPIReady = true;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('bovinos_youtube_data.json');
    bovinosData = await res.json();
  } catch (e) {
    console.error('Error cargando JSON:', e);
    alert("No se pudieron cargar los datos.");
    return;
  }

  // Lista plana para navegación secuencial
  flatList = bovinosData;

  renderSectionsByCategory(bovinosData);
  buildCategoriesNav(bovinosData);

  document.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('btn-prev').addEventListener('click', () => goTo(currentIndex - 1));
  document.getElementById('btn-next').addEventListener('click', () => goTo(currentIndex + 1));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
    if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
  });
});

function groupByCategory(items) {
  const groups = new Map();
  for (const it of items) {
    const cat = (it.category ?? 'SIN CATEGORÍA').toString().trim();
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(it);
  }
  return groups;
}

function renderSectionsByCategory(items) {
  const container = document.getElementById('bovino-sections');
  container.innerHTML = '';
  const groups = groupByCategory(items);
  const allKeys = Array.from(groups.keys());
  const orderedFirst = ORDERED_CATEGORIES.filter(c => allKeys.includes(c));
  const remaining = allKeys.filter(k => !ORDERED_CATEGORIES.includes(k)).sort((a, b) => a.localeCompare(b));

  for (const cat of [...orderedFirst, ...remaining]) {
    const arr = groups.get(cat) || [];
    const section = document.createElement('section');
    section.className = 'category-section';
    section.id = slugify(cat);

    const h2 = document.createElement('h2');
    h2.className = 'category-title';
    h2.textContent = cat;
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'category-grid';
    arr.forEach(item => {
      const card = createCard(item);
      if (card) grid.appendChild(card);
    });
    section.appendChild(grid);
    container.appendChild(section);
  }
}

function createCard(item) {
  const card = document.createElement('div');
  const isVertical = item.orientation === 'vertical';
  card.className = `bovino-item bovino-item--${isVertical ? 'vertical' : 'horizontal'}`;

  const wrapper = document.createElement('div');
  wrapper.className = 'media-wrapper';

  if (item.type === 'image') {
    const img = document.createElement('img');
    img.src = item.file;
    img.alt = item.title;
    img.loading = 'lazy';
    wrapper.appendChild(img);

  } else if (item.type === 'video-youtube') {
    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${item.youtube_video_id}/mqdefault.jpg`;
    img.alt = item.title;
    img.loading = 'lazy';
    wrapper.appendChild(img);

    const playIcon = document.createElement('div');
    playIcon.className = 'play-icon';
    playIcon.innerHTML = '▶';
    wrapper.appendChild(playIcon);

  } else if (item.type === 'video-local') {
    const video = document.createElement('video');
    video.src = item.file;
    video.muted = true;
    video.preload = 'metadata';
    video.addEventListener('loadedmetadata', () => { video.currentTime = 0.5; });
    wrapper.appendChild(video);

    const playIcon = document.createElement('div');
    playIcon.className = 'play-icon';
    playIcon.innerHTML = '▶';
    wrapper.appendChild(playIcon);
  }

  const h3 = document.createElement('h3');
  h3.textContent = item.title;
  card.appendChild(wrapper);
  card.appendChild(h3);

  const idx = flatList.indexOf(item);
  card.addEventListener('click', () => openLightbox(idx));
  return card;
}

function buildCategoriesNav(items) {
  const nav = document.getElementById('categories-nav');
  nav.innerHTML = '';
  const groups = groupByCategory(items);
  const allKeys = Array.from(groups.keys());
  const orderedFirst = ORDERED_CATEGORIES.filter(c => allKeys.includes(c));
  const remaining = allKeys.filter(k => !ORDERED_CATEGORIES.includes(k)).sort();

  for (const cat of [...orderedFirst, ...remaining]) {
    const a = document.createElement('a');
    a.href = `#${slugify(cat)}`;
    a.textContent = `${cat} (${groups.get(cat).length})`;
    nav.appendChild(a);
  }
}

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Navegación ──
function goTo(index) {
  if (index < 0) index = flatList.length - 1;
  if (index >= flatList.length) index = 0;
  openLightbox(index);
}

// ── Lightbox ──
function openLightbox(index) {
  currentIndex = index;
  const item = flatList[index];

  const lb = document.getElementById('flyer-lightbox');
  const vid = document.getElementById('lightbox-video');
  const img = document.getElementById('lightbox-img');
  const ytContainer = document.getElementById('yt-player-container');

  // Limpiar todo
  vid.style.display = 'none';
  vid.pause();
  vid.src = '';
  img.style.display = 'none';
  img.src = '';
  ytContainer.style.display = 'none';

  // Cancelar timer de imagen anterior si existe
  if (imageTimer) { clearTimeout(imageTimer); imageTimer = null; }

  // Destruir player anterior si existe
  if (ytPlayer) {
    try { ytPlayer.destroy(); } catch(e) {}
    ytPlayer = null;
    ytContainer.innerHTML = '<div id="yt-player"></div>';
  }

  if (item.type === 'image') {
    img.src = item.file;
    img.alt = item.title;
    img.style.display = 'block';
    // Autoavance a los 20 segundos
    imageTimer = setTimeout(() => goTo(currentIndex + 1), 15000);

  } else if (item.type === 'video-youtube') {
    ytContainer.style.display = 'block';

    if (ytAPIReady) {
      ytPlayer = new YT.Player('yt-player', {
        videoId: item.youtube_video_id,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1
        },
        events: {
          onStateChange: (e) => {
            // Cuando termina el video, pasa al siguiente
            if (e.data === YT.PlayerState.ENDED) {
              goTo(currentIndex + 1);
            }
          }
        }
      });
    }

  } else if (item.type === 'video-local') {
    vid.src = item.file;
    vid.style.display = 'block';
    vid.play();
    vid.onended = () => goTo(currentIndex + 1);
  }

  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('flyer-lightbox');
  const vid = document.getElementById('lightbox-video');
  const ytContainer = document.getElementById('yt-player-container');

  lb.classList.remove('active');
  vid.pause();
  vid.src = '';

  if (imageTimer) { clearTimeout(imageTimer); imageTimer = null; }

  if (ytPlayer) {
    try { ytPlayer.destroy(); } catch(e) {}
    ytPlayer = null;
    ytContainer.innerHTML = '<div id="yt-player"></div>';
  }

  ytContainer.style.display = 'none';
  document.body.style.overflow = '';
  currentIndex = -1;
}
