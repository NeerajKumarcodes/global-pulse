import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatHour(value) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}:00Z`),
  );
}

function TemperatureTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="text-xs text-slate-500">{formatHour(label)}</p>
      <p className="mt-1 font-bold text-slate-900">{payload[0].value}°C</p>
    </div>
  );
}

export default function WeatherChart({ weather, locationName }) {
  const points = weather.hourly.time
    .map((time, index) => ({ time, temperature: weather.hourly.temperature_2m[index] }))
    .filter((point) => Number.isFinite(point.temperature));

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2 className="panel-title">Temperature forecast</h2>
          <p className="panel-subtitle">Hourly outlook for {locationName} · °C</p>
        </div>
        <span className="chart-legend"><span /> Temperature</span>
      </div>
      {points.length ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#edf0f4" strokeDasharray="4 5" />
              <XAxis
                dataKey="time"
                tickFormatter={formatHour}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8791a2", fontSize: 11 }}
                interval={3}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8791a2", fontSize: 11 }}
                tickFormatter={(value) => `${value}°`}
                domain={["dataMin - 2", "dataMax + 2"]}
                dx={-6}
              />
              <Tooltip content={<TemperatureTooltip />} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#6178e8"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#6178e8", stroke: "#fff", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : <p className="p-6 text-sm text-slate-500">Hourly temperature data is unavailable.</p>}
    </section>
  );
}
