// Render events cards on main page
export const renderEvents = (events) => {
  const container = document.getElementById('events-grid');
  if (!container) return;

  container.innerHTML = '';

  if (events.length === 0) {
    container.innerHTML = `
      <p class="events-empty">Keine Veranstaltungen gefunden.</p>
    `;
    return;
  }

  // Create card for each event
  events.forEach((event) => {
    const card = document.createElement('div');
    card.className = 'card';

    // Truncate description to 100 characters
    const shortDesc =
      event.description?.length > 100
        ? `${event.description.substring(0, 100)}...`
        : event.description || '';

    card.innerHTML = `
      <div class="card-image">
        <img
          src="${event.image}"
          alt="${event.title}"
          onerror="this.src='https://picsum.photos/400/200?random=${event.id}'"
        />
        <span class="card-badge">${event.region}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${event.title}</h3>
        <p class="card-date">📅 ${event.date}</p>
        <p class="card-text">${shortDesc}</p>
        <a href="event-detail.html?id=${event.id}" class="btn btn-primary card-btn">
          Mehr erfahren
        </a>
      </div>
    `;

    container.appendChild(card);
  });
};
