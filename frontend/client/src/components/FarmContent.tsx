/*import { createContext, useContext, useState, ReactNode } from "react";

interface FarmContextType {
  farmPolygon: [number, number][];
  setFarmPolygon: (polygon: [number, number][]) => void;
  cropType: string;
  setCropType: (crop: string) => void;
  storage: string;
  setStorage: (storage: string) => void;
  farmArea: number;
  setFarmArea: (area: number) => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farmPolygon, setFarmPolygon] = useState<[number, number][]>([]);
  const [cropType, setCropType] = useState("");
  const [storage, setStorage] = useState("");
  const [farmArea, setFarmArea] = useState(0);

  return (
    <FarmContext.Provider
      value={{ farmPolygon, setFarmPolygon, cropType, setCropType, storage, setStorage, farmArea, setFarmArea }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) throw new Error("useFarm must be used within FarmProvider");
  return context;
}
*/


import React, { useState } from "react";
import { useFarm } from "@/context/FarmContext";

export function FarmContent() {
  const { farm, setFarm } = useFarm();
  const [cropType, setCropType] = useState(farm.cropType || "");
  const [storage, setStorage] = useState(farm.storage || "");

  const handleSave = () => {
    if (!cropType) return alert("Please enter crop type!");
    setFarm({ ...farm, cropType, storage });
    alert("Farm info saved!");
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Farm Details</h2>

      <input
        type="text"
        placeholder="Crop type"
        value={cropType}
        onChange={(e) => setCropType(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <input
        type="text"
        placeholder="Storage info"
        value={storage}
        onChange={(e) => setStorage(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={handleSave}
      >
        Save
      </button>
    </div>
  );
}
