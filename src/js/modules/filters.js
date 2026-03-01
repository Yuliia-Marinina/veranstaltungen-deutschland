import { renderEvents } from './events.js';

let allEvents = [];

const FILTER_IDS = {
  search: 'filters-search',
  city: 'filters-city',
  category: 'filters-category',
  sort: 'filters-sort',
  reset: 'filters-reset',
};

const FILTER_DEFAULTS = {
  [FILTER_IDS.search]: '',
  [FILTER_IDS.city]: '',
  [FILTER_IDS.category]: '',
  [FILTER_IDS.sort]: 'date-asc',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getById = (id) => {
  const el = document.getElementById(id);
  if (!el && import.meta.env?.DEV) console.warn(`[filters] Element #${id} not found`);
  return el;
};

const getValue = (id) => getById(id)?.value || '';

const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// ─── Init ─────────────────────────────────────────────────────────────────────

export const initFilters = (events) => {
  if (!events?.length) return;

  allEvents = [...events];

  populateSelect(FILTER_IDS.city, getUniqueValues(events, 'region'));
  populateSelect(FILTER_IDS.category, getUniqueValues(events, 'tags'));

  getById(FILTER_IDS.search)?.addEventListener('input', debounce(applyFilters));
  getById(FILTER_IDS.city)?.addEventListener('change', applyFilters);
  getById(FILTER_IDS.category)?.addEventListener('change', applyFilters);
  getById(FILTER_IDS.sort)?.addEventListener('change', applyFilters);
  getById(FILTER_IDS.reset)?.addEventListener('click', resetFilters);
};

// ─── Unique values ────────────────────────────────────────────────────────────

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

// ─── Filter ───────────────────────────────────────────────────────────────────

const applyFilters = () => {
  const search = getValue(FILTER_IDS.search).toLowerCase().trim();
  const city = getValue(FILTER_IDS.city);
  const category = getValue(FILTER_IDS.category);
  const sort = getValue(FILTER_IDS.sort) || 'date-asc';

  let filtered = [...allEvents];

  if (search) {
    filtered = filtered.filter(
      (e) =>
        e.title?.toLowerCase().includes(search) ||
        e.description?.toLowerCase().includes(search) ||
        e.region?.toLowerCase().includes(search),
    );
  }

  if (city) filtered = filtered.filter((e) => e.region === city);
  if (category) filtered = filtered.filter((e) => e.tags?.includes(category));

  filtered = sortEvents(filtered, sort);
  renderEvents(filtered, resetFilters);
};

// ─── Sort ─────────────────────────────────────────────────────────────────────

const sortEvents = (events, sort) =>
  [...events].sort((a, b) => {
    switch (sort) {
      case 'date-asc':
        return new Date(a.dateFrom || 0) - new Date(b.dateFrom || 0);
      case 'date-desc':
        return new Date(b.dateFrom || 0) - new Date(a.dateFrom || 0);
      case 'name-asc':
        return (a.title ?? '').localeCompare(b.title ?? '', 'de');
      case 'name-desc':
        return (b.title ?? '').localeCompare(a.title ?? '', 'de');
      default:
        return 0;
    }
  });

// ─── Reset ────────────────────────────────────────────────────────────────────

const resetFilters = () => {
  Object.entries(FILTER_DEFAULTS).forEach(([id, value]) => {
    const el = getById(id);
    if (el) el.value = value;
  });
  renderEvents(allEvents);
};
