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
} from '../utils/helpers.js';

let waterChart = null;

export const initWeather = async () => {
  try {
    // Get user location
    const location = await getUserLocation();

    // Update city name
    const locationEl = document.querySelector('.weather-location-name');
    if (locationEl) locationEl.textContent = `${location.city || 'Berlin'}, Germany`;

    // Fetch weather and water data in parallel
    const [weatherData, stations] = await Promise.all([
      fetchWeather(location.lat, location.lng),
      fetchWaterStations(),
    ]);

    if (!weatherData || !weatherData.daily) return;

    // Get water measurements
    const station = stations?.find((s) => s.shortname === 'DRESDEN') || stations?.[0];
    const measurements = station ? await fetchWaterLevels(station.uuid) : null;

    // Build daily water level map
    const waterByDay = buildWaterByDay(measurements);

    // Render cards
    renderCards(weatherData.daily, waterByDay);

    // Render chart
    if (measurements) renderWaterChart(measurements);
  } catch (error) {
    console.error('Error initializing weather:', error);
  }
};

// Build map of date -> water level
const buildWaterByDay = (measurements) => {
  if (!measurements) return {};

  const map = {};
  measurements.forEach((m) => {
    const date = m.timestamp.split('T')[0];
    map[date] = Math.round(m.value);
  });
  return map;
};

// Water level description
const getWaterDescription = (status) => {
  const descriptions = {
    Hoch: 'Erhöhter Wasserstand',
    Niedrig: 'Niedriger Wasserstand',
    Normal: 'Normaler Wasserstand',
  };
  return descriptions[status] || '';
};

// Render 7 day cards
const renderCards = (daily, waterByDay) => {
  const container = document.getElementById('weather-cards');
  if (!container) return;

  container.innerHTML = '';

  // Get last known water level for future days
  const lastKnownLevel = waterByDay[Object.keys(waterByDay).at(-1)];

  daily.time.forEach((date, index) => {
    const isToday = index === 0;
    const code = daily.weathercode[index];
    const maxTemp = Math.round(daily.temperature_2m_max[index]);
    const minTemp = Math.round(daily.temperature_2m_min[index]);

    // Real or approximate water level
    const waterLevel = waterByDay[date] || lastKnownLevel;
    const isApprox = !waterByDay[date] && !!lastKnownLevel;
    const status = waterLevel ? getWaterStatus(waterLevel) : null;

    const card = document.createElement('div');
    card.className = `weather-card ${isToday ? 'weather-card-today' : ''}`;

    card.innerHTML = `
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
            <p class="weather-card-water-level">
            ${isApprox ? '~' : ''}${waterLevel} cm
            </p>
            <span class="weather-card-water-badge" style="color: ${status.color}">
            ${status.text}
            </span>
            <p class="weather-card-water-desc">
            ${isApprox ? 'Letzter bekannter Stand' : getWaterDescription(status.text)}
            </p>
        </div>
        `;

    container.appendChild(card);
  });
};

// Render chart
const renderWaterChart = (measurements) => {
  const ctx = document.getElementById('water-chart-canvas');
  if (!ctx) return;

  const filtered = measurements.filter((_, i) => i % 10 === 0);
  const labels = filtered.map((m) => formatDate(m.timestamp));
  const values = filtered.map((m) => Math.round(m.value));

  if (waterChart) waterChart.destroy();

  waterChart = new Chart(ctx, {
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
          ticks: {
            color: 'rgba(255,255,255,0.8)',
            callback: (v) => `${v} cm`,
          },
          grid: { color: 'rgba(255,255,255,0.1)' },
        },
      },
    },
  });
};
