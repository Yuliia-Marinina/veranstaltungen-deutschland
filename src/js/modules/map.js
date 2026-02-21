import { events } from '../data/events.js';

export function initMap() {
  const map = L.map('germany-map', {
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    attributionControl: false,
  }).setView([51.1657, 10.4515], 5.5);

  // Load Germany borders with hover effect
  fetch('../src/js/data/germany.geojson')
    .then((response) => response.json())
    .then((data) => {
      L.geoJSON(data, {
        style: {
          color: '#1a73e8',
          weight: 2,
          fillColor: '#e8f0fe',
          fillOpacity: 0.5,
        },
        // Hover effects on each region
        onEachFeature: (feature, layer) => {
          const regionName = feature.properties.name;

          const hasEvent = events.some((event) => event.geoRegion === regionName);

          if (hasEvent) {
            layer.on({
              mouseover: (e) => {
                e.target.setStyle({
                  fillColor: '#1a73e8',
                  fillOpacity: 0.2,
                });
                // Prevent event from bubbling
                L.DomEvent.stopPropagation(e);
              },
              mouseout: (e) => {
                // Check if mouse moved to marker, not outside region
                const relatedTarget = e.originalEvent.relatedTarget;
                if (
                  relatedTarget &&
                  (relatedTarget.classList.contains('map-marker-inner') ||
                    relatedTarget.classList.contains('map-label') ||
                    relatedTarget.closest('.map-label'))
                ) {
                  return;
                }
                e.target.setStyle({
                  fillColor: '#e8f0fe',
                  fillOpacity: 0.5,
                });
              },
            });
          }
        },
      }).addTo(map);
    });

  // Custom blue marker
  const blueIcon = L.divIcon({
    className: 'map-marker',
    html: `<div class="map-marker-inner"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  // Add markers with links to events
  events.forEach((event) => {
    const marker = L.marker([event.lat, event.lng], { icon: blueIcon });

    marker.bindPopup(
      `
        <div class="map-popup">
            <p class="map-popup-region">${event.region}</p>
            <h3 class="map-popup-title">${event.title}</h3>
            <p class="map-popup-date">${event.date}</p>
            <a href="event-detail.html?id=${event.id}" class="map-popup-link">
            Mehr erfahren →
            </a>
        </div>
        `,
      { autoPan: false },
    );

    // City label
    const label = L.divIcon({
      className: 'map-label',
      html: `<span>${event.region}</span>`,
      iconAnchor: [-8, -4],
    });

    L.marker([event.lat, event.lng], { icon: label }).addTo(map);
    marker.addTo(map);
  });
}
