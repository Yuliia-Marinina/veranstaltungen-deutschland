import Chart from 'chart.js/auto';
import { formatDate } from '../utils/utils.js';

const SAMPLE_RATE = 10;
const THRESHOLD_HIGH = 300;
const THRESHOLD_LOW = 150;

let chartInstance = null;

// ─── Public API ───────────────────────────────────────────────────────────────

export const initChart = (measurements, stationName) => {
  if (!measurements?.length) return;

  const values = measurements.map((m) => Math.round(m.value));
  const current = values.at(-1);
  const max = Math.max(...values);
  const min = Math.min(...values);

  updateStats(current, max, min, stationName);
  renderChart(measurements);
};

// ─── Stats ────────────────────────────────────────────────────────────────────

const getStatus = (value) => {
  if (value >= THRESHOLD_HIGH) return { label: 'Erhöht', cls: 'badge-high' };
  if (value <= THRESHOLD_LOW) return { label: 'Niedrig', cls: 'badge-low' };
  return { label: 'Normal', cls: 'badge-normal' };
};

const setTextById = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const updateStats = (current, max, min, stationName) => {
  setTextById('chart-stat-current', `${current} cm`);
  setTextById('chart-stat-max', `${max} cm`);
  setTextById('chart-stat-min', `${min} cm`);

  const badge = document.getElementById('chart-stat-badge');
  if (badge) {
    const { label, cls } = getStatus(current);
    badge.textContent = label;
    badge.classList.remove('badge-normal', 'badge-high', 'badge-low');
    badge.classList.add(cls);
  }

  if (stationName) {
    setTextById('chart-subtitle', `Pegelstand in cm — Station ${stationName}`);
  }
};

// ─── Chart ────────────────────────────────────────────────────────────────────

const buildConfig = (labels, values) => ({
  type: 'line',
  data: {
    labels,
    datasets: [
      {
        label: 'Wasserstand (cm)',
        data: values,
        borderColor: '#48b4d4',
        backgroundColor: 'rgba(72, 180, 212, 0.08)',
        borderWidth: 2.5,
        tension: 0.4,
        pointBackgroundColor: '#48b4d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0a2540',
        titleColor: 'rgba(255,255,255,0.6)',
        bodyColor: '#ffffff',
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.raw} cm`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#4a6580', maxTicksLimit: 8, font: { size: 11 } },
        grid: { color: 'rgba(168, 216, 232, 0.25)' },
      },
      y: {
        ticks: {
          color: '#4a6580',
          font: { size: 11 },
          callback: (v) => `${v} cm`,
        },
        grid: { color: 'rgba(168, 216, 232, 0.25)' },
      },
    },
  },
});

const renderChart = (measurements) => {
  const canvas = document.getElementById('water-chart-canvas');
  if (!canvas) return;

  const filtered = measurements.filter((_, i) => i % SAMPLE_RATE === 0);
  const labels = filtered.map((m) => formatDate(m.timestamp));
  const values = filtered.map((m) => Math.round(m.value));

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(canvas, buildConfig(labels, values));
};
