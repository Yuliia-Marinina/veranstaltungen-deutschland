import { renderEvents } from './events.js';

let allEvents = [];

const FILTER_IDS = {
  search: 'filter-search',
  city: 'filter-city',
  category: 'filter-category',
  sort: 'filter-sort',
  reset: 'filter-reset',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getById = (id) => document.getElementById(id);
const getValue = (id) => getById(id)?.value || '';

// ─── Initialization ───────────────────────────────────────────────────────────

export const initFilters = (events) => {
  allEvents = events;

  populateSelect(FILTER_IDS.city, getUniqueValues(events, 'region'));
  populateSelect(FILTER_IDS.category, getUniqueValues(events, 'tags'));

  getById(FILTER_IDS.search)?.addEventListener('input', applyFilters);
  getById(FILTER_IDS.city)?.addEventListener('change', applyFilters);
  getById(FILTER_IDS.category)?.addEventListener('change', applyFilters);
  getById(FILTER_IDS.sort)?.addEventListener('change', applyFilters);
  getById(FILTER_IDS.reset)?.addEventListener('click', resetFilters);
};

// ─── Unique values ────────────────────────────────────────────────────────────

// Get unique values from events array for a given field
const getUniqueValues = (events, field) => {
  const values = events.flatMap((event) => {
    const val = event[field];
    if (Array.isArray(val)) return val;
    if (val) return [val];
    return [];
  });
  return [...new Set(values)].filter(Boolean).sort();
};

// ─── Select population ────────────────────────────────────────────────────────

const populateSelect = (id, values) => {
  const select = getById(id);
  if (!select) return;

  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
};

// ─── Filtering ────────────────────────────────────────────────────────────────

const applyFilters = () => {
  const search = getValue(FILTER_IDS.search).toLowerCase().trim();
  const city = getValue(FILTER_IDS.city);
  const category = getValue(FILTER_IDS.category);
  const sort = getValue(FILTER_IDS.sort) || 'date-asc';

  let filtered = [...allEvents];

  if (search) {
    filtered = filtered.filter(
      (event) =>
        event.title?.toLowerCase().includes(search) ||
        event.description?.toLowerCase().includes(search),
    );
  }

  if (city) filtered = filtered.filter((event) => event.region === city);
  if (category) filtered = filtered.filter((event) => event.tags?.includes(category));

  filtered = sortEvents(filtered, sort);

  if (filtered.length === 0) {
    renderEmptyState();
    return;
  }

  renderEvents(filtered);
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const renderEmptyState = () => {
  const container = getById('events-grid');
  if (!container) return;

  // Use addEventListener instead of onclick to avoid XSS
  const text = document.createElement('p');
  text.className = 'events-empty-text';
  text.textContent = '🔍 Keine Veranstaltungen gefunden.';

  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary';
  btn.textContent = 'Filter zurücksetzen';
  btn.addEventListener('click', resetFilters);

  const wrapper = document.createElement('div');
  wrapper.className = 'events-empty';
  wrapper.appendChild(text);
  wrapper.appendChild(btn);

  container.innerHTML = '';
  container.appendChild(wrapper);
};

// ─── Sorting ──────────────────────────────────────────────────────────────────

const sortEvents = (events, sort) => {
  return [...events].sort((a, b) => {
    switch (sort) {
      case 'date-asc':
        return new Date(a.dateFrom || 0) - new Date(b.dateFrom || 0);
      case 'date-desc':
        return new Date(b.dateFrom || 0) - new Date(a.dateFrom || 0);
      case 'name-asc':
        return a.title.localeCompare(b.title, 'de');
      case 'name-desc':
        return b.title.localeCompare(a.title, 'de');
      default:
        return 0;
    }
  });
};

// ─── Reset ────────────────────────────────────────────────────────────────────

const resetFilters = () => {
  [FILTER_IDS.search, FILTER_IDS.city, FILTER_IDS.category].forEach((id) => {
    const el = getById(id);
    if (el) el.value = '';
  });

  const sortEl = getById(FILTER_IDS.sort);
  if (sortEl) sortEl.value = 'date-asc';

  renderEvents(allEvents);
};
