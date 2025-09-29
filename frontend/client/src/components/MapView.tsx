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

const token = "d5168cd4b604859db241e89734016b806393e69f";

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
        div.innerHTML = mapType === "street" ? "🛰️ Satellite" : "🌍 Street";
        div.onclick = () => setMapType(mapType === "street" ? "satellite" : "street");
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
export default function MapView({ cropType }: { cropType: string }) {
  const [farmPolygon, setFarmPolygon] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [farmArea, setFarmArea] = useState(0);
  const [mapType, setMapType] = useState("street");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const centerPosition: [number, number] = [9.1632, 76.6413]; // Kerala

  const handleMapClick = (latlng: any) => {
    if (isDrawing) {
      const newPoint = [latlng.lat, latlng.lng];
      const newPolygon = [...farmPolygon, newPoint];
      setFarmPolygon(newPolygon);

      if (newPolygon.length >= 3) {
        const coords = newPolygon.map((p) => [p[1], p[0]]);
        coords.push(coords[0]);
        setFarmArea(Number((turf.area(turf.polygon([coords])) / 10000).toFixed(2)));
      }
    }
  };

  // Toolbar
  const startDrawing = () => {
    setIsDrawing(true);
    setFarmPolygon([]);
    setFarmArea(0);
    setSubmitted(false);
  };
  const finishDrawing = () => {
    if (farmPolygon.length >= 3) {
      setIsDrawing(false);
      const coords = farmPolygon.map((p) => [p[1], p[0]]);
      coords.push(coords[0]);
      setFarmArea(Number((turf.area(turf.polygon([coords])) / 10000).toFixed(2)));
    } else alert("Please select at least 3 points!");
  };
  const clearFarm = () => {
    setFarmPolygon([]);
    setIsDrawing(false);
    setFarmArea(0);
    setSubmitted(false);
  };
  const undoLastPoint = () => {
    if (farmPolygon.length > 0) setFarmPolygon(farmPolygon.slice(0, -1));
  };

  // ================= Submit =================
  const handleSubmit = async () => {
    if (farmPolygon.length < 3) {
      alert("⚠️ Please draw a farm boundary first.");
      return;
    }

    if (!cropType) {
      alert("⚠️ Please select a crop type.");
      return;
    }

    const polygonGeoJSON = {
      type: "Polygon",
      coordinates: [
        [
          ...farmPolygon.map((p) => [p[1], p[0]]),
          [farmPolygon[0][1], farmPolygon[0][0]],
        ],
      ],
    };

    const farmData = {
      polygon: polygonGeoJSON,
      cropType: cropType,
      area: farmArea,
    };

    try {
      setLoading(true);

      const res = await fetch("http://127.0.0.1:8000/field/set_polygon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(farmData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit polygon");
      }

      const data = await res.json();
      console.log("✅ Polygon saved:", data);
      setSubmitted(true);
      setIsDrawing(false);
      alert("✅ Farm polygon submitted successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`🚨 Error submitting farm data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mapview-container">
      <div className="toolbar">
        <button className="btn btn-green-700" onClick={startDrawing} disabled={isDrawing}>Start</button>
        <button className="btn btn-green-600" onClick={undoLastPoint} disabled={!isDrawing || farmPolygon.length === 0}>Undo</button>
        <button className="btn btn-green-500" onClick={finishDrawing} disabled={!isDrawing || farmPolygon.length < 3}>Finish</button>
        <button className="btn btn-green-800" onClick={clearFarm}>Clear</button>
      </div>

      <div className="map-container">
        <MapContainer center={centerPosition} zoom={8} style={{ height: "100%", width: "100%" }}>
          <SearchControl />
          <MapTypeControl mapType={mapType} setMapType={setMapType} />
          <TileLayer
            url={mapType === "street"
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
            attribution={mapType === "street" ? "" : "Tiles © Esri"}
          />
          <MapClickHandler onMapClick={handleMapClick} isDrawing={isDrawing} />

          {farmPolygon.map((point, idx) => (
            <CircleMarker
              key={idx}
              center={point}
              radius={5}
              pathOptions={{ color: "#fff", fillColor: isDrawing ? "#ff5722" : "#4caf50", fillOpacity: 1 }}
            />
          ))}

          {farmPolygon.length >= 2 && (
            <Polyline
              positions={farmPolygon}
              pathOptions={{ color: isDrawing ? "#ff5722" : "#4caf50", weight: 3, dashArray: isDrawing ? "6,6" : undefined }}
            />
          )}

          {!isDrawing && farmPolygon.length >= 3 && (
            <Polygon positions={farmPolygon} pathOptions={{ color: "#4caf50", fillColor: "#4caf50" }} />
          )}
        </MapContainer>
      </div>

      <div className="area-display">{farmArea > 0 ? `Area: ${farmArea} hectares` : "No farm selected"}</div>

      {farmPolygon.length >= 3 && !isDrawing && (
        <div className="submit-section">
          <button className="btn btn-green-600" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          {submitted && <p className="text-green-700 mt-2">✅ Submitted!</p>}
        </div>
      )}
    </div>
  );
}
