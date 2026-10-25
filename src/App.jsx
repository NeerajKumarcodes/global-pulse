import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  CloudSun,
  Coins,
  Gauge,
  Globe2,
  LayoutDashboard,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  Wind,
  X,
} from "lucide-react";
import { CURRENCIES, LOCATIONS } from "./data/locations.js";
import { fetchAirQuality, fetchCurrencyRates, fetchWeather } from "./services/api.js";
import { DataState, MetricCard } from "./components/MetricCard.jsx";

const WeatherChart = lazy(() => import("./components/WeatherChart.jsx"));

function useRemoteData(loader, dependencies) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [retryToken, setRetryToken] = useState(0);
  const retry = useCallback(() => setRetryToken((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: "" }));
    loader(controller.signal)
      .then((data) => setState({ data, loading: false, error: "", updatedAt: Date.now() }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ data: null, loading: false, error: error.message || "Unable to load data.", updatedAt: null });
        }
      });
    return () => controller.abort();
  }, [...dependencies, retryToken]);

  return { ...state, retry };
}

function formatValue(value, digits = 0) {
  return Number.isFinite(value) ? new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value) : "—";
}

function formatDateTime(value) {
  if (!value) return "—";
  const wallTime = /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ? value
    : `${value.length === 16 ? `${value}:00` : value}Z`;
  const date = new Date(wallTime);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(date);
}

function formatFetchTime(value) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value))
    : "—";
}

function formatRateDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function getAqiLabel(value) {
  if (!Number.isFinite(value)) return { label: "Unavailable", color: "text-slate-500", bg: "bg-slate-100" };
  if (value <= 50) return { label: "Good", color: "text-emerald-700", bg: "bg-emerald-50" };
  if (value <= 100) return { label: "Moderate", color: "text-amber-700", bg: "bg-amber-50" };
  if (value <= 150) return { label: "Unhealthy for sensitive groups", color: "text-orange-700", bg: "bg-orange-50" };
  if (value <= 200) return { label: "Unhealthy", color: "text-rose-700", bg: "bg-rose-50" };
  if (value <= 300) return { label: "Very unhealthy", color: "text-purple-700", bg: "bg-purple-50" };
  return { label: "Hazardous", color: "text-red-800", bg: "bg-red-50" };
}

function Sidebar({ open, onClose }) {
  const navGroups = [
    { title: "WORKSPACE", links: [{ label: "Overview", icon: LayoutDashboard, active: true }] },
    { title: "INTELLIGENCE", links: [
      { label: "Weather", icon: CloudSun },
      { label: "Air quality", icon: Wind },
      { label: "Currencies", icon: Coins },
    ] },
  ];
  return (
    <>
      {open && <button className="sidebar-overlay lg:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><Activity size={21} strokeWidth={2.4} /></div>
          <div><div className="brand-name">global<span>pulse</span></div><div className="brand-caption">INTELLIGENCE, IN FOCUS</div></div>
          <button className="sidebar-close lg:hidden" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="workspace-picker">
          <div className="workspace-avatar"><Globe2 size={17} /></div>
          <div className="min-w-0 flex-1"><p className="workspace-title">Global workspace</p><p className="workspace-subtitle">Personal dashboard</p></div>
          <ChevronDown size={15} className="text-slate-400" />
        </div>
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="nav-group">
              <p className="nav-heading">{group.title}</p>
              {group.links.map(({ label, icon: Icon, active }) => (
                <a key={label} href={label === "Overview" ? "#overview" : `#${label.toLowerCase().replace(" ", "-")}`} className={`nav-link ${active ? "nav-link-active" : ""}`} onClick={onClose}>
                  <Icon size={18} strokeWidth={1.9} /><span>{label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer" className="nav-link"><CircleHelp size={18} /><span>Data sources</span><ArrowUpRight size={13} className="ml-auto" /></a>
          <div className="sidebar-footer">
            <div className="avatar">GP</div>
            <div className="min-w-0 flex-1"><p className="workspace-title">Global Pulse</p><p className="workspace-subtitle">Free workspace</p></div>
            <ChevronDown size={15} className="text-slate-400" />
          </div>
        </div>
      </aside>
    </>
  );
}

function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="section-header">
      <div><p className="section-eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2>{subtitle && <p className="section-subtitle">{subtitle}</p>}</div>
      {action}
    </div>
  );
}

function AirQualityPanel({ air, loading, error, onRetry }) {
  const aqi = air?.current?.us_aqi;
  const classification = getAqiLabel(aqi);
  const scaleWidth = Number.isFinite(aqi) ? `${Math.min((aqi / 300) * 100, 100)}%` : "0%";
  return (
    <section className="panel" id="air-quality">
      <div className="panel-heading">
        <div><h2 className="panel-title">Air quality</h2><p className="panel-subtitle">Current conditions &amp; particulates</p></div>
        <div className="metric-icon metric-icon-green"><Wind size={19} /></div>
      </div>
      <DataState loading={loading} error={error} onRetry={onRetry} compact>
        <div className="aqi-overview">
          <div><p className="overline">US AIR QUALITY INDEX</p><div className="mt-1 flex items-baseline gap-2"><span className="aqi-value">{formatValue(aqi)}</span><span className="metric-unit">/ 500</span></div></div>
          <span className={`aqi-badge ${classification.color} ${classification.bg}`}>{classification.label}</span>
        </div>
        <div className="aqi-track" aria-label={Number.isFinite(aqi) ? `AQI ${aqi} out of 300 on the chart scale` : "AQI unavailable"}><span style={{ left: scaleWidth, display: Number.isFinite(aqi) ? "block" : "none" }} /></div>
        <div className="aqi-scale-labels"><span>Good</span><span>Moderate</span><span>Unhealthy</span><span>Hazardous</span></div>
        <div className="pollutant-grid">
          <div className="pollutant-item"><div className="pollutant-symbol">PM<span>2.5</span></div><p className="pollutant-name">Fine particles</p><p className="pollutant-value">{formatValue(air?.current?.pm2_5, 1)} <small>μg/m³</small></p></div>
          <div className="pollutant-item"><div className="pollutant-symbol">PM<span>10</span></div><p className="pollutant-name">Coarse particles</p><p className="pollutant-value">{formatValue(air?.current?.pm10, 1)} <small>μg/m³</small></p></div>
        </div>
        <div className="data-source"><span>Source: Open-Meteo Air Quality</span><span>{formatDateTime(air?.current?.time)} local</span></div>
      </DataState>
    </section>
  );
}

function CurrencyPanel({ rates, loading, error, onRetry, amount, setAmount, source, setSource, target, setTarget }) {
  const rateMap = useMemo(() => Object.fromEntries((rates || []).map((item) => [item.quote, item])), [rates]);
  const sourceRate = source === "USD" ? 1 : rateMap[source]?.rate;
  const targetRate = target === "USD" ? 1 : rateMap[target]?.rate;
  const converted = Number.isFinite(sourceRate) && sourceRate !== 0 && Number.isFinite(targetRate) && Number.isFinite(Number(amount))
    ? (Number(amount) / sourceRate) * targetRate
    : null;

  return (
    <section className="panel currency-panel" id="currencies">
      <div className="panel-heading">
        <div><h2 className="panel-title">Currency exchange</h2><p className="panel-subtitle">Reference rates against the US dollar</p></div>
        <div className="metric-icon metric-icon-violet"><Coins size={19} /></div>
      </div>
      <DataState loading={loading} error={error} onRetry={onRetry} compact>
        <>
          <div className="converter">
            <div className="converter-topline"><span>Quick converter</span><ArrowLeftRight size={15} /></div>
            <div className="converter-controls">
              <label className="converter-field"><span>AMOUNT</span><input aria-label="Amount to convert" type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
              <select aria-label="Source currency" value={source} onChange={(event) => setSource(event.target.value)}>{CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select>
              <ArrowLeftRight size={16} className="converter-arrow" />
              <select aria-label="Target currency" value={target} onChange={(event) => setTarget(event.target.value)}>{CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select>
              <div className="converter-result" aria-live="polite">{converted === null ? "Rate unavailable" : `${formatValue(converted, 2)} ${target}`}</div>
            </div>
          </div>
          <div className="rates-table-wrap">
            <table className="rates-table">
              <thead><tr><th>Currency</th><th>Rate</th><th className="text-right">Rate date</th></tr></thead>
              <tbody>
                {["INR", "EUR", "GBP", "JPY"].map((code) => {
                  const item = rateMap[code];
                  const flags = { INR: "🇮🇳", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵" };
                  const labels = { INR: "Indian rupee", EUR: "Euro", GBP: "British pound", JPY: "Japanese yen" };
                  return <tr key={code}><td><span className="currency-flag">{flags[code]}</span><span className="currency-code">{code}</span><span className="currency-name">{labels[code]}</span></td><td className="rate-value">{item ? formatValue(item.rate, code === "INR" || code === "JPY" ? 2 : 4) : "Unavailable"}</td><td className="rate-date">{item ? formatRateDate(item.date) : "—"}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <div className="data-source"><span>Source: Frankfurter API</span><span>Reference rates, not trading prices</span></div>
        </>
      </DataState>
    </section>
  );
}

function App() {
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState("1");
  const [source, setSource] = useState("USD");
  const [target, setTarget] = useState("INR");

  const weather = useRemoteData((signal) => fetchWeather(location, signal), [location, refreshToken]);
  const air = useRemoteData((signal) => fetchAirQuality(location, signal), [location, refreshToken]);
  const currencies = useRemoteData((signal) => fetchCurrencyRates(signal), [refreshToken]);

  const refreshAll = () => setRefreshToken((value) => value + 1);
  const successfulFetches = [weather.updatedAt, air.updatedAt, currencies.updatedAt].filter(Number.isFinite);
  const lastUpdated = successfulFetches.length ? formatFetchTime(Math.max(...successfulFetches)) : "—";
  const current = weather.data?.current;
  const airCurrent = air.data?.current;
  const aqiLabel = getAqiLabel(airCurrent?.us_aqi);
  const usdInr = currencies.data?.find((rate) => rate.quote === "INR");
  const unit = weather.data?.current_units;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>Overview</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-status"><Globe2 size={13} /> Public data sources</div>
            <div className="topbar-avatar">GP</div>
          </div>
        </header>

        <div className="dashboard">
          <div className="page-heading">
            <div>
              <div className="welcome-line"><span className="welcome-dot" /> YOUR WORLD, AT A GLANCE</div>
              <h1>{greeting}<span className="heading-period">.</span></h1>
              <p className="page-description">A current view of the signals shaping your world.</p>
            </div>
            <div className="heading-actions">
              <label className="location-select-wrap">
                <MapPin size={16} />
                <select aria-label="Select location" value={location.name} onChange={(event) => setLocation(LOCATIONS.find((item) => item.name === event.target.value))}>
                  {LOCATIONS.map((item) => <option value={item.name} key={item.name}>{item.name}, {item.country}</option>)}
                </select>
                <ChevronDown size={15} />
              </label>
              <button className="refresh-button" onClick={refreshAll} disabled={weather.loading || air.loading || currencies.loading}>
                <RefreshCw size={15} className={weather.loading || air.loading || currencies.loading ? "animate-spin" : ""} /> <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="city-banner">
            <div className="banner-content">
              <div className="banner-kicker"><span className="banner-pin"><MapPin size={13} /></span> YOUR LOCAL BRIEFING</div>
              <h2>{location.name}<span>, {location.country}</span></h2>
              <p>Conditions and indicators for your selected city</p>
            </div>
            <div className="banner-right">
              <div className="banner-weather-icon"><CloudSun size={35} strokeWidth={1.4} /></div>
              <div className="banner-temp-block">
                {weather.loading
                  ? <span className="spinner" role="status" aria-label="Loading current weather" />
                  : weather.error
                    ? <><span className="banner-temp">—</span><button className="banner-retry" onClick={weather.retry}>Retry</button></>
                    : <><span className="banner-temp">{Number.isFinite(current?.temperature_2m) ? formatValue(current.temperature_2m, 1) : "—"}°</span><span className="banner-feels">Feels like {Number.isFinite(current?.apparent_temperature) ? formatValue(current.apparent_temperature, 1) : "—"}°C</span></>}
              </div>
            </div>
            <div className="banner-decoration banner-decoration-one" /><div className="banner-decoration banner-decoration-two" />
          </div>

          <SectionHeader eyebrow="LIVE SNAPSHOT" title="Today at a glance" subtitle="Key indicators from your selected location." />
          <div className="metrics-grid" id="weather">
            <DataState loading={weather.loading} error={weather.error} onRetry={weather.retry} compact>
              <MetricCard label="Current temperature" value={Number.isFinite(current?.temperature_2m) ? formatValue(current.temperature_2m, 1) : "—"} unit={unit?.temperature_2m || "°C"} icon={CloudSun} tone="orange" detail={current ? <><MapPin size={13} /> {location.name}, India</> : "Weather data unavailable"} />
            </DataState>
            <DataState loading={weather.loading} error={weather.error} onRetry={weather.retry} compact>
              <MetricCard label="Feels like" value={Number.isFinite(current?.apparent_temperature) ? formatValue(current.apparent_temperature, 1) : "—"} unit={unit?.apparent_temperature || "°C"} icon={Gauge} tone="blue" detail={current ? <>Humidity {formatValue(current.relative_humidity_2m)}{unit?.relative_humidity_2m || "%"}</> : "Weather data unavailable"} />
            </DataState>
            <DataState loading={air.loading} error={air.error} onRetry={air.retry} compact>
              <MetricCard label="Air quality index" value={Number.isFinite(airCurrent?.us_aqi) ? formatValue(airCurrent.us_aqi) : "—"} unit="US AQI" icon={Wind} tone="green" detail={Number.isFinite(airCurrent?.us_aqi) ? <><span className={`aqi-mini-dot ${aqiLabel.color.replace("text-", "dot-")}`} /> {aqiLabel.label}</> : "AQI data unavailable"} />
            </DataState>
            <DataState loading={currencies.loading} error={currencies.error} onRetry={currencies.retry} compact>
              <MetricCard label="USD to INR" value={usdInr ? formatValue(usdInr.rate, 2) : "—"} unit="INR" icon={ArrowLeftRight} tone="violet" status="REFERENCE" detail={usdInr ? <>Rate date {formatRateDate(usdInr.date)}</> : "Rate unavailable"} />
            </DataState>
          </div>

          <div className="content-grid">
            <DataState loading={weather.loading} error={weather.error} onRetry={weather.retry}>
              {weather.data ? <Suspense fallback={<div className="panel chart-lazy-loading"><span className="spinner" />Loading chart…</div>}><WeatherChart weather={weather.data} locationName={location.name} /></Suspense> : <section className="panel"><h2 className="panel-title">Temperature forecast</h2></section>}
            </DataState>
            <AirQualityPanel air={air.data} loading={air.loading} error={air.error} onRetry={air.retry} />
          </div>

          <SectionHeader
            eyebrow="GLOBAL MARKETS"
            title="Currency exchange"
            subtitle="Reference rates for commonly tracked currencies."
            action={<span className="market-tag"><Globe2 size={14} /> Global rates</span>}
          />
          <CurrencyPanel
            rates={currencies.data}
            loading={currencies.loading}
            error={currencies.error}
            onRetry={currencies.retry}
            amount={amount}
            setAmount={setAmount}
            source={source}
            setSource={setSource}
            target={target}
            setTarget={setTarget}
          />

          <footer className="dashboard-footer">
            <div><span className="footer-indicator" /> Data refreshed from public sources <span className="footer-separator">·</span> Last successful fetch {lastUpdated}</div>
            <div className="footer-right"><Search size={14} /> Built for a clearer view</div>
          </footer>
          <p className="mobile-note">Rates shown are reference rates and may differ from market transaction prices.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
