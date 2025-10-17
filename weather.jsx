import React, { useEffect, useState, useMemo } from "react";

const API_KEY = "1e6e83dc7c8804159cf18a250edef8a7";
const OW_BASE = "https://api.openweathermap.org/data/2.5";

function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function pickMiddayEntries(list) {
  const byDay = {};
  for (const item of list) {
    const d = new Date(item.dt * 1000);
    const key = d.toISOString().slice(0, 10);
    byDay[key] ||= [];
    byDay[key].push(item);
  }
  const days = Object.keys(byDay)
    .sort()
    .map((day) => {
      const entries = byDay[day];
      const target = 12;
      let best = entries[0];
      let bestDiff = 99;
      for (const e of entries) {
        const hour = new Date(e.dt * 1000).getUTCHours();
        const diff = Math.abs(hour - target);
        if (diff < bestDiff) {
          best = e;
          bestDiff = diff;
        }
      }
      return best;
    });
  return days.slice(0, 5);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getWeather(city) {
  const q = encodeURIComponent(city);
  const [current, forecast] = await Promise.all([
    fetchJSON(`${OW_BASE}/weather?q=${q}&units=metric&appid=${API_KEY}`),
    fetchJSON(`${OW_BASE}/forecast?q=${q}&units=metric&appid=${API_KEY}`),
  ]);
  return { current, forecast };
}

function CurrentCard({ data }) {
  const w = data.weather?.[0];
  return (
    <div className="rounded-2xl bg-white shadow p-5 flex items-center gap-4">
      {w?.icon && <img src={iconUrl(w.icon)} alt={w.description} className="h-20 w-20" />}
      <div className="flex-1">
        <div className="text-xl font-semibold">{data.name}</div>
        <div className="text-5xl font-bold">{Math.round(data.main.temp)}°C</div>
        <div className="text-sm text-gray-600 capitalize">{w?.description}</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>Feels: {Math.round(data.main.feels_like)}°C</div>
          <div>Humidity: {data.main.humidity}%</div>
          <div>Wind: {Math.round(data.wind.speed)} m/s</div>
          <div>Min/Max: {Math.round(data.main.temp_min)}° / {Math.round(data.main.temp_max)}°C</div>
        </div>
      </div>
    </div>
  );
}

function Forecast({ list }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
      {list.map((item) => {
        const d = new Date(item.dt * 1000);
        const label = d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const w = item.weather?.[0];
        return (
          <div key={item.dt} className="rounded-2xl bg-white shadow p-4 flex flex-col items-center">
            <div className="font-medium">{label}</div>
            {w?.icon && <img src={iconUrl(w.icon)} alt={w.description} className="h-16 w-16" />}
            <div className="text-2xl font-semibold">{Math.round(item.main.temp)}°C</div>
            <div className="text-xs text-gray-600 capitalize">{w?.description}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState(null);

  const daily = useMemo(() => (forecast?.list ? pickMiddayEntries(forecast.list) : []), [forecast]);

  useEffect(() => {
    (async () => {
      try {
        const { current, forecast } = await getWeather("Vijayawada");
        setCurrent(current);
        setForecast(forecast);
      } catch (e) {
        setError("Failed to fetch weather. Check your API key or connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-slate-100 p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">🌤 Vijayawada Weather</h1>

      {loading && <p className="text-center text-gray-600">Loading weather...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {current && <CurrentCard data={current} />}
      {daily?.length > 0 && <Forecast list={daily} />}

      <footer className="mt-10 text-xs text-gray-500 text-center">
        Data by OpenWeather • Metric units • Demo app
      </footer>
    </div>
  );
}
