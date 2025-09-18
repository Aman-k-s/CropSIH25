// src/context/FarmContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

interface FarmData {
  polygon: [number, number][];
  area: number;
  cropType: string;
  storage: string;
}

interface FarmContextType {
  farm: FarmData;
  setFarm: (data: Partial<FarmData>) => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider = ({ children }: { children: ReactNode }) => {
  const [farm, setFarmState] = useState<FarmData>({
    polygon: [],
    area: 0,
    cropType: "",
    storage: "",
  });

  const setFarm = (data: Partial<FarmData>) => {
    setFarmState((prev) => ({ ...prev, ...data }));
  };

  return (
    <FarmContext.Provider value={{ farm, setFarm }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error("useFarm must be used within a FarmProvider");
  }
  return context;
};
