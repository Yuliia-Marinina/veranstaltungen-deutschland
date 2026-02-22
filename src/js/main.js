import { initMap } from './modules/map.js';
import { initWeather } from './modules/weather.js';
import { fetchTicketmasterEvents } from './utils/api.js';
import { normalizeEvent } from './utils/ticketmaster.js';
import { renderEvents } from './modules/events.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load and normalize events from Ticketmaster
    const rawEvents = await fetchTicketmasterEvents('', 6);
    const events = await Promise.all(rawEvents.map((e, i) => normalizeEvent(e, i)));

    // Render events and map with the same data
    renderEvents(events);
    initMap(events);

    // Initialize weather independently
    await initWeather();
  } catch (error) {
    console.error('Unexpected error on main page:', error);
  }
});
