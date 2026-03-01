import Chart from 'chart.js/auto';
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
} from '../utils/utils.js';

let waterChart = null;

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

    const station = stations?.find((s) => s.shortname === 'DRESDEN') ?? stations?.[0];
    const measurements = station ? await fetchWaterLevels(station.uuid) : null;

    const waterByDay = buildWaterByDay(measurements);

    renderCards(weatherData.daily, waterByDay);

    if (measurements) renderWaterChart(measurements);
  } catch (error) {
    console.error('initWeather:', error.message);
    showError('Fehler beim Laden der Wetterdaten');
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const showError = (message = 'Daten nicht verfügbar') => {
  const container = document.getElementById('weather-cards');
  if (!container) return;
  const p = document.createElement('p');
  p.className = 'weather-error';
  p.textContent = message;
  container.replaceChildren(p);
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

  const lastKnownLevel = waterByDay[Object.keys(waterByDay).at(-1)] ?? null;
  const fragment = document.createDocumentFragment();

  daily.time.forEach((date, index) => {
    fragment.appendChild(createCard(daily, waterByDay, date, index, lastKnownLevel));
  });

  container.replaceChildren(fragment);
};

const createCard = (daily, waterByDay, date, index, lastKnownLevel) => {
  const isToday = index === 0;
  const code = daily.weathercode[index];
  const maxTemp = Math.round(daily.temperature_2m_max[index]);
  const minTemp = Math.round(daily.temperature_2m_min[index]);
  const waterLevel = waterByDay[date] ?? lastKnownLevel;
  const isApprox = !waterByDay[date] && waterLevel !== null;
  const status = waterLevel !== null ? getWaterStatus(waterLevel) : null;

  // ── Header ──
  const dayEl = document.createElement('p');
  dayEl.className = 'weather-card-day';
  dayEl.textContent = isToday ? 'Heute' : formatWeekday(date);

  const dateEl = document.createElement('p');
  dateEl.className = 'weather-card-date';
  dateEl.textContent = formatDate(date);

  const header = document.createElement('div');
  header.className = 'weather-card-header';
  header.append(dayEl, dateEl);

  // ── Weather ──
  const iconEl = document.createElement('p');
  iconEl.className = 'weather-card-icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = getWeatherIcon(code);

  const tempMax = document.createElement('p');
  tempMax.className = 'weather-card-temp-max';
  tempMax.textContent = `${maxTemp}°`;

  const tempMin = document.createElement('p');
  tempMin.className = 'weather-card-temp-min';
  tempMin.textContent = `${minTemp}°`;

  const descEl = document.createElement('p');
  descEl.className = 'weather-card-desc';
  descEl.textContent = getWeatherDescription(code);

  const weatherSection = document.createElement('div');
  weatherSection.className = 'weather-card-weather';
  weatherSection.append(iconEl, tempMax, tempMin, descEl);

  // ── Divider ──
  const divider = document.createElement('div');
  divider.className = 'weather-card-divider';

  // ── Water ──
  const waterIcon = document.createElement('p');
  waterIcon.className = 'weather-card-water-icon';
  waterIcon.setAttribute('aria-hidden', 'true');
  waterIcon.textContent = '🌊';

  const waterLevelEl = document.createElement('p');
  waterLevelEl.className = 'weather-card-water-level';
  waterLevelEl.textContent = waterLevel !== null ? `${isApprox ? '~' : ''}${waterLevel} cm` : '—';

  const waterSection = document.createElement('div');
  waterSection.className = 'weather-card-water';
  waterSection.append(waterIcon, waterLevelEl);

  if (status) {
    const badge = document.createElement('span');
    badge.className = `weather-card-water-badge ${status.className}`;
    badge.textContent = status.text;

    const waterDesc = document.createElement('p');
    waterDesc.className = 'weather-card-water-desc';
    waterDesc.textContent = isApprox ? 'Letzter bekannter Stand' : getWaterDescription(status.text);

    waterSection.append(badge, waterDesc);
  } else {
    const waterDesc = document.createElement('p');
    waterDesc.className = 'weather-card-water-desc';
    waterDesc.textContent = 'Keine Wasserdaten';
    waterSection.appendChild(waterDesc);
  }

  // ── Card ──
  const card = document.createElement('div');
  card.className = `weather-card${isToday ? ' weather-card-today' : ''}`;
  card.append(header, weatherSection, divider, waterSection);

  return card;
};

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

  const filtered = measurements.filter((_, i) => i % CHART_SAMPLE_RATE === 0);
  const labels = filtered.map((m) => formatDate(m.timestamp));
  const values = filtered.map((m) => Math.round(m.value));

  if (waterChart) waterChart.destroy();
  waterChart = new Chart(ctx, buildChartConfig(labels, values));
};
