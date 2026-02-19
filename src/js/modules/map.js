import { events } from '../data/events.js';

export function initMap() {
    // Disable all interactions
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

    // Load Germany borders
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
        }).addTo(map);
        });

    // Custom blue marker
    const blueIcon = L.divIcon({
        className: 'map-marker',
        html: `<div class="map-marker-inner"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });

    // Add markers with city labels
    events.forEach((event) => {
        const marker = L.marker([event.lat, event.lng], { icon: blueIcon });

        marker.bindPopup(`
        <div class="map-popup">
            <p class="map-popup-region">${event.region}</p>
            <h3 class="map-popup-title">${event.title}</h3>
            <p class="map-popup-date">${event.date}</p>
        </div>
        `, { 
            autoPan: false,
            offset: L.point(0, -10),
         });

        // Add city label below marker
        const label = L.divIcon({
        className: 'map-label',
        html: `<span>${event.region}</span>`,
        iconAnchor: [-8, -4],
        });

        L.marker([event.lat, event.lng], { icon: label }).addTo(map);
        marker.addTo(map);
    });
}