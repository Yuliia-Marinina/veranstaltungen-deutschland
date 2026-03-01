import { CONFIG } from '../config.js';

const TICKETMASTER_BASE = 'https://app.ticketmaster.com/discovery/v2';
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const WATER_BASE = 'https://pegelonline.wsv.de/webservices/rest-api/v2';

const DEFAULT_LOCATION = { lat: 52.52, lng: 13.405, city: 'Berlin' };

// ─── Core ─────────────────────────────────────────────────────────────────────

const fetchJSON = async (url, label = 'API') => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label} error: ${response.status}`);
  return response.json();
};

// ─── Ticketmaster ─────────────────────────────────────────────────────────────

export const fetchTicketmasterEvents = async (city = '', size = 6) => {
  try {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    const today = new Date().toISOString().split('T')[0];
    const url = `${TICKETMASTER_BASE}/events.json?apikey=${CONFIG.TICKETMASTER_API_KEY}&countryCode=DE${cityParam}&size=${size}&sort=date,asc&startDateTime=${today}T00:00:00Z`;
    const data = await fetchJSON(url, 'Ticketmaster');
    return data._embedded?.events ?? [];
  } catch (error) {
    console.error('fetchTicketmasterEvents:', error.message);
    return [];
  }
};

export const fetchEventById = async (ticketmasterId) => {
  try {
    const url = `${TICKETMASTER_BASE}/events/${encodeURIComponent(ticketmasterId)}.json?apikey=${CONFIG.TICKETMASTER_API_KEY}`;
    return await fetchJSON(url, 'Ticketmaster');
  } catch (error) {
    console.error('fetchEventById:', error.message);
    return null;
  }
};

// ─── Weather ──────────────────────────────────────────────────────────────────

export const fetchWeather = async (lat, lng) => {
  try {
    const url = `${WEATHER_BASE}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,precipitation_probability_max&timezone=Europe/Berlin&forecast_days=7`;
    return await fetchJSON(url, 'Weather');
  } catch (error) {
    console.error('fetchWeather:', error.message);
    return null;
  }
};

// ─── Water ────────────────────────────────────────────────────────────────────

export const fetchWaterStations = async () => {
  try {
    return await fetchJSON(`${WATER_BASE}/stations.json`, 'Water');
  } catch (error) {
    console.error('fetchWaterStations:', error.message);
    return null;
  }
};

export const fetchWaterLevels = async (stationId) => {
  try {
    const url = `${WATER_BASE}/stations/${encodeURIComponent(stationId)}/W/measurements.json?start=P7D`;
    return await fetchJSON(url, 'Water');
  } catch (error) {
    console.error('fetchWaterLevels:', error.message);
    return null;
  }
};

// ─── Geolocation ──────────────────────────────────────────────────────────────

export const getUserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude, city: null }),
      (error) => {
        console.error('Geolocation:', error.message);
        resolve(DEFAULT_LOCATION);
      },
    );
  });
