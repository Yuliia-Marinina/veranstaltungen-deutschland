import L from 'leaflet';
import { fetchEventById } from '../utils/api.js';
import { normalizeEvent } from '../utils/ticketmaster.js';
import { escapeHTML } from '../utils/utils.js';
import { createIcon, MapPin } from '../utils/icons.js';
import { renderWeatherWidget } from './weatherWidget.js';

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
      await loadEventWeather(husumEvent);
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
    await loadEventWeather(event);
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
  setTextById('detail-card-date', event.date);
  setTextById('detail-card-time', event.time);
  setTextById('detail-card-region', event.region);
  setTextById('detail-breadcrumb', event.title);
  setTextById('detail-map-title', event.region ?? 'Veranstaltungsort');

  document.title = `${escapeHTML(event.title ?? '')} — Events in Germany`;

  renderDescription(event.description);
  renderAddress(event.address);
  renderTags(event.tags);
  renderTicketButton(event.url);
  initBookmarkButton(event.id);
};

// ─── Description ──────────────────────────────────────────────────────────────

const renderDescription = (description = '') => {
  const el = document.getElementById('detail-description');
  if (!el) return;

  const parts = description.split(/(https?:\/\/[^\s]+)/g);
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
      return document.createTextNode(escapeHTML(part));
    }),
  );
};

// ─── Address ──────────────────────────────────────────────────────────────────

const renderAddress = (address) => {
  const elCard = document.getElementById('detail-card-address');
  if (elCard && address) elCard.textContent = address;

  const elFooter = document.getElementById('detail-card-address-link');
  if (!elFooter || !address) return;

  const icon = createIcon(MapPin, { size: 12, className: 'detail-map-footer-icon' });

  const a = document.createElement('a');
  a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'detail-link';
  a.append(icon, address);

  elFooter.replaceChildren(a);
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
  const btn = document.getElementById('detail-ticket-btn');
  if (!btn) return;
  if (url) {
    btn.href = url;
    btn.removeAttribute('aria-disabled');
  }
};

// ─── Bookmark Button ──────────────────────────────────────────────────────────

const initBookmarkButton = (eventId) => {
  if (!eventId) return;

  const btn = document.getElementById('detail-bookmark-btn');
  if (!btn) return;

  const key = `bookmark-${eventId}`;
  const saved = localStorage.getItem(key) === 'true';

  btn.setAttribute('aria-pressed', String(saved));
  if (saved) btn.classList.add('saved');

  btn.addEventListener('click', () => {
    const isNowSaved = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(isNowSaved));
    btn.classList.toggle('saved', isNowSaved);
    localStorage.setItem(key, String(isNowSaved));
  });
};

// ─── Detail Map ───────────────────────────────────────────────────────────────

const initDetailMap = (event) => {
  if (!event.lat || !event.lng) return;

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

const loadEventWeather = async (event) => {
  if (!event.lat || !event.lng) return;

  try {
    await renderWeatherWidget('detail-weather-forecast', event, {
      waterContainerId: 'detail-water',
    });
  } catch (error) {
    console.error('loadEventWeather:', error.message);
  }
};
