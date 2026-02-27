# Events in Germany 🇩🇪

A web application for discovering upcoming events across Germany, featuring real-time weather data, water level monitoring, and an interactive map.

🔗 **Live Demo:** https://yuliia-marinina.github.io/veranstaltungen-deutschland

---

## About

This project was created as a portfolio piece and serves as a foundation for a real-world application developed with **Kirby CMS** — a flat-file CMS with PHP integration.

The application focuses on events in the Wattenmeer region of Germany, where tidal data (Hochwasser/Niedrigwasser) plays an important role. A **Tidenkalender** (tidal calendar) feature is currently in development.

---

## Features

- 🎭 **Real Events** — Live data from Ticketmaster API
- 🗺️ **Interactive Map** — Germany map with event markers and clustering
- 🌤️ **Weather Forecast** — 3-day forecast via Open-Meteo API
- 🌊 **Water Level** — Real-time monitoring via Pegelonline API
- 🔍 **Search & Filter** — Filter by city, category and sort by date
- 📄 **Event Detail Page** — Full event info with map, weather and tickets link
- 🌊 **Tidenkalender** _(in development)_ — Hochwasser & Niedrigwasser times for the Wattenmeer

---

## Tech Stack

- **Vanilla JavaScript** (ES Modules)
- **SCSS** (BEM-like architecture)
- **Leaflet.js** — interactive maps
- **Leaflet MarkerCluster** — marker clustering
- **Chart.js** — water level chart
- **Ticketmaster API** — event data
- **Open-Meteo API** — weather forecast
- **Pegelonline API** — water level data
- **Nominatim API** — reverse geocoding

---

## Project Structure

```
veranstaltungen-deutschland/
├── index.html
├── event-detail.html
├── src/
│   ├── js/
│   │   ├── data/          # Static data & GeoJSON
│   │   ├── modules/       # UI modules (map, weather, filters)
│   │   ├── utils/         # API calls & helpers
│   │   ├── main.js        # Main entry point
│   │   └── main-detail.js # Event detail entry point
│   └── scss/
│       ├── base/          # Variables, mixins, reset
│       ├── components/    # Cards, buttons, filters
│       ├── layout/        # Header, footer
│       └── pages/         # Page-specific styles
```

---

## APIs Used

| API          | Purpose           | Docs                                       |
| ------------ | ----------------- | ------------------------------------------ |
| Ticketmaster | Event data        | [docs](https://developer.ticketmaster.com) |
| Open-Meteo   | Weather forecast  | [docs](https://open-meteo.com)             |
| Pegelonline  | Water levels      | [docs](https://pegelonline.wsv.de)         |
| Nominatim    | Reverse geocoding | [docs](https://nominatim.org)              |

---

## Getting Started

```bash
# Install dependencies
npm install

# Compile SCSS (watch mode)
npm run sass

# Create config file with your API key
# src/js/config.js
export const CONFIG = {
  TICKETMASTER_API_KEY: 'your_api_key_here',
};
```

---

## Author

**Yuliia Marinina** — Frontend Developer
🔗 [GitHub](https://github.com/Yuliia-Marinina)
