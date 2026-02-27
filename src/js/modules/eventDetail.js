import {
  fetchEventById,
  fetchWeather,
  fetchWaterStations,
  fetchWaterLevels,
} from '../utils/api.js';
import { normalizeEvent } from '../utils/ticketmaster.js';
import {
  getWeatherIcon,
  getWeatherDescription,
  formatWeekday,
  formatDate,
  getWaterStatus,
} from '../utils/helpers.js';

const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
};

const setTextById = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const setErrorState = (message = 'Ein Fehler ist aufgetreten.') => {
  setTextById('detail-title', message);
};

// ─── Init ─────────────────────────────────────────────────────────────────────

export const initEventDetail = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const tmid = params.get('tmid');

    if (!tmid) {
      setErrorState('Veranstaltung nicht gefunden');
      return;
    }

    setTextById('detail-title', 'Wird geladen...');

    if (tmid === 'husum-test') {
      const { husumEvent } = await import('../data/husumEvent.js');
      renderEventInfo(husumEvent);
      initDetailMap(husumEvent);
      await loadEventWeather(husumEvent, null);
      return;
    }

    const rawEvent = await fetchEventById(tmid);

    if (!rawEvent) {
      setErrorState('Veranstaltung nicht gefunden');
      return;
    }

    const id = parseInt(params.get('id'));
    const event = await normalizeEvent(rawEvent, id);

    renderEventInfo(event);
    initDetailMap(event);
    await loadEventWeather(event, rawEvent);
  } catch (error) {
    console.error('Error initializing event detail:', error);
    setErrorState('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
  }
};

// ─── Event info ───────────────────────────────────────────────────────────────

const renderEventInfo = (event) => {
  const image = document.getElementById('detail-image');
  if (image) {
    image.src = event.image;
    image.alt = escapeHTML(event.title);
  }

  setTextById('detail-title', event.title);
  setTextById('detail-date', event.date);
  setTextById('detail-region', event.region);
  setTextById('detail-time', event.time);
  setTextById('detail-address', event.address);
  setTextById('detail-card-date', event.date);
  setTextById('detail-card-time', event.time);
  setTextById('detail-card-region', event.region);

  document.title = `${event.title} — Events in Germany`;

  renderDescription(event.description);
  renderAddress(event.address);
  renderTags(event.tags);
  renderTicketButton(event.url);
};

const renderDescription = (description = '') => {
  const el = document.getElementById('detail-description');
  if (!el) return;

  const escaped = escapeHTML(description);
  el.innerHTML = escaped.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="detail-link">$1</a>',
  );
};

const renderAddress = (address) => {
  const el = document.getElementById('detail-card-address');
  if (!el || !address) return;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  el.innerHTML = `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="detail-link">🗺️ ${escapeHTML(address)}</a>`;
};

const renderTags = (tags = []) => {
  const el = document.getElementById('detail-tags');
  if (!el) return;
  el.innerHTML = tags.map((tag) => `<span class="detail-tag">${escapeHTML(tag)}</span>`).join('');
};

const renderTicketButton = (url) => {
  const btn = document.querySelector('.detail-card-btn');
  if (btn && url) {
    btn.href = url;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
  }
};

// ─── Map ──────────────────────────────────────────────────────────────────────

const initDetailMap = (event) => {
  const map = L.map('detail-map', {
    scrollWheelZoom: false,
    maxZoom: 18,
  }).setView([event.lat, event.lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map);

  const blueIcon = L.divIcon({
    className: 'map-marker',
    html: `<div class="map-marker-inner"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  L.marker([event.lat, event.lng], { icon: blueIcon })
    .bindPopup(
      `<div class="map-popup">
        <p class="map-popup-region">${escapeHTML(event.region)}</p>
        <h3 class="map-popup-title">${escapeHTML(event.title)}</h3>
        <p class="map-popup-date">${escapeHTML(event.date)}</p>
      </div>`,
    )
    .addTo(map)
    .openPopup();
};

// ─── Weather ──────────────────────────────────────────────────────────────────

const loadEventWeather = async (event, rawEvent) => {
  try {
    const [weatherData, stations] = await Promise.all([
      fetchWeather(event.lat, event.lng),
      fetchWaterStations(),
    ]);

    if (!weatherData?.daily) return;

    renderForecast(weatherData);
    renderEventDayWeather(weatherData, rawEvent);
    await renderWaterLevel(event, stations);
  } catch (error) {
    console.error('Error loading event weather:', error);
  }
};

const renderForecast = (weatherData) => {
  const el = document.getElementById('detail-weather-forecast');
  if (!el) return;

  const fragment = document.createDocumentFragment();

  weatherData.daily.time.slice(0, 3).forEach((date, index) => {
    const code = weatherData.daily.weathercode[index];
    const tempMax = Math.round(weatherData.daily.temperature_2m_max[index]);
    const tempMin = Math.round(weatherData.daily.temperature_2m_min[index]);
    const isToday = index === 0;

    const col = document.createElement('div');
    col.className = 'detail-tide-col';
    col.innerHTML = `
      <div class="detail-tide-col-header">
        <p class="detail-tide-col-day">${isToday ? 'Heute' : escapeHTML(formatWeekday(date))}</p>
        <p class="detail-tide-col-date">${escapeHTML(formatDate(date))}</p>
      </div>

      <div class="detail-tide-weather">
        <span class="detail-tide-weather-icon">${getWeatherIcon(code)}</span>
        <div class="detail-tide-weather-info">
          <span class="detail-tide-weather-label">Wetter</span>
          <span class="detail-tide-weather-temp">${tempMax}° / ${tempMin}°</span>
        </div>
      </div>

      <div class="detail-tide-row">
        <span class="detail-tide-row-icon">🌊</span>
        <div class="detail-tide-row-info">
          <span class="detail-tide-row-label">Hochwasser</span>
          <span class="detail-tide-row-time">— noch nicht verfügbar</span>
        </div>
      </div>

      <div class="detail-tide-row">
        <span class="detail-tide-row-icon">〰️</span>
        <div class="detail-tide-row-info">
          <span class="detail-tide-row-label">Niedrigwasser</span>
          <span class="detail-tide-row-time">— noch nicht verfügbar</span>
        </div>
      </div>
    `;
    fragment.appendChild(col);
  });

  el.innerHTML = '';
  el.appendChild(fragment);
};

const renderEventDayWeather = (weatherData, rawEvent) => {
  const el = document.getElementById('detail-event-weather');
  if (!el) return;

  const eventDate = rawEvent?.dates?.start?.localDate;
  const dayIndex = weatherData.daily.time.findIndex((d) => d === eventDate);

  if (dayIndex === -1) {
    el.innerHTML = `<p class="detail-event-weather-na">🌤️ Wettervorhersage für den Veranstaltungstag noch nicht verfügbar</p>`;
    return;
  }

  const code = weatherData.daily.weathercode[dayIndex];
  const tempMax = Math.round(weatherData.daily.temperature_2m_max[dayIndex]);
  const tempMin = Math.round(weatherData.daily.temperature_2m_min[dayIndex]);

  el.innerHTML = `
    <div class="detail-event-weather">
      <p class="detail-event-weather-title">🗓️ Wetter am Veranstaltungstag</p>
      <div class="detail-event-weather-info">
        <span class="detail-event-weather-icon">${getWeatherIcon(code)}</span>
        <span class="detail-event-weather-temp">${tempMax}° / ${tempMin}°</span>
        <span class="detail-event-weather-desc">${escapeHTML(getWeatherDescription(code))}</span>
      </div>
    </div>
  `;
};

// ─── Water ────────────────────────────────────────────────────────────────────

const renderWaterLevel = async (event, stations) => {
  const station = stations?.find((s) => s.longname?.includes(event.region)) ?? stations?.[0];
  if (!station) return;

  const measurements = await fetchWaterLevels(station.uuid);
  if (!measurements?.length) return;

  const lastLevel = Math.round(measurements[measurements.length - 1].value);
  const status = getWaterStatus(lastLevel);

  const waterEl = document.getElementById('detail-water');
  if (!waterEl) return;

  waterEl.innerHTML = `
    <div class="detail-water-info">
      <span class="detail-water-icon">🌊</span>
      <span class="detail-water-level">${lastLevel} cm</span>
      <span class="detail-water-badge" style="color: ${escapeHTML(status.color)}">${escapeHTML(status.text)}</span>
    </div>
    <p class="detail-water-station">${escapeHTML(station.longname)}</p>
  `;
};
