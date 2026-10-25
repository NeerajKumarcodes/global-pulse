const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const CURRENCY_URL = "https://api.frankfurter.dev/v2/rates";

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }
  return response.json();
}

export async function fetchWeather(location, signal) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m",
    hourly: "temperature_2m",
    forecast_days: "1",
    timezone: "auto",
  });
  const data = await fetchJson(`${WEATHER_URL}?${params}`, signal);
  if (!data.current || !Array.isArray(data.hourly?.time) || !Array.isArray(data.hourly?.temperature_2m)) {
    throw new Error("Weather data was incomplete. Please refresh to try again.");
  }
  return data;
}

export async function fetchAirQuality(location, signal) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "us_aqi,pm2_5,pm10",
    timezone: "auto",
  });
  const data = await fetchJson(`${AIR_QUALITY_URL}?${params}`, signal);
  if (!data.current) {
    throw new Error("Air quality data was incomplete. Please refresh to try again.");
  }
  return data;
}

export async function fetchCurrencyRates(signal) {
  const params = new URLSearchParams({ base: "USD", quotes: "INR,EUR,GBP,JPY" });
  const data = await fetchJson(`${CURRENCY_URL}?${params}`, signal);
  if (!Array.isArray(data)) {
    throw new Error("Exchange-rate data was incomplete. Please refresh to try again.");
  }
  return data;
}
