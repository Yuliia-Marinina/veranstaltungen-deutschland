// Import API functions and helpers
import { fetchWeather, getUserLocation } from '../utils/api.js';
import { getWeatherIcon, getWeatherDescription, formatWeekday, formatDate } from '../utils/helpers.js';

// Initialize weather module
export const initWeather = async () => {
    try {
        // Get user location
        const location = await getUserLocation();

        // Update city name in UI
        const cityEl = document.getElementById('weather-city');
        const locationEl = document.querySelector('.weather-location-name');

        if (cityEl) cityEl.textContent = location.city || 'Berlin';
        if (locationEl) locationEl.textContent = `${location.city || 'Berlin'}, Germany`;

        // Fetch weather data
        const data = await fetchWeather(location.lat, location.lng);

        // Check if data is valid
        if (!data || !data.daily) {
        console.error('No weather data received');
        return;
        }

        // Display current weather (first day)
        renderCurrentWeather(data.daily, 0);

        // Display 7-day forecast
        renderForecast(data.daily);

    } catch (error) {
        console.error('Error initializing weather:', error);
    }
};

// Render current weather
const renderCurrentWeather = (daily, index) => {
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');
    const iconEl = document.getElementById('weather-icon');

    if (!tempEl || !descEl || !iconEl) return;

    const code = daily.weathercode[index];
    const maxTemp = Math.round(daily.temperature_2m_max[index]);

    tempEl.textContent = `${maxTemp}°C`;
    descEl.textContent = getWeatherDescription(code);
    iconEl.textContent = getWeatherIcon(code);
};

// Render 7-day forecast cards
const renderForecast = (daily) => {
    const forecastEl = document.getElementById('weather-forecast');
    if (!forecastEl) return;

    // Clear existing content
    forecastEl.innerHTML = '';

    // Create card for each day
    daily.time.forEach((date, index) => {
        const code = daily.weathercode[index];
        const maxTemp = Math.round(daily.temperature_2m_max[index]);
        const minTemp = Math.round(daily.temperature_2m_min[index]);
        const isToday = index === 0;

        const card = document.createElement('div');
        card.className = `forecast-card ${isToday ? 'forecast-card-today' : ''}`;

        card.innerHTML = `
        <p class="forecast-day">${isToday ? 'Heute' : formatWeekday(date)}</p>
        <p class="forecast-date">${formatDate(date)}</p>
        <p class="forecast-icon">${getWeatherIcon(code)}</p>
        <p class="forecast-temp-max">${maxTemp}°</p>
        <p class="forecast-temp-min">${minTemp}°</p>
        `;

        forecastEl.appendChild(card);
    });
};