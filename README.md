# Global Pulse

A responsive global intelligence dashboard for weather, air quality, and currency reference rates. Global Pulse brings public data into one clear view, with Delhi, India selected by default.

## Features

- Current weather conditions and hourly temperature forecast
- US AQI with classification and PM2.5 / PM10 readings
- USD reference exchange rates against INR, EUR, GBP, and JPY
- Interactive currency converter
- Location selector for Delhi, Mumbai, Kolkata, and Bengaluru
- Loading, retry, and API error states; refresh action
- Responsive layout for desktop, tablet, and mobile
- No API keys, authentication, or database required

## Data sources

- [Open-Meteo Weather API](https://open-meteo.com/en/docs)
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
- [Frankfurter API](https://frankfurter.dev/)

Weather and air-quality values are model/API-provided measurements and forecasts, not necessarily readings from a nearby physical sensor. Frankfurter provides reference exchange rates, not live trading or guaranteed transaction prices. Data availability and update frequency depend on each public API.

## Getting started

Requirements: Node.js and npm.

```bash
git clone https://github.com/NeerajKumarcodes/global-pulse.git
cd global-pulse
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |

## Technology

React, Vite, JavaScript, Tailwind CSS, Recharts, and Lucide React.

## Project structure

```text
src/
  components/   Reusable dashboard cards and charts
  data/         Supported locations and currencies
  services/     Public API request functions
  App.jsx       Dashboard layout and data orchestration
  index.css     Global styles and responsive layout
  main.jsx      React entry point
```

## License

No license has been specified yet. All rights are reserved unless a license is added to this repository.
