import { fetchWeather, fetchWaterStations, fetchWaterLevels } from '../utils/api.js';
import { getWeatherDescription, formatDate, getWaterStatus } from '../utils/utils.js';
import {
  createIcon,
  getWeatherIconFn,
  Wind,
  Droplets,
  TrendingUp,
  TrendingDown,
  Waves,
} from '../utils/icons.js';

// ─── Public API ───────────────────────────────────────────────────────────────
export const renderWeatherWidget = async (containerId, location, options = {}) => {
  if (!location?.lat || !location?.lng) {
    console.warn('renderWeatherWidget: координаты не переданы');
    return;
  }

  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const [weatherData, stations] = await Promise.all([
      fetchWeather(location.lat, location.lng),
      fetchWaterStations(),
    ]);

    if (!weatherData?.daily) {
      showError(container, 'Wetterdaten nicht verfügbar');
      return;
    }

    renderCards(container, weatherData.daily);

    if (options.waterContainerId) {
      const station = location.region
        ? stations?.find((s) => s.longname?.includes(location.region))
        : undefined;

      if (station) {
        await renderWaterLevel(options.waterContainerId, station);
      }
    }
  } catch (error) {
    console.error('renderWeatherWidget:', error.message);
    showError(container, 'Fehler beim Laden der Wetterdaten');
  }
};

// ─── Cards ────────────────────────────────────────────────────────────────────

const renderCards = (container, daily) => {
  const fragment = document.createDocumentFragment();

  daily.time.slice(0, 3).forEach((date, index) => {
    fragment.appendChild(createCard(daily, date, index));
  });

  container.replaceChildren(fragment);
};

const createCard = (daily, date, index) => {
  const isToday = index === 0;
  const code = parseInt(daily.weathercode[index], 10);
  const tempMax = Math.round(daily.temperature_2m_max[index]);
  const tempMin = Math.round(daily.temperature_2m_min[index]);
  const windSpeed = Math.round(daily.windspeed_10m_max?.[index] ?? 0);
  const precipitation = Math.round(daily.precipitation_sum?.[index] ?? 0);

  const card = document.createElement('div');
  card.className = 'detail-wcard';

  const hwRow = createTideRow('hw', 'HW', '— noch nicht verfügbar');
  const nwRow = createTideRow('nw', 'NW', '— noch nicht verfügbar');
  hwRow.dataset.tideType = 'hw';
  hwRow.dataset.dayIndex = index;
  nwRow.dataset.tideType = 'nw';
  nwRow.dataset.dayIndex = index;

  card.append(
    createDayEl(isToday, index),
    createDateEl(date),
    createMainRow(code, tempMax, tempMin),
    createDetails(windSpeed, precipitation),
    createDivider(),
    hwRow,
    nwRow,
  );

  return card;
};

// ─── Card parts ───────────────────────────────────────────────────────────────

const createDayEl = (isToday, index) => {
  const el = document.createElement('div');
  el.className = 'dwc-day';
  el.textContent = isToday ? 'Heute' : `+${index} Tag${index > 1 ? 'e' : ''}`;
  return el;
};

const createDateEl = (date) => {
  const el = document.createElement('div');
  el.className = 'dwc-date';
  el.textContent = formatDate(date);
  return el;
};

const createMainRow = (code, tempMax, tempMin) => {
  const { icon, cls } = getWeatherIconFn(code);
  const iconEl = createIcon(icon, { size: 20 });

  const iconWrap = document.createElement('div');
  iconWrap.className = `dwc-icon ${cls}`;
  iconWrap.appendChild(iconEl);

  const tempEl = document.createElement('div');
  tempEl.className = 'dwc-temp';
  tempEl.textContent = `${tempMax}°`;

  const descEl = document.createElement('div');
  descEl.className = 'dwc-desc';
  descEl.textContent = `${getWeatherDescription(code)} · min ${tempMin}°`;

  const tempWrap = document.createElement('div');
  tempWrap.append(tempEl, descEl);

  const row = document.createElement('div');
  row.className = 'dwc-main';
  row.append(iconWrap, tempWrap);
  return row;
};

const createDetails = (windSpeed, precipitation) => {
  const section = document.createElement('div');
  section.className = 'dwc-details';
  section.append(
    createDetailRow(Wind, `Wind ${windSpeed} km/h`, 'detail-wind-icon'),
    createDetailRow(Droplets, `${precipitation} mm Niederschlag`, 'detail-rain-icon'),
  );
  return section;
};

const createDetailRow = (iconData, text, iconClass) => {
  const icon = createIcon(iconData, { size: 12, className: iconClass });
  const row = document.createElement('div');
  row.className = 'dwc-detail';
  row.append(icon, text);
  return row;
};

const createDivider = () => {
  const el = document.createElement('div');
  el.className = 'dwc-divider';
  return el;
};

const createTideRow = (type, label, time) => {
  const icon = createIcon(type === 'hw' ? TrendingUp : TrendingDown, {
    size: 13,
    className: `tide-icon-${type}`,
  });

  const labelEl = document.createElement('span');
  labelEl.textContent = label;

  const timeEl = document.createElement('span');
  timeEl.className = 'dwc-tide-time';
  timeEl.textContent = time;

  const row = document.createElement('div');
  row.className = `dwc-tide-row ${type === 'hw' ? 'tide-hw' : 'tide-nw'}`;
  row.append(icon, labelEl, timeEl);
  return row;
};

// ─── Water Level ──────────────────────────────────────────────────────────────

const renderWaterLevel = async (containerId, station) => {
  const waterEl = document.getElementById(containerId);
  if (!waterEl) return;

  const measurements = await fetchWaterLevels(station.uuid);
  if (!measurements?.length) return;

  const lastLevel = Math.round(measurements[measurements.length - 1].value);
  const status = getWaterStatus(lastLevel);

  const card = document.createElement('div');
  card.className = 'detail-wcard';

  const icon = createIcon(Waves, { size: 16, className: 'detail-water-icon' });

  const level = document.createElement('span');
  level.className = 'detail-water-level';
  level.textContent = `${lastLevel} cm`;

  const badge = document.createElement('span');
  badge.className = 'detail-water-badge';
  badge.textContent = status.text;

  const infoRow = document.createElement('div');
  infoRow.className = 'detail-water-info';
  infoRow.append(icon, level, badge);

  const stationName = document.createElement('p');
  stationName.className = 'detail-water-station';
  stationName.textContent = station.longname;

  card.append(infoRow, stationName);
  waterEl.replaceChildren(card);
};

// ─── Error ────────────────────────────────────────────────────────────────────

const showError = (container, message) => {
  const p = document.createElement('p');
  p.className = 'weather-error';
  p.textContent = message;
  container.replaceChildren(p);
};
