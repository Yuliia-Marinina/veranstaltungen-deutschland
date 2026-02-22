import { CONFIG } from '../config.js';

const TICKETMASTER_API_KEY = CONFIG.TICKETMASTER_API_KEY;

// ─── Base URLs ────────────────────────────────────────────────────────────────

const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const WATER_BASE_URL = 'https://pegelonline.wsv.de/webservices/rest-api/v2';

// ─── Core fetch helper ────────────────────────────────────────────────────────

// Generic JSON fetcher — never logs the URL to protect API keys
const fetchJSON = async (url, errorLabel = 'API') => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${errorLabel} error: ${response.status}`);
  return response.json();
};

// ─── Ticketmaster ─────────────────────────────────────────────────────────────

// Get events from Ticketmaster for Germany
export const fetchTicketmasterEvents = async (city = '', size = 6) => {
  try {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    const url = `${TICKETMASTER_BASE_URL}/events.json?apikey=${TICKETMASTER_API_KEY}&countryCode=DE${cityParam}&size=${size}&sort=date,asc`;
    const data = await fetchJSON(url, 'Ticketmaster');
    return data._embedded?.events ?? [];
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error.message);
    return [];
  }
};

// Get single event by Ticketmaster ID
export const fetchEventById = async (ticketmasterId) => {
  try {
    const url = `${TICKETMASTER_BASE_URL}/events/${encodeURIComponent(ticketmasterId)}.json?apikey=${TICKETMASTER_API_KEY}`;
    return await fetchJSON(url, 'Ticketmaster');
  } catch (error) {
    console.error('Error fetching event by id:', error.message);
    return null;
  }
};

// ─── Weather ──────────────────────────────────────────────────────────────────

// Get weather forecast by coordinates
export const fetchWeather = async (lat, lng) => {
  try {
    const url = `${WEATHER_BASE_URL}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Berlin&forecast_days=7`;
    return await fetchJSON(url, 'Weather');
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    return null;
  }
};

// ─── Water ────────────────────────────────────────────────────────────────────

// Get list of water measurement stations
export const fetchWaterStations = async () => {
  try {
    const url = `${WATER_BASE_URL}/stations.json`;
    return await fetchJSON(url, 'Water');
  } catch (error) {
    console.error('Error fetching water stations:', error.message);
    return null;
  }
};

// Get water level measurements for specific station (last 7 days)
export const fetchWaterLevels = async (stationId) => {
  try {
    const url = `${WATER_BASE_URL}/stations/${encodeURIComponent(stationId)}/W/measurements.json?start=P7D`;
    return await fetchJSON(url, 'Water');
  } catch (error) {
    console.error('Error fetching water levels:', error.message);
    return null;
  }
};

// ─── Geolocation ──────────────────────────────────────────────────────────────

// Default location: Berlin
const DEFAULT_LOCATION = { lat: 52.52, lng: 13.405, city: 'Berlin' };

// Get user's current location via browser geolocation API
// Returns null for city if location is detected — UI decides what to display
export const getUserLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: null, // Real coordinates detected, city name unknown
        }),
      (error) => {
        console.error('Geolocation error:', error.message);
        resolve(DEFAULT_LOCATION);
      },
    );
  });
};
