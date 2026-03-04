import {
  fetchWeather,
  getUserLocation,
  fetchWaterStations,
  fetchWaterLevels,
} from '../utils/api.js';
import { getWeatherDescription, formatWeekday, formatDate } from '../utils/utils.js';
import {
  createIcon,
  getWeatherIconFn,
  Wind,
  Droplets,
  TrendingUp,
  TrendingDown,
} from '../utils/icons.js';

// ─── Init ─────────────────────────────────────────────────────────────────────

export const initWeather = async () => {
  try {
    const location = await getUserLocation();

    const locationEl = document.querySelector('.weather-location-name');
    if (locationEl) locationEl.textContent = `${location.city ?? 'Husum'} · Nordsee`;

    const [weatherData, stations] = await Promise.all([
      fetchWeather(location.lat, location.lng),
      fetchWaterStations(),
    ]);

    if (!weatherData?.daily) {
      showError('Wetterdaten nicht verfügbar');
      return null;
    }

    const station = stations?.find((s) => s.shortname === 'DRESDEN') ?? stations?.[0];
    const measurements = station ? await fetchWaterLevels(station.uuid) : null;
    const waterByDay = buildWaterByDay(measurements);

    renderCards(weatherData.daily, waterByDay);

    return {
      measurements,
      stationName: station?.longname ?? station?.shortname ?? null,
    };
  } catch (error) {
    console.error('initWeather:', error.message);
    showError('Fehler beim Laden der Wetterdaten');
    return null;
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

  daily.time.slice(0, 3).forEach((date, index) => {
    fragment.appendChild(createCard(daily, waterByDay, date, index, lastKnownLevel));
  });

  container.replaceChildren(fragment);
};

const createCard = (daily, waterByDay, date, index, lastKnownLevel) => {
  const isToday = index === 0;
  const code = parseInt(daily.weathercode[index], 10);
  const maxTemp = Math.round(daily.temperature_2m_max[index]);
  const minTemp = Math.round(daily.temperature_2m_min[index]);
  const wind = Math.round(daily.windspeed_10m_max?.[index] ?? 0);
  const precip = daily.precipitation_probability_max?.[index] ?? 0;
  const waterLevel = waterByDay[date] ?? lastKnownLevel;

  const card = document.createElement('div');
  card.className = `weather-card${isToday ? ' weather-card-today' : ''}`;

  card.append(
    createHeader(isToday, date),
    createWeatherRow(code, maxTemp, minTemp),
    createDetails(wind, precip),
    createDivider(),
    createTideSection(),
  );

  return card;
};

// ─── Card sections ────────────────────────────────────────────────────────────

const createHeader = (isToday, date) => {
  const day = document.createElement('p');
  day.className = 'weather-card-day';
  day.textContent = isToday ? 'Heute' : formatWeekday(date);

  const dateEl = document.createElement('p');
  dateEl.className = 'weather-card-date';
  dateEl.textContent = formatDate(date);

  const header = document.createElement('div');
  header.className = 'weather-card-header';
  header.append(day, dateEl);
  return header;
};

const createWeatherRow = (code, maxTemp, minTemp) => {
  const iconWrap = document.createElement('div');
  iconWrap.className = 'weather-card-icon';

  const iconEl = createIcon(getWeatherIconFn(code), { size: 28, className: 'weather-icon-svg' });
  iconWrap.appendChild(iconEl);

  const tempMax = document.createElement('p');
  tempMax.className = 'weather-card-temp-max';
  tempMax.textContent = `${maxTemp}°`;

  const tempMin = document.createElement('p');
  tempMin.className = 'weather-card-temp-min';
  tempMin.textContent = `${minTemp}°`;

  const desc = document.createElement('p');
  desc.className = 'weather-card-desc';
  desc.textContent = getWeatherDescription(code);

  const tempInfo = document.createElement('div');
  tempInfo.append(tempMax, tempMin, desc);

  const section = document.createElement('div');
  section.className = 'weather-card-weather';
  section.append(iconWrap, tempInfo);
  return section;
};

const createDetails = (wind, precip) => {
  const createDetail = (IconFn, text) => {
    const icon = createIcon(IconFn, { size: 14, className: 'weather-detail-svg' });

    const el = document.createElement('div');
    el.className = 'weather-card-detail';
    el.append(icon, ` ${text}`);
    return el;
  };

  const section = document.createElement('div');
  section.className = 'weather-card-details';
  section.append(
    createDetail(Wind, `Wind ${wind} km/h`),
    createDetail(Droplets, `${precip}% Niederschlag`),
  );
  return section;
};

const createDivider = () => {
  const el = document.createElement('div');
  el.className = 'weather-card-divider';
  return el;
};

const createTideSection = () => {
  const createTideRow = (type, label) => {
    const icon = createIcon(type === 'hw' ? TrendingUp : TrendingDown, {
      size: 14,
      className: `tide-icon tide-icon-${type}`,
    });

    const labelEl = document.createElement('span');
    labelEl.textContent = label;

    const time = document.createElement('span');
    time.className = 'tide-time';
    time.textContent = '— noch nicht verfügbar';

    const row = document.createElement('div');
    row.className = `tide-row tide-${type}`;
    row.append(icon, labelEl, time);
    return row;
  };

  const section = document.createElement('div');
  section.className = 'weather-card-tide';
  section.append(
    createTideRow('hw', 'Hochwasser'),
    createTideRow('nw', 'Niedrigwasser'),
    createTideRow('hw', 'Hochwasser'),
    createTideRow('nw', 'Niedrigwasser'),
  );
  return section;
};
