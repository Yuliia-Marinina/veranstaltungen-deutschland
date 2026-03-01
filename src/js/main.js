import { initMap } from './modules/map.js';
import { initWeather } from './modules/weather.js';
import { fetchTicketmasterEvents } from './utils/api.js';
import { normalizeEvent } from './utils/ticketmaster.js';
import { renderEvents } from './modules/events.js';
import { initFilters } from './modules/filters.js';
import { husumEvent } from './data/husumEvent.js';
import { loadPartial } from './utils/loadPartial.js';

const BASE = '/veranstaltungen-deutschland';
const PAGE_SIZE = 6;

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
  await loadPartial('#filters', `${BASE}/partials/filters.html`);
  await loadPartial('#chart', `${BASE}/partials/chart.html`);
};

// ─── Load More ────────────────────────────────────────────────────────────────

const updateLoadMore = (shown, total) => {
  const count = document.getElementById('events-count');
  const btn = document.getElementById('events-load-more');
  if (count) count.textContent = `${shown} von ${total} Events angezeigt`;
  if (btn) btn.hidden = shown >= total;
};

const normalizeAndFilter = async (rawEvents, startIndex) => {
  const normalized = await Promise.all(rawEvents.map((e, i) => normalizeEvent(e, startIndex + i)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return normalized.filter((event) => {
    const eventDate = new Date(event.dateRaw + 'T00:00:00');
    return isNaN(eventDate) || eventDate >= today;
  });
};

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();

  try {
    let currentPage = 0;
    let allLoadedEvents = [];

    // Load first page
    const { events: rawEvents, total } = await fetchTicketmasterEvents('', PAGE_SIZE, currentPage);
    const firstPageEvents = await normalizeAndFilter(rawEvents, 0);

    allLoadedEvents = [...firstPageEvents, husumEvent];

    initFilters(allLoadedEvents);
    renderEvents(allLoadedEvents);
    initMap(allLoadedEvents);
    updateLoadMore(allLoadedEvents.length, total);

    // Load more button
    const btn = document.getElementById('events-load-more');
    btn?.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Wird geladen...';

      try {
        currentPage += 1;
        const { events: nextRaw } = await fetchTicketmasterEvents('', PAGE_SIZE, currentPage);
        const nextEvents = await normalizeAndFilter(nextRaw, allLoadedEvents.length);

        // Deduplicate against already loaded
        const seen = new Set(allLoadedEvents.map((e) => `${e.title}|${e.dateRaw}|${e.region}`));
        const unique = nextEvents.filter((e) => {
          const key = `${e.title}|${e.dateRaw}|${e.region}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        allLoadedEvents = [...allLoadedEvents, ...unique];

        initFilters(allLoadedEvents);
        renderEvents(allLoadedEvents);
        updateLoadMore(allLoadedEvents.length, total);
      } catch (error) {
        console.error('load more:', error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Weitere Events laden';
      }
    });

    await initWeather();
  } catch (error) {
    console.error('main:', error.message);
  }
});
