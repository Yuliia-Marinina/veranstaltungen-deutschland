import { initMap } from './modules/map.js';
import { initWeather } from './modules/weather.js';
import { fetchTicketmasterEvents } from './utils/api.js';
import { normalizeEvent } from './utils/ticketmaster.js';
import { renderEvents } from './modules/events.js';
import { initFilters } from './modules/filters.js';
import { husumEvent } from './data/husumEvent.js';
import { loadPartial } from './utils/loadPartial.js';

const BASE = '/veranstaltungen-deutschland';

// ─── Partials ─────────────────────────────────────────────────────────────────

const loadPartials = async () => {
  await Promise.all([
    loadPartial('#header', `${BASE}/partials/header.html`),
    loadPartial('#hero', `${BASE}/partials/hero.html`),
    loadPartial('#events', `${BASE}/partials/events.html`),
    loadPartial('#map', `${BASE}/partials/map.html`),
    loadPartial('#weather', `${BASE}/partials/weather.html`),
    loadPartial('#footer', `${BASE}/partials/footer.html`),
  ]);

  // Filters depend on events partial being rendered first
  await loadPartial('#filters', `${BASE}/partials/filters.html`);
};

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();

  try {
    const rawEvents = await fetchTicketmasterEvents('', 12);
    const normalized = await Promise.all(rawEvents.map((e, i) => normalizeEvent(e, i)));

    // Deduplicate by title + date + region
    const seen = new Set();
    const unique = normalized.filter((event) => {
      const key = `${event.title}|${event.dateRaw}|${event.region}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter out past events (invalid dates are kept)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = unique.filter((event) => {
      const eventDate = new Date(event.dateRaw + 'T00:00:00');
      return isNaN(eventDate) || eventDate >= today;
    });

    events.push(husumEvent);

    initFilters(events);
    renderEvents(events);
    initMap(events);

    await initWeather();
  } catch (error) {
    console.error('main:', error.message);
  }
});
