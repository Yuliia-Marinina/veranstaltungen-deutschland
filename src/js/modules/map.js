import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { escapeHTML, formatDate } from '../utils/utils.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const POPUP_OPTIONS = { autoPan: false };

const GEOJSON_STYLE = {
  color: 'rgba(72, 180, 212, 0.5)',
  weight: 2,
  fillColor: 'rgba(255, 255, 255, 0.06)',
  fillOpacity: 0.06,
};

const GEOJSON_HOVER_STYLE = { fillOpacity: 0.2 };
const GEOJSON_DEFAULT_STYLE = { fillOpacity: 0.06 };

// ─── Init ─────────────────────────────────────────────────────────────────────

export const initMap = (events) => {
  const map = L.map('germany-map', {
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    attributionControl: false,
    maxZoom: 18,
  }).setView([51.1657, 10.4515], 5.5);

  loadGeoJSON(map, events);

  const markers = createMarkerCluster(map);
  addEventMarkers(map, markers, events);
  map.addLayer(markers);
};

// ─── GeoJSON ──────────────────────────────────────────────────────────────────

const loadGeoJSON = (map, events) => {
  const controller = new AbortController();

  fetch('/veranstaltungen-deutschland/data/germany.geojson', { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load GeoJSON: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      L.geoJSON(data, {
        style: GEOJSON_STYLE,
        onEachFeature: (feature, layer) => {
          const hasEvent = events.some((e) => e.geoRegion === feature.properties.name);
          if (!hasEvent) return;

          layer.on({
            mouseover: (e) => {
              e.target.setStyle(GEOJSON_HOVER_STYLE);
              L.DomEvent.stopPropagation(e);
            },
            mouseout: (e) => {
              const related = e.originalEvent.relatedTarget;
              if (
                related &&
                (related.classList.contains('map-marker-inner') ||
                  related.classList.contains('map-label') ||
                  related.closest('.map-label'))
              )
                return;
              e.target.setStyle(GEOJSON_DEFAULT_STYLE);
            },
          });
        },
      }).addTo(map);
    })
    .catch((error) => {
      if (error.name === 'AbortError') return;
      console.error('loadGeoJSON:', error.message);
    });

  return controller;
};

// ─── Marker Cluster ───────────────────────────────────────────────────────────

const createMarkerCluster = (map) => {
  const markers = L.markerClusterGroup({
    maxClusterRadius: 40,
    zoomToBoundsOnClick: false,
    iconCreateFunction: (cluster) =>
      L.divIcon({
        html: `<div class="map-cluster">${cluster.getChildCount()}</div>`,
        className: 'map-cluster-wrap',
        iconSize: [36, 36],
      }),
  });

  markers.on('clusterclick', (e) => {
    const popupContent = e.layer
      .getAllChildMarkers()
      .map((marker) => marker.getPopup().getContent())
      .join('<hr style="margin: 8px 0; border-color: #dadce0;">');

    L.popup(POPUP_OPTIONS)
      .setLatLng(e.layer.getLatLng())
      .setContent(`<div class="map-cluster-popup">${popupContent}</div>`)
      .openOn(map);
  });

  return markers;
};

// ─── Markers & Labels ─────────────────────────────────────────────────────────

const createBlueIcon = () =>
  L.divIcon({
    className: 'map-marker',
    html: `<div class="map-marker-inner"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const createPopupContent = (event) => `
  <div class="map-popup">
    <p class="map-popup-region">${escapeHTML(event.region)}</p>
    <h3 class="map-popup-title">${escapeHTML(event.title)}</h3>
    <p class="map-popup-date">${escapeHTML(formatDate(event.date))}</p>
    <a href="event-detail.html?id=${escapeHTML(String(event.id))}&tmid=${escapeHTML(event.ticketmasterId)}"
       class="map-popup-link">
      Mehr erfahren <span aria-hidden="true">→</span>
    </a>
  </div>
`;

const addEventMarkers = (map, markers, events) => {
  const blueIcon = createBlueIcon();
  const addedLabels = new Set();

  events.forEach((event) => {
    if (!event.lat || !event.lng) return;

    const marker = L.marker([event.lat, event.lng], { icon: blueIcon });
    marker.bindPopup(createPopupContent(event), POPUP_OPTIONS);
    markers.addLayer(marker);

    if (!addedLabels.has(event.region)) {
      const label = L.divIcon({
        className: 'map-label',
        html: `<span>${escapeHTML(event.region)}</span>`,
        iconAnchor: [-8, -4],
      });
      L.marker([event.lat, event.lng], { icon: label }).addTo(map);
      addedLabels.add(event.region);
    }
  });
};
