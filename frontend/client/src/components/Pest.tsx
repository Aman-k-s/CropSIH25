"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, Camera, AlertTriangle, Activity, ShieldAlert } from "lucide-react";

export function Pest() {
  // Mock translation function to resolve the import error
  const t = (key: string) => ({
    "Agro_Alerts": "Agro Alerts",
    "pest_detection": "Pest Detection",
    "select_photos": "Select Photos",
    "scan": "Scan",
    "Pest Prediction": "Pest Prediction",
  }[key] || key);

  // States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any | null>(null); // State to hold the API JSON response
  const [pestPrediction, setPestPrediction] = useState<any[]>([]);

  // Pest Prediction
  useEffect(() => {
    const fetchPestPrediction = async () => {
      try {
        const pestRes = await fetch("http://localhost:8000/field/pestpredict", {
          headers: {
            Authorization: `Token d5168cd4b604859db241e89734016b806393e69f`,
          },
        });

        if (!pestRes.ok) return console.warn("[Pest] pest prediction failed");

        const pestData = await pestRes.json();
        setPestPrediction(pestData);
      } catch (err) {
        console.error("Pest prediction fetch error:", err);
      }
    };

    fetchPestPrediction();
  }, []);

  // File selection
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setSelectedFiles(filesArray);
    setPreviews(filesArray.map((file) => URL.createObjectURL(file)));
    setDetectionResult(null); // Clear previous results on new file selection
  };

  // File upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file!");
      return;
    }
    setUploading(true);
    setDetectionResult(null); // Clear previous results before a new upload

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("image", file));

    try {
      const response = await fetch("http://localhost:8000/pest", {
        method: "POST",
        headers: {
          'Authorization': `Token d5168cd4b604859db241e89734016b806393e69f`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setDetectionResult(data); // Store the full JSON response
    } catch (error: any) {
      // Store error object to display it in the UI
      setDetectionResult({ error: error.message || "Something went wrong" });
    } finally {
      setUploading(false);
    }
  };

  // Mock Agro Alerts data
  const agroAlerts = [
    { type: "Pest Outbreak", location: "Kollam", description: "Locust swarm reported", icon: <Activity className="h-4 w-4 text-red-600" /> },
    { type: "Cattle Disease", location: "Kottayam", description: "Foot and Mouth Disease alert", icon: <ShieldAlert className="h-4 w-4 text-yellow-600" /> },
    { type: "Pest Outbreak", location: "Alappuzha", description: "Fall Armyworm detected", icon: <Activity className="h-4 w-4 text-red-600" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Agro Alerts Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
            {t("Agro_Alerts")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {agroAlerts.map((alert, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg shadow-sm hover:shadow-md transition">
              <div className="flex items-center space-x-2">
                {alert.icon}
                <div>
                  <p className="text-sm font-medium text-red-700">{alert.type}</p>
                  <p className="text-xs text-muted-foreground">{alert.location}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Detection + Prediction - side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pest Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="mr-2 h-5 w-5 text-green-700" />
              {t("pest_detection")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex flex-wrap gap-2">
                {previews.map((url, idx) => (
                  <img key={idx} src={url} alt={`Crop ${idx}`} className="w-24 h-24 object-cover rounded-lg border" />
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
              
              {/* Display API result in a presentable format */}
              {detectionResult && (
                <div className="mt-4 w-full text-left bg-gray-100 p-3 rounded-md border border-gray-300">
                  <h4 className="font-semibold text-gray-800 text-md mb-2">Detection Result:</h4>
                  {detectionResult.error ? (
                    <p className="text-sm text-red-600 font-medium">{detectionResult.error}</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">Status: </span>
                        <span className={`font-bold ${detectionResult.class === 'Healthy' ? 'text-green-600' : 'text-red-600'}`}>
                          {detectionResult.class}
                        </span>
                      </p>
                      {/* <p className="text-sm">
                        <span className="font-medium text-gray-600">Confidence: </span>
                        <span className="font-semibold text-gray-800">
                          {`${(detectionResult.probability * 100).toFixed(2)}%`}
                        </span>
                      </p> */}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pest Prediction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="mr-2 h-5 w-5 text-blue-700" />
              {t("Pest Prediction")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              {pestPrediction.length > 0 ? (
                <div className="flex flex-col space-y-2">
                  {pestPrediction.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b border-blue-200 pb-2">
                      <span className="font-medium text-blue-700">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{item.probability}%</span>
                    </div>
                  ))}
                </div>
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

