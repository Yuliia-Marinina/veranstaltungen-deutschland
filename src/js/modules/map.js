// Helper: Escape HTML to prevent XSS attacks
const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
};

// Shared popup options
const POPUP_OPTIONS = { autoPan: false };

// Import events as parameter instead of from file
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

//  GeoJSON / Germany borders

const loadGeoJSON = (map, events) => {
  fetch('../src/js/data/germany.geojson')
    .then((response) => {
      if (!response.ok) throw new Error('Failed to load GeoJSON');
      return response.json();
    })
    .then((data) => {
      L.geoJSON(data, {
        style: {
          color: '#1a73e8',
          weight: 2,
          fillColor: '#e8f0fe',
          fillOpacity: 0.5,
        },
        onEachFeature: (feature, layer) => {
          const regionName = feature.properties.name;
          const hasEvent = events.some((event) => event.geoRegion === regionName);

          if (hasEvent) {
            layer.on({
              mouseover: (e) => {
                e.target.setStyle({ fillColor: '#1a73e8', fillOpacity: 0.2 });
                L.DomEvent.stopPropagation(e);
              },
              mouseout: (e) => {
                const related = e.originalEvent.relatedTarget;
                // Keep highlight if cursor moves to a marker or label
                if (
                  related &&
                  (related.classList.contains('map-marker-inner') ||
                    related.classList.contains('map-label') ||
                    related.closest('.map-label'))
                ) {
                  return;
                }
                e.target.setStyle({ fillColor: '#e8f0fe', fillOpacity: 0.5 });
              },
            });
          }
        },
      }).addTo(map);
    })
    .catch((error) => console.error('GeoJSON error:', error));
};

//  Marker cluster

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

  // Show popup with list of events when cluster is clicked
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

//  Event markers & labels

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
    <p class="map-popup-date">${escapeHTML(event.date)}</p>
    <a href="event-detail.html?id=${escapeHTML(String(event.id))}&tmid=${escapeHTML(event.ticketmasterId)}"
       class="map-popup-link">
      Mehr erfahren →
    </a>
  </div>
`;

const addEventMarkers = (map, markers, events) => {
  const blueIcon = createBlueIcon();
  // Track added labels to avoid duplicates per region
  const addedLabels = new Set();

  events.forEach((event) => {
    // Add marker with popup
    const marker = L.marker([event.lat, event.lng], { icon: blueIcon });
    marker.bindPopup(createPopupContent(event), POPUP_OPTIONS);
    markers.addLayer(marker);

    // Add city label only once per region
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
