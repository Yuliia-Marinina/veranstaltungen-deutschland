import { fetchWaterStations, fetchWaterLevels } from '../utils/api.js';
import { getWaterStatus, getWaterDescription, formatDate } from '../utils/helpers.js';

// Store chart instance to destroy before re-creating
let waterChart = null;

// Show every Nth measurement to avoid too many chart points
const CHART_SAMPLE_RATE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const setTextById = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const showError = (message = 'Daten nicht verfügbar') => {
  setTextById('water-level', message);
  setTextById('water-desc', '');
};

// ─── Initialization ───────────────────────────────────────────────────────────

export const initWaterLevel = async () => {
  try {
    const stations = await fetchWaterStations();

    if (!stations || stations.length === 0) {
      console.error('No water stations found');
      showError();
      return;
    }

    // Find station by shortname, fall back to first station
    const station = stations.find((s) => s.shortname === 'DRESDEN') ?? stations[0];
    setTextById('water-river', station.longname);

    const measurements = await fetchWaterLevels(station.uuid);

    if (!measurements || measurements.length === 0) {
      console.error('No measurements found');
      showError();
      return;
    }

    renderWaterInfo(measurements);
    renderWaterChart(measurements);
  } catch (error) {
    console.error('Error initializing water level:', error);
    showError('Fehler beim Laden der Daten');
  }
};

// ─── Water info ───────────────────────────────────────────────────────────────

const renderWaterInfo = (measurements) => {
  const lastMeasurement = measurements[measurements.length - 1];
  const level = Math.round(lastMeasurement.value);
  const status = getWaterStatus(level);

  setTextById('water-level', `${level} cm`);
  setTextById('water-desc', getWaterDescription(status.text));

  const badgeEl = document.getElementById('water-badge');
  if (badgeEl) {
    badgeEl.textContent = status.text;
    badgeEl.style.color = status.color;
  }
};

// ─── Chart ────────────────────────────────────────────────────────────────────

const buildChartConfig = (labels, values) => ({
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
        ticks: { color: 'rgba(255, 255, 255, 0.8)', maxTicksLimit: 7 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.8)',
          callback: (value) => `${value} cm`,
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
  },
});

const renderWaterChart = (measurements) => {
  const ctx = document.getElementById('water-chart-canvas');
  if (!ctx) return;

  // Sample measurements to reduce chart points
  const filtered = measurements.filter((_, i) => i % CHART_SAMPLE_RATE === 0);
  const labels = filtered.map((m) => formatDate(m.timestamp));
  const values = filtered.map((m) => Math.round(m.value));

  // Destroy existing chart before re-creating
  if (waterChart) waterChart.destroy();

  waterChart = new Chart(ctx, buildChartConfig(labels, values));
};
