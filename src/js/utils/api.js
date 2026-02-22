import { CONFIG } from '../config.js';

// Ticketmaster API key
const TICKETMASTER_API_KEY = CONFIG.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
// Base URL for weather API
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
// Base URL for water level API
const WATER_BASE_URL = 'https://pegelonline.wsv.de/webservices/rest-api/v2';

// Get events from Ticketmaster for Germany
export const fetchTicketmasterEvents = async (city = '', size = 6) => {
  try {
    const cityParam = city ? `&city=${city}` : '';
    const url = `${TICKETMASTER_BASE_URL}/events.json?apikey=${TICKETMASTER_API_KEY}&countryCode=DE${cityParam}&size=${size}&sort=date,asc`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    return data._embedded?.events || [];
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    return [];
  }
};

// Get weather forecast by coordinates
export const fetchWeather = async (lat, lng) => {
  try {
    const url = `${WEATHER_BASE_URL}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Berlin&forecast_days=7`;
    const response = await fetch(url);

    // Check if response is successful (status 200-299)
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null; // Return null on error
  }
};

// Get list of water measurement stations on river Elbe
export const fetchWaterStations = async () => {
  try {
    // Removed ?waters=ELBE to get all stations
    const url = `${WATER_BASE_URL}/stations.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Water API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching water stations:', error);
    return null;
  }
};

// Get water level measurements for specific station
export const fetchWaterLevels = async (stationId) => {
  try {
    const url = `${WATER_BASE_URL}/stations/${stationId}/W/measurements.json?start=P7D`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Water API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching water levels:', error);
    return null;
  }
};

// Get user's current location via browser geolocation API
export const getUserLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 52.52, lng: 13.405, city: 'Berlin' }); // Default to Berlin if geolocation fails
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: 'Your Location',
        });
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        resolve({
          lat: 52.52,
          lng: 13.405,
          city: 'Berlin',
        });
      },
    );
  });
};
