let player; // YouTube player
let bovinosData = [];
let youtubeAPIReady = false;
let domLoaded = false;

/** -------- Config: orden exacto de categorías (usa los textos tal cual en tu JSON) -------- */
const ORDERED_CATEGORIES = [
  "VAQUILLONAS CON CRÍA P.C.",
  "VACAS CON CRÍA P.C.",
  "VAQUILLONAS CON CRÍA P.C. Y M.A.S.",
  "VAQUILLONAS CON CRÍA GRAL.",
  "VACA CON CRÍA GRAL.",
  "VAQUILLONAS PREÑADAS M.A.S.",
  "VACAS PREÑADAS M.A.S.",
  "VAQUILLONAS PREÑADAS M.A.S.",
  "VACAS PREÑADAS M.A.S.",
  "VAQUILLONAS PREÑADAS M.A.S.",
  "VACAS PREÑADAS M.A.S.",
  "VAQUILLONAS PREÑADAS M.A.S.",
  "VACAS PREÑADAS M.A.S.",
  "VAQUILLONAS PREÑADAS GRAL.",
  "VACAS PREÑADAS GRAL.",
  "VAQUILLONAS SIN SERVICIO P.C.",
  "FAENA",
  "VACAS VACÍAS",
  "TERNEROS",
  "TERNEROS A TÉRMINO",
  "TERNEROS Y TERNERAS",
  "TERNERAS",
  "TERNERAS A TÉRMINO",
  "VAQUILLONAS P/ENTORAR",
  "VAQUILLONAS PREÑADAS",
  "VACA PREÑADA",
  "VAQUILLONAS C/CRÍAS",
  "VACAS C/CRÍAS",
  "VACAS CUT PREÑADAS",
  "VACAS CUT C/CRÍAS",
  "SIN CATEGORÍA",
];

/** ---------------- YouTube API ---------------- */
function onYouTubeIframeAPIReady() {
  youtubeAPIReady = true;
  checkAndInitializeApp();
}

document.addEventListener('DOMContentLoaded', async () => {
  domLoaded = true;

  try {
    const response = await fetch('bovinos_youtube_data.json'); // tu JSON con "category"
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
  if (domLoaded && youtubeAPIReady && bovinosData.length > 0) {
    playYouTubeVideo(bovinosData[0].youtube_video_id);
  }
}

/** --------------- Agrupar y Render --------------- */
function groupByCategory(items) {
  const groups = new Map(); // key: categoría exacta, value: array de items
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

  // Ordenar categorías: primero las del ORDERED_CATEGORIES (en ese orden),
  // luego cualquier otra categoría que aparezca, por orden alfabético.
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

    for (const bovino of arr) {
      if (!bovino.thumbnail_image || !bovino.youtube_video_id) continue;

      const card = document.createElement('div');
      card.className = 'bovino-item';
      card.dataset.videoId = bovino.youtube_video_id;

      card.innerHTML = `
        <img src="${bovino.thumbnail_image}" alt="${bovino.name}">
        <h3>${bovino.name}</h3>
      `;

      card.addEventListener('click', () => {
        playYouTubeVideo(bovino.youtube_video_id);
        scrollToTop();
      });

      grid.appendChild(card);
    }

    section.appendChild(h2);
    section.appendChild(grid);
    container.appendChild(section);
  }
}

function buildCategoriesNav(items) {
  const nav = document.getElementById('categories-nav');
  nav.innerHTML = '';

  const groups = groupByCategory(items);
  const keys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  for (const cat of keys) {
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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sólo para el id/anchor
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** --------------- Player YouTube (igual que tenías) --------------- */
function playYouTubeVideo(videoId) {
  if (typeof YT !== 'undefined' && YT.Player) {
    if (!player) {
      player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: {
          controls: 0, rel: 0, showinfo: 0, modestbranding: 1, mute: 1, loop: 1, fs: 0, autoplay: 1,
          playlist: videoId
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