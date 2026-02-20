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

  // Initialize toggle
  initToggle();
});

// Toggle between weather and water level views
const initToggle = () => {
  const buttons = document.querySelectorAll('.weather-toggle-btn');
  const weatherView = document.getElementById('weather-view');
  const waterView = document.getElementById('water-view');

  if (!buttons.length || !weatherView || !waterView) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      // Remove active class from all buttons
      buttons.forEach((b) => b.classList.remove('active'));

      // Add active class to clicked button
      btn.classList.add('active');

      const tab = btn.dataset.tab;

      if (tab === 'weather') {
        // Show weather view
        weatherView.classList.remove('hidden');
        waterView.classList.add('hidden');
      } else if (tab === 'water') {
        // Show water view
        waterView.classList.remove('hidden');
        weatherView.classList.add('hidden');

        // Load water level data when tab is opened
        await initWaterLevel();
      }
    });
  });
};