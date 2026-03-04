// ─── HTML ─────────────────────────────────────────────────────────────────────

export const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
};

// ─── Date ─────────────────────────────────────────────────────────────────────

// Returns "12. März 2025" — falls back to original string if date is invalid
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr ?? '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatWeekday = (dateStr) =>
  new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short' });

// ─── Text ─────────────────────────────────────────────────────────────────────

// Truncates at last word boundary; hard-cuts if no space found before max
export const truncate = (text, max = 100) => {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(' ', max);
  return (cut > 0 ? text.substring(0, cut) : text.substring(0, max)) + '…';
};

// ─── Weather ──────────────────────────────────────────────────────────────────

const WEATHER_MAP = [
  { max: 0, desc: 'Klarer Himmel' },
  { max: 2, desc: 'Teilweise bewölkt' },
  { max: 3, desc: 'Bewölkt' },
  { max: 48, desc: 'Neblig' },
  { max: 67, desc: 'Regen' },
  { max: 77, desc: 'Schnee' },
  { max: 82, desc: 'Schauer' },
  { max: 99, desc: 'Gewitter' },
];

export const getWeatherDescription = (code) =>
  WEATHER_MAP.find(({ max }) => code <= max)?.desc ?? 'Wechselhaft';

// ─── Water ────────────────────────────────────────────────────────────────────

const WATER_HIGH = 500;
const WATER_LOW = 100;

// Returns text + className for CSS-based styling (no inline colors)
export const getWaterStatus = (level) => {
  if (level > WATER_HIGH) return { text: 'Hoch', className: 'water-status--high' };
  if (level < WATER_LOW) return { text: 'Niedrig', className: 'water-status--low' };
  return { text: 'Normal', className: 'water-status--normal' };
};

export const getWaterDescription = (status) => {
  const map = {
    Hoch: 'Der Wasserstand ist erhöht. Bitte beachten Sie die aktuellen Warnungen.',
    Niedrig: 'Der Wasserstand ist niedrig. Einschränkungen möglich.',
    Normal: 'Der Wasserstand ist im normalen Bereich. Keine Beeinträchtigungen erwartet.',
  };
  return map[status] ?? '';
};
