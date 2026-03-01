import { formatDate, truncate, escapeHTML } from '../utils/utils.js';

const BASE = '/veranstaltungen-deutschland';

// ─── Card ─────────────────────────────────────────────────────────────────────

const createEventCard = (event) => {
  const card = document.createElement('article');
  card.className = 'events-card';

  // Image
  const img = document.createElement('img');
  img.src = event.image || `https://picsum.photos/400/300?random=${event.id}`;
  img.alt = event.title ?? '';
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    img.src = `https://picsum.photos/400/300?random=${event.id}`;
  });

  // Badge
  const badge = document.createElement('span');
  badge.className = 'events-card-badge';
  badge.textContent = event.region ?? '';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'events-card-image';
  imageWrap.append(img, badge);

  // Tags
  const tagsWrap = document.createElement('div');
  tagsWrap.className = 'events-card-tags';
  event.tags?.slice(0, 2).forEach((tag) => {
    const span = document.createElement('span');
    span.className = 'events-card-tag';
    span.textContent = tag;
    tagsWrap.appendChild(span);
  });

  // Title
  const title = document.createElement('h3');
  title.className = 'events-card-title';
  title.textContent = event.title ?? '';

  // Date meta
  const dateIcon = document.createElement('span');
  dateIcon.setAttribute('aria-hidden', 'true');
  dateIcon.textContent = '📅 ';

  const dateMeta = document.createElement('span');
  dateMeta.className = 'events-card-meta-item';
  dateMeta.append(dateIcon, formatDate(event.date));

  const meta = document.createElement('div');
  meta.className = 'events-card-meta';
  meta.appendChild(dateMeta);

  // Description
  const desc = document.createElement('p');
  desc.className = 'events-card-desc';
  desc.textContent = truncate(event.description, 120);

  // Button
  const btn = document.createElement('a');
  btn.href = `${BASE}/event-detail.html?id=${escapeHTML(String(event.id))}&tmid=${escapeHTML(event.ticketmasterId)}`;
  btn.className = 'events-card-btn btn btn-primary';
  btn.textContent = 'Mehr erfahren';
  btn.setAttribute('aria-label', `Mehr erfahren über ${event.title}`);

  // Body
  const body = document.createElement('div');
  body.className = 'events-card-body';
  body.append(tagsWrap, title, meta, desc, btn);

  card.append(imageWrap, body);
  return card;
};

// ─── Render ───────────────────────────────────────────────────────────────────

export const renderEvents = (events, onReset) => {
  const container = document.getElementById('events-grid');
  if (!container) return;

  container.innerHTML = '';

  if (!events.length) {
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '🔍 ';

    const text = document.createElement('span');
    text.textContent = 'Keine Veranstaltungen gefunden.';

    const empty = document.createElement('p');
    empty.className = 'events-empty-text';
    empty.append(icon, text);

    const wrapper = document.createElement('div');
    wrapper.className = 'events-empty';
    wrapper.appendChild(empty);

    if (onReset) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.textContent = 'Filter zurücksetzen';
      btn.addEventListener('click', onReset);
      wrapper.appendChild(btn);
    }

    container.appendChild(wrapper);
    return;
  }

  const fragment = document.createDocumentFragment();
  events.forEach((event) => fragment.appendChild(createEventCard(event)));
  container.appendChild(fragment);
};
