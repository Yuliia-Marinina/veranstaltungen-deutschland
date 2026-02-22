import { initMap } from './modules/map.js';
import { initWeather } from './modules/weather.js';
import { fetchTicketmasterEvents } from './utils/api.js';
import { normalizeEvent } from './utils/ticketmaster.js';
import { renderEvents } from './modules/events.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Load real events from Ticketmaster
  const rawEvents = await fetchTicketmasterEvents('', 6);
  const events = rawEvents.map((e, i) => normalizeEvent(e, i));

  // Render events on page
  renderEvents(events);

  // Initialize map with real events
  initMap(events);

  // Initialize weather
  await initWeather();
});
