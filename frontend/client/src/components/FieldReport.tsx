// src/components/FieldReport.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Bot,
  Satellite,
  Cloud,
  Bug,
  Beaker,
  Camera,
  Download,
} from "lucide-react";
import { EEData } from "./EEData";

/**
 * Safely resolve the client-side API key depending on bundler/framework:
 * - Vite: import.meta.env.VITE_OPENWEATHER_API_KEY
 * - Next.js: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
 *
 * WARNING: any key available to client-side JS is exposed to users. For production,
 * prefer proxying requests through your server so the API key remains secret.
 */
const API_TOKEN = process.env.AUTH_TOKEN;

export function FieldReport() {
  const { t } = useTranslation();

  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [cropHealth, setCropHealth] = useState<string | string[] | null>(null);

  const [soilInputs, setSoilInputs] = useState({
  N: "",
  P: "",
  K: "",
  pH: "",
});
const [soilSubmitted, setSoilSubmitted] = useState(false);
const handleSoilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSoilInputs({ ...soilInputs, [e.target.name]: e.target.value });
};

const handleSoilSubmit = () => {
  setSoilSubmitted(true);
};

// Placeholder advice logic
const getSoilAdvice = () => {
  const adviceList: string[] = [];
  if (+soilInputs.pH < 6) adviceList.push("Soil is acidic. Consider liming.");
  else if (+soilInputs.pH > 7.5) adviceList.push("Soil is alkaline. Consider organic matter.");

  if (+soilInputs.N < 100) adviceList.push("Nitrogen is low. Add N fertilizer.");
  if (+soilInputs.P < 50) adviceList.push("Phosphorus is low. Add P fertilizer.");
  if (+soilInputs.K < 50) adviceList.push("Potassium is low. Add K fertilizer.");

  if (adviceList.length === 0) adviceList.push("Soil nutrients are adequate.");
  return adviceList;
};


  // Fetch coordinates + weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (!API_TOKEN) {
          console.warn("[FieldReport] OpenWeather API key missing");
          return;
        }

        // Get first coord from your backend (example endpoint)
        const coordRes = await fetch("http://localhost:8000/field/coord", {
          headers: {
            Authorization: `Token d5168cd4b604859db241e89734016b806393e69f`,
          },
        });

        if (!coordRes.ok) {
          console.warn("[FieldReport] coord endpoint failed:", coordRes.status);
          return;
        }

        const coordData = await coordRes.json();
        // Expect server to return coord as [lon, lat] or { lon, lat } — adapt if needed.
        const coord = coordData?.coord || coordData?.location || null;
        let lon: number | undefined;
        let lat: number | undefined;
        if (Array.isArray(coord)) {
          [lon, lat] = coord;
        } else if (coord && typeof coord === "object") {
          lon = coord.lon ?? coord.lng ?? coord.x;
          lat = coord.lat ?? coord.y;
        }

        if (lat === undefined || lon === undefined) {
          console.warn("[FieldReport] invalid coord from server:", coordData);
          return;
        }

        // Use env key here (client-side). For security, prefer calling your own server route
        // that uses the secret key and forwards a sanitized weather response.
        const openWeatherKey = "556670b48ccab73ece536515735bedbf";

        // Current weather
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(
            lat
          )}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(
            openWeatherKey
          )}&units=metric`
        );

        if (!weatherRes.ok) {
          console.warn(
            "[FieldReport] OpenWeather current weather failed",
            weatherRes.status
          );
          return;
        }
        const weatherData = await weatherRes.json();

        // Hourly forecast (note: free OpenWeather does not expose pro/hourly endpoint;
        // you might want to use One Call API / forecast endpoint instead)
        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${encodeURIComponent(
            lat
          )}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(
            openWeatherKey
          )}&units=metric`
        );

        let forecastData: any = {};
        if (forecastRes.ok) {
          forecastData = await forecastRes.json();
        } else {
          console.warn(
            "[FieldReport] forecast fetch failed",
            forecastRes.status
          );
        }

        // set state
        setWeather(weatherData);
        setForecast(forecastData.list?.slice(0, 3) || []); // take next 3 periods
      } catch (err) {
        console.error("Weather fetch error:", err);
      }
    };

    fetchWeather();
  }, []);

  //Crop Health
  useEffect(() => {
    const fetchCropHealth = async () => {
      try {
        const res = await fetch("http://localhost:8000/field/healthscore", {
          headers: {
            Authorization: `Token d5168cd4b604859db241e89734016b806393e69f`,
          },
        });

        if (!res.ok) {
          console.warn("[FieldReport] crop health fetch failed:", res.status);
          return;
        }

        const data = await res.json();
        setCropHealth(data?.message || data); // try to handle both object or simple text
      } catch (err) {
        console.error("Crop health fetch error:", err);
      }
    };

    fetchCropHealth();
  }, []);

  const handlePDFDownload = () => {
    window.print();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t("field_report")}
        </h1>
        <Button
          onClick={handlePDFDownload}
          className="bg-primary hover:bg-primary/90"
        >
          <Download className="mr-2 h-4 w-4" />
          {t("print_pdf")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top: AI Crop Analysis full width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5 text-primary" />
              AI Crop Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Sidebar: 30% */}
              <div className="lg:w-1/3 bg-muted/50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-2 bg-white rounded shadow">
                    <div className="text-3xl font-bold text-primary">{cropHealth}</div>
                    <div className="text-sm text-muted-foreground">
                      Health Score
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white rounded shadow">
                    <div className="text-2xl font-bold text-secondary">1.2</div>
                    <div className="text-sm text-muted-foreground">Stress</div>
                  </div>
                </div>
              </div>

              {/* Main Content: 70% */}
              <div className="lg:w-2/3 bg-muted/50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">
                  Satellite imagery indicates healthy vegetation across the
                  majority of the field. Minor dry patches observed in the
                  northeast section. Pest activity detected in low intensity
                  areas.
                </p>
                <p className="text-sm text-muted-foreground">
                  Soil moisture levels are adequate with slight variability.
                  Fertilizer application is recommended in low nutrient zones.
                </p>
                <p className="text-sm text-muted-foreground">
                  Overall crop health is stable. No immediate intervention
                  required except monitoring water and pest levels.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Left Column: Field Summary (EEData) full height */}
        <div className="flex flex-col space-y-4 h-[calc(100vh-96px)]">
          <EEData/>
        </div>

        {/* Right Column */}
        <div className="flex flex-col space-y-4">
          {/* Weather Card on top */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <Cloud className="mr-2 h-4 w-4 text-card-foreground" />
                <h4 className="font-medium text-card-foreground">
                  {t("weather_data")}
                </h4>
              </div>
              <div className="bg-accent/10 rounded-lg p-4 space-y-3">
                {weather ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-accent">
                          {weather.weather?.[0]?.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {weather.main?.temp}°C, {weather.main?.humidity}%
                          humidity
                        </p>
                      </div>
                      <div className="text-2xl">
                        {weather.weather?.[0]?.main === "Rain" ? "🌧️" : "☀️"}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Avoid irrigation tomorrow, as it might rain tomorrow
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {forecast.map((f, i) => (
                          <li key={i} className="flex justify-between">
                            <span>
                              {new Date(f.dt * 1000).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>{f.main?.temp}°C</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">'loading...'</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Soil Health / Fertilizer below Weather */}
          <Card>
  <CardHeader>
    <CardTitle className="flex items-center text-lg font-semibold">
      <Beaker className="mr-2 h-5 w-5" />
      Soil Health & Fertilizer Input
    </CardTitle>
  </CardHeader>
  <CardContent>
    {!soilSubmitted ? (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {["N", "P", "K", "pH"].map((key) => (
            <div key={key} className="flex flex-col">
              <label className="text-sm font-medium text-muted-foreground">
                {key} Value
              </label>
              <input
                type="number"
                name={key}
                value={(soilInputs as any)[key]}
                onChange={handleSoilChange}
                className="border rounded px-2 py-1"
                placeholder={`Enter ${key}`}
                step={key === "pH" ? "0.1" : "1"}
              />
            </div>
          ))}
        </div>
        <Button
          onClick={handleSoilSubmit}
          className="bg-primary text-white hover:bg-primary/90"
        >
          Submit
        </Button>
      </div>
    ) : (
      <div className="space-y-4">
        {/* Display all 4 values in a single row */}
        <div className="flex justify-between gap-4 text-center">
          <div className="flex-1 p-3 bg-primary/10 rounded-lg">
            <div className="text-lg font-bold text-primary">{soilInputs.pH}</div>
            <div className="text-xs text-muted-foreground">pH</div>
          </div>
          <div className="flex-1 p-3 bg-secondary/10 rounded-lg">
            <div className="text-lg font-bold text-secondary">{soilInputs.N}</div>
            <div className="text-xs text-muted-foreground">N (kg/ha)</div>
          </div>
          <div className="flex-1 p-3 bg-accent/10 rounded-lg">
            <div className="text-lg font-bold text-accent">{soilInputs.P}</div>
            <div className="text-xs text-muted-foreground">P (kg/ha)</div>
          </div>
          <div className="flex-1 p-3 bg-amber-10 rounded-lg">
            <div className="text-lg font-bold text-amber-700">{soilInputs.K}</div>
            <div className="text-xs text-muted-foreground">K (kg/ha)</div>
          </div>
        </div>

        {/* Advice Section */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Advice:</h4>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {getSoilAdvice().map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => setSoilSubmitted(false)}
          className="bg-gray-200 hover:bg-gray-300"
        >
          Edit
        </Button>
      </div>
    )}
  </CardContent>
</Card>


        </div>
      </div>
    </div>
  );
}
