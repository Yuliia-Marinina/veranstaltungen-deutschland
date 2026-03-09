import { getUserLocation } from '../utils/api.js';
import { renderWeatherWidget } from './weatherWidget.js';

export const initWeather = async () => {
  try {
    const location = await getUserLocation();

    if (!location?.lat || !location?.lng) {
      console.warn('initWeather: не удалось получить координаты');
      return;
    }

    const locationEl = document.querySelector('.weather-location-name');
    if (locationEl) locationEl.textContent = `${location.city ?? 'Husum'} · Nordsee`;

    await renderWeatherWidget('weather-cards', location, {
      waterContainerId: 'weather-water',
    });
  } catch (error) {
    console.error('initWeather:', error.message);
  }
};
