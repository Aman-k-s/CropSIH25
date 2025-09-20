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
const API_TOKEN: string | undefined = (() => {
  // Try Vite
  try {
    // `import.meta` exists in Vite and some ESM runtimes — use `any` to avoid TS errors
    const viteKey = (import.meta as any)?.env?.VITE_OPENWEATHER_API_KEY;
    if (viteKey) return String(viteKey);
  } catch (e) {
    /* ignore */
  }

  // Try Next.js / webpack injected vars
  try {
    if (typeof process !== "undefined" && (process.env as any)) {
      const nextKey =
        (process.env as any).NEXT_PUBLIC_OPENWEATHER_API_KEY ||
        (process.env as any).OPENWEATHER_API_KEY;
      if (nextKey) return String(nextKey);
    }
  } catch (e) {
    /* ignore */
  }

  return undefined;
})();

export function FieldReport() {
  const { t } = useTranslation();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);

  // Fetch coordinates + weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (!API_TOKEN) {
          console.warn(
            "[FieldReport] OpenWeather API key missing. Set VITE_OPENWEATHER_API_KEY (Vite) or NEXT_PUBLIC_OPENWEATHER_API_KEY (Next.js)."
          );
          return;
        }

        // Get first coord from your backend (example endpoint)
        const coordRes = await fetch("http://localhost:8000/field/coord", {
          headers: {
            // If your backend requires auth, don't put the OpenWeather key here.
            // This header is placeholder; use your server's required auth.
            // Authorization: `Token ${API_TOKEN}`,
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
        const openWeatherKey = API_TOKEN;

        // Current weather
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(
            lat
          )}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(
            openWeatherKey
          )}&units=metric`
        );

        if (!weatherRes.ok) {
          console.warn("[FieldReport] OpenWeather current weather failed", weatherRes.status);
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
          console.warn("[FieldReport] forecast fetch failed", forecastRes.status);
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

  // Handle multiple file selection
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setSelectedFiles(filesArray);
    setPreviews(filesArray.map((file) => URL.createObjectURL(file)));

    // Placeholder pest detection response
    setResult(t("pest_detected"));
  };

  // Upload all selected files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return alert("Please select at least one file!");

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("images", file));

    try {
      const response = await fetch("http://localhost:5000/api/pest-detection", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setResult(data.message || t("pest_detected"));
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const handlePDFDownload = () => {
    alert("PDF report generation would be implemented here");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("field_report")}</h1>
        <Button onClick={handlePDFDownload} className="bg-primary hover:bg-primary/90">
          <Download className="mr-2 h-4 w-4" />
          {t("print_pdf")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Analysis Card */}
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
                <p className="text-sm text-muted-foreground">{t("analysis_result")}</p>
              </div>
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="text-xs text-muted-foreground">{t("health_score")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">0.7</div>
                  <div className="text-xs text-muted-foreground">NDVI</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources Grid */}
        <div className="space-y-4">
          <EEData />

          {/* Weather Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <Cloud className="mr-2 h-4 w-4 text-card-foreground" />
                <h4 className="font-medium text-card-foreground">{t("weather_data")}</h4>
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
                          {weather.main?.temp}°C, {weather.main?.humidity}% humidity
                        </p>
                      </div>
                      <div className="text-2xl">
                        {weather.weather?.[0]?.main === "Rain" ? "🌧️" : "☀️"}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Avoid irrigation tomorrow, as it might rain tomorrow</p>
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

        {/* Pest Detection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="mr-2 h-5 w-5" />
              {t("pest_detection")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex flex-wrap gap-2">
                {previews.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Crop ${idx}`}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                ))}
              </div>
              <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                {t("select_photos")}
                <input type="file" accept="image/*" multiple onChange={handleFilesChange} className="hidden" />
              </label>
              <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
                <Camera className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : t("scan")}
              </Button>
              {result && <p className="text-sm text-muted-foreground mt-2">{result}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Soil Health Card */}
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
                <p className="text-sm text-primary font-medium">{t("fertilizer_recommendation")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
