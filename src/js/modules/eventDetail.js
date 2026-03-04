import L from 'leaflet';
import {
  fetchEventById,
  fetchWeather,
  fetchWaterStations,
  fetchWaterLevels,
} from '../utils/api.js';
import { normalizeEvent } from '../utils/ticketmaster.js';
import {
  escapeHTML,
  formatDate,
  formatWeekday,
  getWeatherDescription,
  getWaterStatus,
} from '../utils/utils.js';

import {
  createIcon,
  getWeatherIconFn,
  MapPin,
  Waves,
  CalendarDays,
  TrendingUp,
  TrendingDown,
} from '../utils/icons.js';

const TEST_EVENT_ID = 'husum-test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

    if (tmid === TEST_EVENT_ID) {
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

    const id = parseInt(params.get('id'), 10);
    if (isNaN(id)) {
      setErrorState('Ungültige Veranstaltungs-ID');
      return;
    }

    const event = await normalizeEvent(rawEvent, id);
    renderEventInfo(event);
    initDetailMap(event);
    await loadEventWeather(event, rawEvent);
  } catch (error) {
    console.error('initEventDetail:', error.message);
    setErrorState('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
  }
};

// ─── Event Info ───────────────────────────────────────────────────────────────

const renderEventInfo = (event) => {
  const image = document.getElementById('detail-image');
  if (image) {
    image.src = event.image;
    image.alt = event.title ?? '';
  }

  setTextById('detail-title', event.title);
  setTextById('detail-date', event.date);
  setTextById('detail-region', event.region);
  setTextById('detail-time', event.time);
  setTextById('detail-address', event.address);
  setTextById('detail-card-date', event.date);
  setTextById('detail-card-time', event.time);
  setTextById('detail-card-region', event.region);

  document.title = `${event.title?.replace(/[<>]/g, '') ?? ''} — Events in Germany`;

  renderDescription(event.description);
  renderAddress(event.address);
  renderTags(event.tags);
  renderTicketButton(event.url);
};

// ─── Description ──────────────────────────────────────────────────────────────

const renderDescription = (description = '') => {
  const el = document.getElementById('detail-description');
  if (!el) return;

  // Split by URLs, wrap in <a>, rest as TextNode — prevents javascript: XSS
  const parts = escapeHTML(description).split(/(https?:\/\/[^\s]+)/g);
  el.replaceChildren(
    ...parts.map((part) => {
      if (/^https?:\/\//.test(part)) {
        const a = document.createElement('a');
        a.href = part;
        a.textContent = part;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'detail-link';
        return a;
      }
      return document.createTextNode(part);
    }),
  );
};

// ─── Address ──────────────────────────────────────────────────────────────────

const renderAddress = (address) => {
  const el = document.getElementById('detail-card-address');
  if (!el || !address) return;

  const icon = createIcon(MapPin, { size: 14, className: 'detail-address-icon' });

  const a = document.createElement('a');
  a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'detail-link';
  a.append(icon, address);

  el.replaceChildren(a);
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

const renderTags = (tags = []) => {
  const el = document.getElementById('detail-tags');
  if (!el) return;

  el.replaceChildren(
    ...tags.map((tag) => {
      const span = document.createElement('span');
      span.className = 'detail-tag';
      span.textContent = tag;
      return span;
    }),
  );
};

// ─── Ticket Button ────────────────────────────────────────────────────────────

const renderTicketButton = (url) => {
  const btn = document.querySelector('.detail-card-btn');
  if (btn && url) {
    btn.href = url;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
  }
};

// ─── Detail Map ───────────────────────────────────────────────────────────────

const initDetailMap = (event) => {
  const map = L.map('detail-map', { scrollWheelZoom: false, maxZoom: 18 }).setView(
    [event.lat, event.lng],
    13,
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map);

  const icon = L.divIcon({
    className: 'map-marker',
    html: `<div class="map-marker-inner"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  L.marker([event.lat, event.lng], { icon })
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
    console.error('loadEventWeather:', error.message);
  }
};

// ─── Forecast ─────────────────────────────────────────────────────────────────

const renderForecast = (weatherData) => {
  const el = document.getElementById('detail-weather-forecast');
  if (!el) return;

  const fragment = document.createDocumentFragment();

  weatherData.daily.time.slice(0, 3).forEach((date, index) => {
    const code = parseInt(weatherData.daily.weathercode[index], 10);
    const tempMax = Math.round(weatherData.daily.temperature_2m_max[index]);
    const tempMin = Math.round(weatherData.daily.temperature_2m_min[index]);
    const isToday = index === 0;

    const dayLabel = document.createElement('p');
    dayLabel.className = 'detail-tide-col-day';
    dayLabel.textContent = isToday ? 'Heute' : formatWeekday(date);

    const dateLabel = document.createElement('p');
    dateLabel.className = 'detail-tide-col-date';
    dateLabel.textContent = formatDate(date);

    const colHeader = document.createElement('div');
    colHeader.className = 'detail-tide-col-header';
    colHeader.append(dayLabel, dateLabel);

    const { icon, cls } = getWeatherIconFn(code);
    const weatherIcon = createIcon(getWeatherIconFn(code), {
      size: 22,
      className: `detail-tide-weather-icon ${cls}`,
    });

    const weatherLabel = document.createElement('span');
    weatherLabel.className = 'detail-tide-weather-label';
    weatherLabel.textContent = 'Wetter';

    const weatherTemp = document.createElement('span');
    weatherTemp.className = 'detail-tide-weather-temp';
    weatherTemp.textContent = `${tempMax}° / ${tempMin}°`;

    const weatherInfo = document.createElement('div');
    weatherInfo.className = 'detail-tide-weather-info';
    weatherInfo.append(weatherLabel, weatherTemp);

    const weatherRow = document.createElement('div');
    weatherRow.className = 'detail-tide-weather';
    weatherRow.append(weatherIcon, weatherInfo);

    const col = document.createElement('div');
    col.className = 'detail-tide-col';
    col.append(
      colHeader,
      weatherRow,
      createTideRow('hw', 'Hochwasser'),
      createTideRow('nw', 'Niedrigwasser'),
    );

    fragment.appendChild(col);
  });

  el.replaceChildren(fragment);
};

const createTideRow = (type, label) => {
  const icon = createIcon(type === 'hw' ? TrendingUp : TrendingDown, {
    size: 14,
    className: `detail-tide-row-icon tide-icon-${type}`,
  });

  const rowLabel = document.createElement('span');
  rowLabel.className = 'detail-tide-row-label';
  rowLabel.textContent = label;

  const rowTime = document.createElement('span');
  rowTime.className = 'detail-tide-row-time';
  rowTime.textContent = '— noch nicht verfügbar';

  const info = document.createElement('div');
  info.className = 'detail-tide-row-info';
  info.append(rowLabel, rowTime);

  const row = document.createElement('div');
  row.className = 'detail-tide-row';
  row.append(icon, info);

  return row;
};

// ─── Event Day Weather ────────────────────────────────────────────────────────

const renderEventDayWeather = (weatherData, rawEvent) => {
  const el = document.getElementById('detail-event-weather');
  if (!el) return;

  const eventDate = rawEvent?.dates?.start?.localDate;
  const dayIndex = weatherData.daily.time.findIndex((d) => d === eventDate);

  if (dayIndex === -1) {
    const { icon: naIcon, cls: naCls } = getWeatherIconFn(3);
    const icon = createIcon(naIcon, { size: 16, className: `detail-weather-na-icon ${naCls}` });

    const na = document.createElement('p');
    na.className = 'detail-event-weather-na';
    na.append(icon, 'Wettervorhersage für den Veranstaltungstag noch nicht verfügbar');
    el.replaceChildren(na);
    return;
  }

  const code = parseInt(weatherData.daily.weathercode[dayIndex], 10);
  const tempMax = Math.round(weatherData.daily.temperature_2m_max[dayIndex]);
  const tempMin = Math.round(weatherData.daily.temperature_2m_min[dayIndex]);

  const titleIcon = createIcon(CalendarDays, { size: 14, className: 'detail-weather-title-icon' });

  const title = document.createElement('p');
  title.className = 'detail-event-weather-title';
  title.append(titleIcon, 'Wetter am Veranstaltungstag');

  const { icon: wIcon, cls: wCls } = getWeatherIconFn(code);
  const weatherIcon = createIcon(wIcon, {
    size: 24,
    className: `detail-event-weather-icon ${wCls}`,
  });

  const temp = document.createElement('span');
  temp.className = 'detail-event-weather-temp';
  temp.textContent = `${tempMax}° / ${tempMin}°`;

  const desc = document.createElement('span');
  desc.className = 'detail-event-weather-desc';
  desc.textContent = getWeatherDescription(code);

  const info = document.createElement('div');
  info.className = 'detail-event-weather-info';
  info.append(weatherIcon, temp, desc);

  const wrapper = document.createElement('div');
  wrapper.className = 'detail-event-weather';
  wrapper.append(title, info);

  el.replaceChildren(wrapper);
};

// ─── Water Level ──────────────────────────────────────────────────────────────

const renderWaterLevel = async (event, stations) => {
  const station = stations?.find((s) => s.longname?.includes(event.region)) ?? stations?.[0];
  if (!station) return;

  const measurements = await fetchWaterLevels(station.uuid);
  if (!measurements?.length) return;

  const lastLevel = Math.round(measurements[measurements.length - 1].value);
  const status = getWaterStatus(lastLevel);

  const waterEl = document.getElementById('detail-water');
  if (!waterEl) return;

  const icon = createIcon(Waves, { size: 16, className: 'detail-water-icon' });

  const level = document.createElement('span');
  level.className = 'detail-water-level';
  level.textContent = `${lastLevel} cm`;

  const badge = document.createElement('span');
  badge.className = `detail-water-badge ${status.className}`;
  badge.textContent = status.text;

  const infoRow = document.createElement('div');
  infoRow.className = 'detail-water-info';
  infoRow.append(icon, level, badge);

  const stationName = document.createElement('p');
  stationName.className = 'detail-water-station';
  stationName.textContent = station.longname;

  waterEl.replaceChildren(infoRow, stationName);
};
