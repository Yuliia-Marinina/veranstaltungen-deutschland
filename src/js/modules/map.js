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
                L.DomEvent.stopPropagation(e);
              },
              mouseout: (e) => {
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

  // Create marker cluster group
  const markers = L.markerClusterGroup({
    maxClusterRadius: 40,
    zoomToBoundsOnClick: false,
    iconCreateFunction: (cluster) => {
      return L.divIcon({
        html: `<div class="map-cluster">${cluster.getChildCount()}</div>`,
        className: 'map-cluster-wrap',
        iconSize: [36, 36],
      });
    },
  });

  // Show popup with list of events when cluster is clicked
  markers.on('clusterclick', (e) => {
    const childMarkers = e.layer.getAllChildMarkers();

    const popupContent = childMarkers
      .map((marker) => marker.getPopup().getContent())
      .join('<hr style="margin: 8px 0; border-color: #dadce0;">');

    L.popup({ autoPan: false })
      .setLatLng(e.layer.getLatLng())
      .setContent(`<div class="map-cluster-popup">${popupContent}</div>`)
      .openOn(e.layer._map);
  });

  // Add markers to cluster
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
    markers.addLayer(marker);
  });

  // Add cluster to map
  map.addLayer(markers);
};
