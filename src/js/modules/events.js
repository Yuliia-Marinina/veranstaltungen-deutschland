// Helper: Escape HTML to prevent XSS attacks
const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
};

// Helper: Truncate text to a max length
const truncate = (text, max = 100) =>
  text?.length > max ? `${text.substring(0, max)}...` : text || '';

// Helper: Create a single event card
const createEventCard = (event) => {
  const card = document.createElement('div');
  card.className = 'card';

  const imageSrc = event.image || `https://picsum.photos/400/200?random=${event.id}`;
  const shortDesc = truncate(event.description);

  card.innerHTML = `
    <div class="card-image">
      <img
        src="${escapeHTML(imageSrc)}"
        alt="${escapeHTML(event.title)}"
        onerror="this.src='https://picsum.photos/400/200?random=${escapeHTML(String(event.id))}'"
      />
      <span class="card-badge">${escapeHTML(event.region)}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">${escapeHTML(event.title)}</h3>
      <p class="card-date">📅 ${escapeHTML(event.date)}</p>
      <p class="card-text">${escapeHTML(shortDesc)}</p>
      <a href="event-detail.html?id=${escapeHTML(String(event.id))}&tmid=${escapeHTML(event.ticketmasterId)}"
         class="btn btn-primary card-btn">
        Mehr erfahren
      </a>
    </div>
  `;

  return card;
};

// Render events cards on main page
export const renderEvents = (events) => {
  const container = document.getElementById('events-grid');
  if (!container) return;

  container.innerHTML = '';

  if (events.length === 0) {
    container.innerHTML = `<p class="events-empty">Keine Veranstaltungen gefunden.</p>`;
    return;
  }

  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  events.forEach((event) => fragment.appendChild(createEventCard(event)));
  container.appendChild(fragment);
};
