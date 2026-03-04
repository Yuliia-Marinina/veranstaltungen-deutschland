// src/js/utils/icons.js
import {
  Wind,
  Droplets,
  TrendingUp,
  TrendingDown,
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  Calendar,
  Search,
  MapPin,
  Waves,
  CalendarDays,
} from 'lucide';

export const createIcon = (iconData, options = {}) => {
  const size = options.size ?? 16;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (options.className) svg.classList.add(...options.className.split(' '));

  // каждый элемент в массиве — это [tagName, {attrs}]
  iconData.forEach(([tag, attrs]) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
    svg.appendChild(el);
  });

  return svg;
};

const WEATHER_ICON_MAP = [
  { max: 0, icon: Sun, cls: 'icon-clear' },
  { max: 2, icon: CloudSun, cls: 'icon-partly' },
  { max: 3, icon: Cloud, cls: 'icon-cloud' },
  { max: 48, icon: CloudFog, cls: 'icon-cloud' },
  { max: 67, icon: CloudRain, cls: 'icon-rain' },
  { max: 77, icon: CloudSnow, cls: 'icon-snow' },
  { max: 82, icon: CloudDrizzle, cls: 'icon-rain' },
  { max: 99, icon: CloudLightning, cls: 'icon-thunder' },
];

export const getWeatherIconFn = (code) =>
  WEATHER_ICON_MAP.find(({ max }) => code <= max) ?? { icon: CloudSun, cls: 'icon-partly' };

export { Wind, Droplets, TrendingUp, TrendingDown, Calendar, Search, MapPin, Waves, CalendarDays };
