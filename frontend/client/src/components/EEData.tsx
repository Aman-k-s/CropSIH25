"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Satellite } from "lucide-react"; // keeping this for the title icon
import {
  ActivityLogIcon,
  BarChartIcon,
  SunIcon,
  MixerHorizontalIcon,
  Half2Icon,
} from "@radix-ui/react-icons";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


export function EEData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFieldData = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/field/ee", {
          headers: { Authorization: `Token d5168cd4b604859db241e89734016b806393e69f` },
        });
        if (!res.ok) throw new Error("Failed to fetch field data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchFieldData();
  }, []);

  // Strongly typed chart data
  const chartData: ChartData<"line"> = {
    labels: data?.ndvi_time_series?.map((d: any) => d.date) || [],
    datasets: [
      {
        label: "NDVI",
        data: data?.ndvi_time_series?.map((d: any) => d.NDVI) || [],
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.2)",
        tension: 0.3,
        pointBackgroundColor: "#16a34a",
      },
    ],
  };

  // Strongly typed chart options
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top", labels: { color: "#065f46" } },
      title: { display: false },
    },
    scales: {
      x: { ticks: { color: "#065f46", maxRotation: 0 } },
      y: { min: 0, max: 1, ticks: { color: "#065f46" } },
    },
  };

  return (
    <Card className="bg-gradient-to-b from-green-50 to-white border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center text-green-700">
          <Satellite className="mr-2 h-5 w-5" />
          Field Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-green-500">Fetching field data...</p>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Stats */}
            <div className="space-y-3 text-sm text-green-800 font-medium">
              <div className="flex items-center gap-2">
                <ActivityLogIcon /> <span className="font-bold">NDVI:</span>{" "}
                {data.NDVI.toFixed(3)}
              </div>
              <div className="flex items-center gap-2">
                <BarChartIcon /> <span className="font-bold">EVI:</span>{" "}
                {data.EVI.toFixed(3)}
              </div>
              <div className="flex items-center gap-2">
                <MixerHorizontalIcon /> <span className="font-bold">Rainfall:</span>{" "}
                {data.rainfall_mm.toFixed(2)} mm
              </div>
              <div className="flex items-center gap-2">
                <SunIcon /> <span className="font-bold">Temperature:</span>{" "}
                {(data.temperature_K - 273.15).toFixed(1)} °C
              </div>
              <div className="flex items-center gap-2">
                <Half2Icon /> <span className="font-bold">Soil Moisture:</span>{" "}
                {data.soil_moisture.toFixed(3)}
              </div>
            </div>

            {/* NDVI Chart */}
            <div className="h-40">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-500">Failed to load data</p>
        )}
      </CardContent>
    </Card>
  );
}
