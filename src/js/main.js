import { initMap } from './modules/map.js';
import { initWeather } from './modules/weather.js';
import { fetchTicketmasterEvents } from './utils/api.js';
import { normalizeEvent } from './utils/ticketmaster.js';
import { renderEvents } from './modules/events.js';
import { initFilters } from './modules/filters.js';
import { husumEvent } from './data/husumEvent.js';
import { loadPartial } from './utils/loadPartial.js';

const BASE = '/veranstaltungen-deutschland';

const loadPartials = async () => {
  await Promise.all([
    loadPartial('#header', `${BASE}/partials/header.html`),
    loadPartial('#hero', `${BASE}/partials/hero.html`),
    loadPartial('#events', `${BASE}/partials/events.html`),
    loadPartial('#map', `${BASE}/partials/map.html`),
    loadPartial('#weather', `${BASE}/partials/weather.html`),
    loadPartial('#footer', `${BASE}/partials/footer.html`),
  ]);
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();

  try {
    // Load and normalize events from Ticketmaster
    const rawEvents = await fetchTicketmasterEvents('', 6);
    const allEvents = await Promise.all(rawEvents.map((e, i) => normalizeEvent(e, i)));

    const seen = new Set();
    const uniqueEvents = allEvents.filter((event) => {
      const key = `${event.title}|${event.dateRaw}|${event.region}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = uniqueEvents.filter((event) => {
      const eventDate = new Date(event.dateRaw + 'T00:00:00');
      return isNaN(eventDate) || eventDate >= today;
    });

    events.push(husumEvent);

    // Initialize filters
    initFilters(events);

    // Render events and map with the same data
    renderEvents(events);
    initMap(events);

    // Initialize weather independently
    await initWeather();
  } catch (error) {
    console.error('Unexpected error on main page:', error);
  }
});
