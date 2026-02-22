import {
  fetchWeather,
  getUserLocation,
  fetchWaterStations,
  fetchWaterLevels,
} from '../utils/api.js';
import {
  getWeatherIcon,
  getWeatherDescription,
  formatWeekday,
  formatDate,
  getWaterStatus,
  getWaterDescription,
} from '../utils/helpers.js';

// Store chart instance to destroy before re-creating
let waterChart = null;

// Show every Nth measurement to avoid too many chart points
const CHART_SAMPLE_RATE = 10;

// ─── Initialization ───────────────────────────────────────────────────────────

export const initWeather = async () => {
  try {
    const location = await getUserLocation();

    const locationEl = document.querySelector('.weather-location-name');
    if (locationEl) locationEl.textContent = `${location.city || 'Berlin'}, Germany`;

    const [weatherData, stations] = await Promise.all([
      fetchWeather(location.lat, location.lng),
      fetchWaterStations(),
    ]);

    if (!weatherData?.daily) {
      showError('Wetterdaten nicht verfügbar');
      return;
    }

    // Find station by shortname, fall back to first station
    const station = stations?.find((s) => s.shortname === 'DRESDEN') ?? stations?.[0];
    const measurements = station ? await fetchWaterLevels(station.uuid) : null;

    const waterByDay = buildWaterByDay(measurements);

    renderCards(weatherData.daily, waterByDay);

    if (measurements) renderWaterChart(measurements);
  } catch (error) {
    console.error('Error initializing weather:', error);
    showError('Fehler beim Laden der Wetterdaten');
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const showError = (message = 'Daten nicht verfügbar') => {
  const container = document.getElementById('weather-cards');
  if (container) container.innerHTML = `<p class="weather-error">${message}</p>`;
};

// Build map of date → water level from measurements
const buildWaterByDay = (measurements) => {
  if (!measurements) return {};

  return measurements.reduce((map, m) => {
    const date = m.timestamp.split('T')[0];
    map[date] = Math.round(m.value);
    return map;
  }, {});
};

// ─── Cards ────────────────────────────────────────────────────────────────────

const renderCards = (daily, waterByDay) => {
  const container = document.getElementById('weather-cards');
  if (!container) return;

  // Get last known water level for future days without data
  const lastKnownLevel = waterByDay[Object.keys(waterByDay).at(-1)] ?? null;

  const fragment = document.createDocumentFragment();

  daily.time.forEach((date, index) => {
    fragment.appendChild(createCard(daily, waterByDay, date, index, lastKnownLevel));
  });

  container.innerHTML = '';
  container.appendChild(fragment);
};

const createCard = (daily, waterByDay, date, index, lastKnownLevel) => {
  const isToday = index === 0;
  const code = daily.weathercode[index];
  const maxTemp = Math.round(daily.temperature_2m_max[index]);
  const minTemp = Math.round(daily.temperature_2m_min[index]);

  const waterLevel = waterByDay[date] ?? lastKnownLevel;
  const isApprox = !waterByDay[date] && waterLevel !== null;
  const status = waterLevel !== null ? getWaterStatus(waterLevel) : null;

  const card = document.createElement('div');
  card.className = `weather-card${isToday ? ' weather-card-today' : ''}`;
  card.innerHTML = buildCardHTML({
    isToday,
    date,
    code,
    maxTemp,
    minTemp,
    waterLevel,
    isApprox,
    status,
  });

  return card;
};

const buildCardHTML = ({ isToday, date, code, maxTemp, minTemp, waterLevel, isApprox, status }) => `
  <div class="weather-card-header">
    <p class="weather-card-day">${isToday ? 'Heute' : formatWeekday(date)}</p>
    <p class="weather-card-date">${formatDate(date)}</p>
  </div>

  <div class="weather-card-weather">
    <p class="weather-card-icon">${getWeatherIcon(code)}</p>
    <p class="weather-card-temp-max">${maxTemp}°</p>
    <p class="weather-card-temp-min">${minTemp}°</p>
    <p class="weather-card-desc">${getWeatherDescription(code)}</p>
  </div>

  <div class="weather-card-divider"></div>

  <div class="weather-card-water">
    <p class="weather-card-water-icon">🌊</p>
    <p class="weather-card-water-level">${waterLevel !== null ? `${isApprox ? '~' : ''}${waterLevel} cm` : '—'}</p>
    ${
      status
        ? `
      <span class="weather-card-water-badge" style="color: ${status.color}">${status.text}</span>
      <p class="weather-card-water-desc">${isApprox ? 'Letzter bekannter Stand' : getWaterDescription(status.text)}</p>
    `
        : '<p class="weather-card-water-desc">Keine Wasserdaten</p>'
    }
  </div>
`;

// ─── Chart ────────────────────────────────────────────────────────────────────

const buildChartConfig = (labels, values) => ({
  type: 'line',
  data: {
    labels,
    datasets: [
      {
        label: 'Wasserstand (cm)',
        data: values,
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointRadius: 3,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.8)', maxTicksLimit: 7 },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        ticks: { color: 'rgba(255,255,255,0.8)', callback: (v) => `${v} cm` },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  },
});

const renderWaterChart = (measurements) => {
  const ctx = document.getElementById('water-chart-canvas');
  if (!ctx) return;

  // Sample measurements to reduce chart points
  const filtered = measurements.filter((_, i) => i % CHART_SAMPLE_RATE === 0);
  const labels = filtered.map((m) => formatDate(m.timestamp));
  const values = filtered.map((m) => Math.round(m.value));

  if (waterChart) waterChart.destroy();

  waterChart = new Chart(ctx, buildChartConfig(labels, values));
};
