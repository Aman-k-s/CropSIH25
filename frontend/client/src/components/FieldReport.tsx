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
        const res = await fetch("http://localhost:8000/field/crop-health", {
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
    alert("Feature soon to be implemented. PDF Generation");
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
        {/* AI Analysis (Full width) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5 text-primary" />
              {t("ai_analysis")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("analysis_result")}
                </p>
              </div>
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="text-xs text-muted-foreground">
                    {t("health_score")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">0.7</div>
                  <div className="text-xs text-muted-foreground">NDVI</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Left column: EE + Weather */}
        <div className="space-y-4">
          <EEData />

          {/* Weather Card */}
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
        </div>


        {/* Left column: Soil Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Beaker className="mr-2 h-5 w-5" />
              {t("soil_health")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">6.5</div>
                  <div className="text-xs text-muted-foreground">pH</div>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <div className="text-lg font-bold text-secondary">120</div>
                  <div className="text-xs text-muted-foreground">N (kg/ha)</div>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <div className="text-lg font-bold text-accent">45</div>
                  <div className="text-xs text-muted-foreground">P (kg/ha)</div>
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  {t("fertilizer_recommendation")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Full width: Crop Health */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Beaker className="mr-2 h-4 w-4 text-card-foreground" />
              <h4 className="font-medium text-card-foreground">
                {t("Crop Health")}
              </h4>
            </div>
            <div className="bg-accent/10 rounded-lg p-4 space-y-3">
              {cropHealth ? (
                <>
                  <div className="flex flex-col space-y-2">
                    {Array.isArray(cropHealth) ? (
                      cropHealth.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="border-b border-accent/20 pb-2"
                        >
                          <p className="text-sm text-muted-foreground">
                            {item}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {cropHealth}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">loading...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
