import { fetchWaterStations, fetchWaterLevels } from '../utils/api.js';
import { getWaterStatus, formatDate } from '../utils/helpers.js';

// Store chart instance to destroy before re-creating
let waterChart = null;

// Initialize water level module
export const initWaterLevel = async () => {
  try {
    // Load water stations
    const stations = await fetchWaterStations();

    // Check if stations data is valid
    if (!stations || stations.length === 0) {
      console.error('No water stations found');
      return;
    }

    // Find station by shortname instead of taking first
    const station = stations.find((s) => s.shortname === 'DRESDEN') || stations[0];

    // Update river name in UI
    const riverEl = document.getElementById('water-river');
    if (riverEl) riverEl.textContent = station.longname;

    // Load measurements for this station
    const measurements = await fetchWaterLevels(station.uuid);

    // Check if measurements data is valid
    if (!measurements || measurements.length === 0) {
      console.error('No measurements found');
      return;
    }

    // Get last measurement (most recent)
    const lastMeasurement = measurements[measurements.length - 1];
    const level = Math.round(lastMeasurement.value);

    // Display water level
    const levelEl = document.getElementById('water-level');
    if (levelEl) levelEl.textContent = `${level} cm`;

    // Display status badge
    const status = getWaterStatus(level);
    const badgeEl = document.getElementById('water-badge');
    if (badgeEl) {
      badgeEl.textContent = status.text;
      badgeEl.style.color = status.color;
    }

    // Display description
    const descEl = document.getElementById('water-desc');
    if (descEl) {
      descEl.textContent = getWaterDescription(status.text);
    }

    // Render chart
    renderWaterChart(measurements);
  } catch (error) {
    console.error('Error initializing water level:', error);
  }
};

// Get description based on status
const getWaterDescription = (status) => {
  const descriptions = {
    Hoch: 'Der Wasserstand ist erhöht. Bitte beachten Sie die aktuellen Warnungen.',
    Niedrig: 'Der Wasserstand ist niedrig. Einschränkungen möglich.',
    Normal: 'Der Wasserstand ist im normalen Bereich. Keine Beeinträchtigungen erwartet.',
  };
  return descriptions[status] || '';
};

// Render water level chart using Chart.js
const renderWaterChart = (measurements) => {
  const ctx = document.getElementById('water-chart-canvas');
  if (!ctx) return;

  // Prepare data for chart
  // Take every 10th measurement to avoid too many points
  const filtered = measurements.filter((_, index) => index % 10 === 0);

  const labels = filtered.map((m) => formatDate(m.timestamp));
  const values = filtered.map((m) => Math.round(m.value));

  // Destroy existing chart before creating new one
  if (waterChart) {
    waterChart.destroy();
  }

  // Create new chart
  waterChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Wasserstand (cm)',
          data: values,
          borderColor: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointRadius: 3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            maxTicksLimit: 7,
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
        y: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            callback: (value) => `${value} cm`,
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
  });
};
