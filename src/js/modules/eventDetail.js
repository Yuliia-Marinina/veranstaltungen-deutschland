import { events } from '../data/events.js';
import { fetchWeather, fetchWaterStations, fetchWaterLevels } from '../utils/api.js';
import {
  getWeatherIcon,
  getWeatherDescription,
  formatWeekday,
  formatDate,
  getWaterStatus,
} from '../utils/helpers.js';

// Initialize event detail page
export const initEventDetail = async () => {
  try {
    // Get event id from URL
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));

    // Find event in array
    const event = events.find((e) => e.id === id);

    // If event not found - show error
    if (!event) {
      document.getElementById('detail-title').textContent = 'Veranstaltung nicht gefunden';
      return;
    }

    // Fill page with event data
    renderEventInfo(event);

    // Initialize map
    initDetailMap(event);

    // Load weather for event region
    await loadEventWeather(event);
  } catch (error) {
    console.error('Error initializing event detail:', error);
  }
};

// Fill page with event data
const renderEventInfo = (event) => {
  // Hero
  document.getElementById('detail-image').src = event.image;
  document.getElementById('detail-image').alt = event.title;
  document.getElementById('detail-title').textContent = event.title;
  document.getElementById('detail-date').textContent = event.date;
  document.getElementById('detail-region').textContent = event.region;
  document.getElementById('detail-time').textContent = event.time;

  // Tags
  const tagsEl = document.getElementById('detail-tags');
  tagsEl.innerHTML = event.tags.map((tag) => `<span class="detail-tag">${tag}</span>`).join('');

  // Description
  document.getElementById('detail-description').textContent = event.description;
  document.getElementById('detail-address').textContent = event.address;

  // Info card
  document.getElementById('detail-card-date').textContent = event.date;
  document.getElementById('detail-card-time').textContent = event.time;
  document.getElementById('detail-card-region').textContent = event.region;
  document.getElementById('detail-card-address').textContent = event.address;

  // Page title
  document.title = `${event.title} — Events in Germany`;
};

// Initialize map with single marker
const initDetailMap = (event) => {
  const map = L.map('detail-map', {
    scrollWheelZoom: false,
  }).setView([event.lat, event.lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map);

  // Custom marker
  const blueIcon = L.divIcon({
    className: 'map-marker',
    html: `<div class="map-marker-inner"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  L.marker([event.lat, event.lng], { icon: blueIcon })
    .bindPopup(
      `
      <div class="map-popup">
        <p class="map-popup-region">${event.region}</p>
        <h3 class="map-popup-title">${event.title}</h3>
        <p class="map-popup-date">${event.date}</p>
      </div>
    `,
    )
    .addTo(map)
    .openPopup();
};

// Load weather for event coordinates
const loadEventWeather = async (event) => {
  try {
    const [weatherData, stations] = await Promise.all([
      fetchWeather(event.lat, event.lng),
      fetchWaterStations(),
    ]);

    if (!weatherData || !weatherData.daily) return;

    // Current weather
    const code = weatherData.daily.weathercode[0];
    const maxTemp = Math.round(weatherData.daily.temperature_2m_max[0]);

    document.getElementById('detail-weather-icon').textContent = getWeatherIcon(code);
    document.getElementById('detail-weather-temp').textContent = `${maxTemp}°C`;
    document.getElementById('detail-weather-desc').textContent = getWeatherDescription(code);

    // 3-day forecast
    const forecastEl = document.getElementById('detail-weather-forecast');
    forecastEl.innerHTML = '';

    weatherData.daily.time.slice(0, 3).forEach((date, index) => {
      const forecastCode = weatherData.daily.weathercode[index];
      const temp = Math.round(weatherData.daily.temperature_2m_max[index]);
      const isToday = index === 0;

      const item = document.createElement('div');
      item.className = 'detail-forecast-item';
      item.innerHTML = `
        <p class="detail-forecast-day">${isToday ? 'Heute' : formatWeekday(date)}</p>
        <p class="detail-forecast-date">${formatDate(date)}</p>
        <p class="detail-forecast-icon">${getWeatherIcon(forecastCode)}</p>
        <p class="detail-forecast-temp">${temp}°</p>
      `;
      forecastEl.appendChild(item);
    });

    // Water level
    const station =
      stations?.find(
        (s) => s.shortname === event.waterStation || s.longname?.includes(event.region),
      ) || stations?.[0];

    if (!station) return;

    const measurements = await fetchWaterLevels(station.uuid);
    if (!measurements || measurements.length === 0) return;

    const lastLevel = Math.round(measurements[measurements.length - 1].value);
    const status = getWaterStatus(lastLevel);

    // Add water info to weather card
    const weatherCard = document.querySelector('.detail-card-weather');
    if (weatherCard) {
      const waterEl = document.createElement('div');
      waterEl.className = 'detail-water';
      waterEl.innerHTML = `
        <div class="detail-water-info">
          <span class="detail-water-icon">🌊</span>
          <span class="detail-water-level">${lastLevel} cm</span>
          <span class="detail-water-badge" style="color: ${status.color}">${status.text}</span>
        </div>
        <p class="detail-water-station">${station.longname}</p>
      `;
      weatherCard.appendChild(waterEl);
    }
  } catch (error) {
    console.error('Error loading event weather:', error);
  }
};
