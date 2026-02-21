// Weather code ranges mapped to icons and descriptions
const WEATHER_MAP = [
  { max: 0, icon: '☀️', desc: 'Klarer Himmel' },
  { max: 2, icon: '⛅', desc: 'Teilweise bewölkt' },
  { max: 3, icon: '☁️', desc: 'Bewölkt' },
  { max: 48, icon: '🌫️', desc: 'Neblig' },
  { max: 67, icon: '🌧️', desc: 'Regen' },
  { max: 77, icon: '❄️', desc: 'Schnee' },
  { max: 82, icon: '🌦️', desc: 'Schauer' },
  { max: 99, icon: '⛈️', desc: 'Gewitter' },
];

// Find weather data by code
const getWeatherInfo = (code) =>
  WEATHER_MAP.find(({ max }) => code <= max) ?? { icon: '🌤️', desc: 'Wechselhaft' };

export const getWeatherIcon = (code) => getWeatherInfo(code).icon;
export const getWeatherDescription = (code) => getWeatherInfo(code).desc;

// Format date string to German weekday short name
// Example: '2026-02-20' → 'Fr'
export const formatWeekday = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { weekday: 'short' });
};

// Format date string to German short date
// Example: '2026-02-20' → '20.02'
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

// Get water level status based on level in cm
// Returns object with text and color
export const getWaterStatus = (level) => {
  if (level > 500) return { text: 'Hoch', color: '#f57c00' };
  if (level < 100) return { text: 'Niedrig', color: '#1a73e8' };
  return { text: 'Normal', color: '#2e7d32' };
};
