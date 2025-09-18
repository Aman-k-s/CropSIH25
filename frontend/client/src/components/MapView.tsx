// src/components/MapView.tsx
"use client";

import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import * as turf from "@turf/turf";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import "./MapView.css";
import { useFarm } from "@/context/FarmContext";

// ================= Map Click Handler =================
function MapClickHandler({
  onMapClick,
  isDrawing,
}: {
  onMapClick: (latlng: any) => void;
  isDrawing: boolean;
}) {
  useMapEvents({
    click(e) {
      if (isDrawing) onMapClick(e.latlng);
    },
  });
  return null;
}

// ================= Map Type Toggle =================
function MapTypeControl({
  mapType,
  setMapType,
}: {
  mapType: string;
  setMapType: (t: string) => void;
}) {
  const map = useMap();
  React.useEffect(() => {
    const Control = L.Control.extend({
      onAdd: function () {
        const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
        div.style.backgroundColor = "white";
        div.style.padding = "5px 10px";
        div.style.cursor = "pointer";
        div.style.borderRadius = "5px";
        div.style.fontSize = "14px";
        div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
        div.innerHTML =
          mapType === "street" ? "🛰️ Satellite" : "🌍 Street";
        div.onclick = () =>
          setMapType(mapType === "street" ? "satellite" : "street");
        L.DomEvent.disableClickPropagation(div);
        return div;
      },
    });
    const control = new Control({ position: "topleft" });
    map.addControl(control);
    return () => map.removeControl(control);
  }, [map, mapType, setMapType]);
  return null;
}

// ================= Search Control =================
function SearchControl() {
  const map = useMap();
  React.useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      autoClose: true,
      keepResult: true,
    });
    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);
  return null;
}

// ================= Main Component =================
export default function MapView() {
  const { setFarm } = useFarm();

  const [farmPolygon, setFarmPolygon] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [farmArea, setFarmArea] = useState(0);
  const [mapType, setMapType] = useState("street");
  const [cropType, setCropType] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const centerPosition: [number, number] = [28.6139, 77.209]; // Delhi

  // Handle clicks while drawing
  const handleMapClick = (latlng: any) => {
    if (isDrawing) {
      const newPoint = [latlng.lat, latlng.lng];
      const newPolygon = [...farmPolygon, newPoint];
      setFarmPolygon(newPolygon);

      if (newPolygon.length >= 3) {
        const coords = newPolygon.map((p) => [p[1], p[0]]);
        coords.push(coords[0]);
        setFarmArea(
          Number((turf.area(turf.polygon([coords])) / 10000).toFixed(2))
        );
      }
    }
  };

  // Toolbar
  const startDrawing = () => {
    setIsDrawing(true);
    setFarmPolygon([]);
    setFarmArea(0);
  };
  const finishDrawing = () => {
    if (farmPolygon.length >= 3) {
      setIsDrawing(false);
      const coords = farmPolygon.map((p) => [p[1], p[0]]);
      coords.push(coords[0]);
      setFarmArea(
        Number((turf.area(turf.polygon([coords])) / 10000).toFixed(2))
      );
    } else alert("Please select at least 3 points!");
  };
  const clearFarm = () => {
    setFarmPolygon([]);
    setIsDrawing(false);
    setFarmArea(0);
    setCropType("");
    setSubmitted(false);
  };
  const undoLastPoint = () => {
    if (farmPolygon.length > 0) setFarmPolygon(farmPolygon.slice(0, -1));
  };

  // Submit to backend
  const handleSubmit = async () => {
    if (farmPolygon.length < 3) {
      alert("⚠️ Please draw a farm boundary first.");
      return;
    }

    const farmData = {
      polygon: farmPolygon,
      cropType: cropType || null,
      area: farmArea,
    };

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(farmData),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const data = await res.json();
      console.log("✅ Farm submitted:", data);
      setSubmitted(true);
      alert("Farm submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("🚨 Error submitting farm data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mapview-container">
      {/* Toolbar */}
      <div className="toolbar">
        <button className="btn btn-green-700" onClick={startDrawing} disabled={isDrawing}>
          Start
        </button>
        <button className="btn btn-green-600" onClick={undoLastPoint} disabled={!isDrawing || farmPolygon.length === 0}>
          Undo
        </button>
        <button className="btn btn-green-500" onClick={finishDrawing} disabled={!isDrawing || farmPolygon.length < 3}>
          Finish
        </button>
        <button className="btn btn-green-800" onClick={clearFarm}>
          Clear
        </button>
      </div>

      {/* Optional Crop Input */}
      <div className="farm-info-inputs">
        <input
          type="text"
          placeholder="Enter Crop Type (optional)"
          value={cropType}
          onChange={(e) => setCropType(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={centerPosition}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <SearchControl />
          <MapTypeControl mapType={mapType} setMapType={setMapType} />
          <TileLayer
            url={
              mapType === "street"
                ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            }
            attribution={mapType === "street" ? "" : "Tiles © Esri"}
          />
          <MapClickHandler onMapClick={handleMapClick} isDrawing={isDrawing} />

          {/* Draw points */}
          {farmPolygon.map((point, idx) => (
            <CircleMarker
              key={idx}
              center={point}
              radius={5}
              pathOptions={{
                color: "#fff",
                fillColor: isDrawing ? "#ff5722" : "#4caf50",
                fillOpacity: 1,
              }}
            />
          ))}

          {/* Draw lines */}
          {farmPolygon.length >= 2 && (
            <Polyline
              positions={farmPolygon}
              pathOptions={{
                color: isDrawing ? "#ff5722" : "#4caf50",
                weight: 3,
                dashArray: isDrawing ? "6,6" : undefined,
              }}
            />
          )}

          {/* Draw polygon */}
          {!isDrawing && farmPolygon.length >= 3 && (
            <Polygon
              positions={farmPolygon}
              pathOptions={{
                color: "#4caf50",
                fillColor: "#4caf50",
                fillOpacity: 0.2,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Area Display */}
      <div className="area-display">
        {farmArea > 0 ? `Area: ${farmArea} hectares` : "No farm selected"}
      </div>

      {/* Coordinates */}
      {farmPolygon.length >= 3 && !isDrawing && (
        <div className="coords-display">
          <h4>Coordinates:</h4>
          <ul>
            {farmPolygon.map((point, idx) => (
              <li key={idx}>
                Lat: {point[0].toFixed(6)}, Lng: {point[1].toFixed(6)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      {farmPolygon.length >= 3 && !isDrawing && (
        <div className="submit-section">
          <button
            className="btn btn-green-600"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          {submitted && (
            <p className="text-green-700 mt-2">✅ Submitted!</p>
          )}
        </div>
      )}
    </div>
  );
}
