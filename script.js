let player; // YouTube player
let bovinosData = [];
let youtubeAPIReady = false;
let domLoaded = false;

/** -------- Config: orden exacto de categorías -------- */
const ORDERED_CATEGORIES = [
  "AGENDA DE ACTIVIDADES",
  "ACTIVIDADES ESPECIALES",
  "REMATES DE LA 83 EXPOANGUS DE OTOÑO"
];

/** ---------------- YouTube API ---------------- */
function onYouTubeIframeAPIReady() {
  youtubeAPIReady = true;
  checkAndInitializeApp();
}

document.addEventListener('DOMContentLoaded', async () => {
  domLoaded = true;

  try {
    const response = await fetch('bovinos_youtube_data.json');
    bovinosData = await response.json();
  } catch (error) {
    console.error(error);
    alert("No se pudieron cargar los datos de 'bovinos_youtube_data.json'.");
    return;
  }

  renderSectionsByCategory(bovinosData);
  buildCategoriesNav(bovinosData);
  checkAndInitializeApp();
});

function checkAndInitializeApp() {
  // Sólo inicializar YouTube si hay algún item de tipo video
  const firstVideo = bovinosData.find(b => b.type === 'video' && b.youtube_video_id);
  if (domLoaded && youtubeAPIReady && firstVideo) {
    playYouTubeVideo(firstVideo.youtube_video_id);
  } else if (domLoaded && !firstVideo) {
    // Si no hay videos, ocultar el player container
    const playerContainer = document.querySelector('.video-player-container');
    if (playerContainer) playerContainer.style.display = 'none';
  }
}

/** --------------- Agrupar y Render --------------- */
function groupByCategory(items) {
  const groups = new Map();
  for (const it of items) {
    const cat = (it.category ?? "SIN CATEGORÍA").toString().trim();
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
  const finalOrder = [...orderedFirst, ...remaining];

  for (const cat of finalOrder) {
    const arr = groups.get(cat) || [];
    const sectionId = slugify(cat);

    const section = document.createElement('section');
    section.className = 'category-section';
    section.id = sectionId;

    const h2 = document.createElement('h2');
    h2.className = 'category-title';
    h2.textContent = cat;

    const grid = document.createElement('div');
    grid.className = 'category-grid';

    for (const item of arr) {
      const card = createCard(item);
      if (card) grid.appendChild(card);
    }

    section.appendChild(h2);
    section.appendChild(grid);
    container.appendChild(section);
  }
}

/**
 * Crea una card según el tipo del item:
 *  - type === 'image'  → muestra el flyer directamente (9:16)
 *  - type === 'video'  → thumbnail clickeable que reproduce en el player
 */
function createCard(item) {
  if (item.type === 'image' && item.image) {
    const card = document.createElement('div');
    card.className = 'bovino-item bovino-item--flyer';

    card.innerHTML = `
      <div class="flyer-wrapper">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
      </div>
      <h3>${item.title}</h3>
    `;

    // Click abre el flyer en pantalla completa (lightbox simple)
    card.addEventListener('click', () => openLightbox(item.image, item.title));

    return card;
  }

  if (item.type === 'video' && item.thumbnail_image && item.youtube_video_id) {
    const card = document.createElement('div');
    card.className = 'bovino-item';
    card.dataset.videoId = item.youtube_video_id;

    card.innerHTML = `
      <img src="${item.thumbnail_image}" alt="${item.title}">
      <h3>${item.title}</h3>
    `;

    card.addEventListener('click', () => {
      playYouTubeVideo(item.youtube_video_id);
      scrollToTop();
    });

    return card;
  }

  return null; // item inválido → ignorar
}

function buildCategoriesNav(items) {
  const nav = document.getElementById('categories-nav');
  nav.innerHTML = '';

  const groups = groupByCategory(items);

  const allKeys = Array.from(groups.keys());
  const orderedFirst = ORDERED_CATEGORIES.filter(c => allKeys.includes(c));
  const remaining = allKeys.filter(k => !ORDERED_CATEGORIES.includes(k)).sort((a, b) => a.localeCompare(b));
  const finalOrder = [...orderedFirst, ...remaining];

  for (const cat of finalOrder) {
    const a = document.createElement('a');
    a.href = `#${slugify(cat)}`;
    a.textContent = `${cat} (${groups.get(cat).length})`;
    nav.appendChild(a);
  }
}

function slugify(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** --------------- Lightbox para flyers --------------- */
function openLightbox(src, title) {
  // Crear overlay si no existe
  let overlay = document.getElementById('flyer-lightbox');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'flyer-lightbox';
    overlay.innerHTML = `
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Cerrar">✕</button>
        <img class="lightbox-img" src="" alt="">
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
    overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
  }

  overlay.querySelector('.lightbox-img').src = src;
  overlay.querySelector('.lightbox-img').alt = title;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const overlay = document.getElementById('flyer-lightbox');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/** --------------- Player YouTube --------------- */
function playYouTubeVideo(videoId) {
  if (typeof YT !== 'undefined' && YT.Player) {
    if (!player) {
      player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: {
          controls: 0, rel: 0, showinfo: 0, modestbranding: 1,
          mute: 1, loop: 1, fs: 0, autoplay: 1, playlist: videoId
        },
        events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange }
      });
    } else {
      player.loadVideoById({ videoId, playlist: videoId });
    }
  } else {
    console.warn("La API de YouTube no está cargada aún.");
  }
}

function onPlayerReady(e) { e.target.playVideo(); }
function onPlayerStateChange(e) { if (e.data === YT.PlayerState.ENDED) player.playVideo(); }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }