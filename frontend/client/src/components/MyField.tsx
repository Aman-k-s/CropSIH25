import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import MapView from "./MapView";
import { Mic, MicOff } from "lucide-react";

export function MyField() {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState("");

  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useVoiceRecording();

  const crops = [
    { value: "wheat", label: "Wheat / गेहूं / ਕਣਕ" },
    { value: "rice", label: "Rice / चावल / ਚਾਵਲ" },
    { value: "maize", label: "Maize / मक्का / ਮੱਕੀ" },
    { value: "cotton", label: "Cotton / कपास / ਕਪਾਹ" },
    { value: "sugarcane", label: "Sugarcane / गन्ना / ਗੰਨਾ" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {t("my_field")}
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Field Information Panel */}
        {/* Map Interface */}
        <div className="xl:col-span-2">
          <MapView />
        </div>
        <div className="xl:col-span-1 space-y-6">
          {/* Crop Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t("crop_type")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger data-testid="select-crop-type">
                  <SelectValue placeholder={t("select_crop")} />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop.value} value={crop.value}>
                      {crop.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
