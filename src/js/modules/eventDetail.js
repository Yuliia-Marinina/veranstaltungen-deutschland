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

export const initEventDetail = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const index = parseInt(params.get('id')) - 1;
    const tmid = params.get('tmid');

    if (!tmid) {
      document.getElementById('detail-title').textContent = 'Veranstaltung nicht gefunden';
      return;
    }

    document.getElementById('detail-title').textContent = 'Wird geladen...';

    const rawEvent = await fetchEventById(tmid);

    if (!rawEvent) {
      document.getElementById('detail-title').textContent = 'Veranstaltung nicht gefunden';
      return;
    }

    const event = normalizeEvent(rawEvent, index);

    renderEventInfo(event);
    initDetailMap(event);
    await loadEventWeather(event, rawEvent);
  } catch (error) {
    console.error('Error initializing event detail:', error);
  }
};

const renderEventInfo = (event) => {
  document.getElementById('detail-image').src = event.image;
  document.getElementById('detail-image').alt = event.title;
  document.getElementById('detail-title').textContent = event.title;
  document.getElementById('detail-date').textContent = event.date;
  document.getElementById('detail-region').textContent = event.region;
  document.getElementById('detail-time').textContent = event.time;
  document.getElementById('detail-address').textContent = event.address;
  document.getElementById('detail-card-date').textContent = event.date;
  document.getElementById('detail-card-time').textContent = event.time;
  document.getElementById('detail-card-region').textContent = event.region;

  // Description with clickable links
  const description = event.description || '';
  const descWithLinks = description.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener" class="detail-link">$1</a>',
  );
  document.getElementById('detail-description').innerHTML = descWithLinks;

  // Address with Google Maps link
  const addressValue = document.getElementById('detail-card-address');
  if (addressValue) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
    addressValue.innerHTML = `<a href="${mapsUrl}" target="_blank" rel="noopener" class="detail-link">🗺️ ${event.address}</a>`;
  }

  // Page title
  document.title = `${event.title} — Events in Germany`;

  // Tags
  const tagsEl = document.getElementById('detail-tags');
  if (tagsEl) {
    tagsEl.innerHTML = event.tags.map((tag) => `<span class="detail-tag">${tag}</span>`).join('');
  }

  // Tickets link
  const ticketBtn = document.querySelector('.detail-card-btn');
  if (ticketBtn && event.url) {
    ticketBtn.href = event.url;
    ticketBtn.target = '_blank';
  }
};

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

const loadEventWeather = async (event, rawEvent) => {
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
    if (forecastEl) {
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
    }

    // Weather on event date
    const eventDate = rawEvent?.dates?.start?.localDate;
    const eventDayIndex = weatherData.daily.time.findIndex((d) => d === eventDate);
    const eventWeatherEl = document.getElementById('detail-event-weather');

    if (eventWeatherEl) {
      if (eventDayIndex !== -1) {
        const eventCode = weatherData.daily.weathercode[eventDayIndex];
        const eventTemp = Math.round(weatherData.daily.temperature_2m_max[eventDayIndex]);
        const eventTempMin = Math.round(weatherData.daily.temperature_2m_min[eventDayIndex]);

        eventWeatherEl.innerHTML = `
          <div class="detail-event-weather">
            <p class="detail-event-weather-title">🗓️ Wetter am Veranstaltungstag</p>
            <div class="detail-event-weather-info">
              <span class="detail-event-weather-icon">${getWeatherIcon(eventCode)}</span>
              <span class="detail-event-weather-temp">${eventTemp}° / ${eventTempMin}°</span>
              <span class="detail-event-weather-desc">${getWeatherDescription(eventCode)}</span>
            </div>
          </div>
        `;
      } else {
        eventWeatherEl.innerHTML = `
          <p class="detail-event-weather-na">
            🌤️ Wettervorhersage für den Veranstaltungstag noch nicht verfügbar
          </p>
        `;
      }
    }

    // Water level
    const station = stations?.find((s) => s.longname?.includes(event.region)) || stations?.[0];
    if (!station) return;

    const measurements = await fetchWaterLevels(station.uuid);
    if (!measurements || measurements.length === 0) return;

    const lastLevel = Math.round(measurements[measurements.length - 1].value);
    const status = getWaterStatus(lastLevel);

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
