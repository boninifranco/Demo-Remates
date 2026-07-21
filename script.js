let bovinosData = [];

const ORDERED_CATEGORIES = [
  "AGENDA ANGUS",
  "EXPO RURAL 26"
];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('bovinos_youtube_data.json');
    bovinosData = await res.json();
  } catch (e) {
    console.error('Error cargando JSON:', e);
    alert("No se pudieron cargar los datos.");
    return;
  }

  renderSectionsByCategory(bovinosData);
  buildCategoriesNav(bovinosData);

  // Lightbox listeners
  document.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
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

    const verticales = arr.filter(i => i.orientation === 'vertical');
    const horizontales = arr.filter(i => i.orientation === 'horizontal');

    const section = document.createElement('section');
    section.className = 'category-section';
    section.id = slugify(cat);

    const h2 = document.createElement('h2');
    h2.className = 'category-title';
    h2.textContent = cat;
    section.appendChild(h2);

    if (verticales.length > 0) {
      const label = document.createElement('p');
      label.className = 'orientation-label';
      label.textContent = '▸ VERTICALES';
      section.appendChild(label);

      const grid = document.createElement('div');
      grid.className = 'category-grid category-grid--vertical';
      verticales.forEach(item => {
        const card = createCard(item);
        if (card) grid.appendChild(card);
      });
      section.appendChild(grid);
    }

    if (horizontales.length > 0) {
      const label = document.createElement('p');
      label.className = 'orientation-label';
      label.textContent = '▸ HORIZONTALES';
      section.appendChild(label);

      const grid = document.createElement('div');
      grid.className = 'category-grid category-grid--horizontal';
      horizontales.forEach(item => {
        const card = createCard(item);
        if (card) grid.appendChild(card);
      });
      section.appendChild(grid);
    }

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
  } else {
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

  card.addEventListener('click', () => openLightbox(item));
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

function openLightbox(item) {
  const lb = document.getElementById('flyer-lightbox');
  const vid = document.getElementById('lightbox-video');
  const img = document.getElementById('lightbox-img');

  if (item.type === 'image') {
    vid.style.display = 'none';
    vid.src = '';
    img.src = item.file;
    img.alt = item.title;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
    img.src = '';
    vid.src = item.file;
    vid.style.display = 'block';
    vid.play();
  }

  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('flyer-lightbox');
  const vid = document.getElementById('lightbox-video');
  lb.classList.remove('active');
  vid.pause();
  vid.src = '';
  document.body.style.overflow = '';
}
