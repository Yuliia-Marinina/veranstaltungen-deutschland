// Import modules
import { initMap } from './modules/map.js';
import { initWeather } from './modules/weather.js';
import { initWaterLevel } from './modules/waterLevel.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize map
  initMap();

  // Initialize weather (default view)
  await initWeather();
});
