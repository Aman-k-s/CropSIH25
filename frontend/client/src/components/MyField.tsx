import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import MapView from "./MapView";

export function MyField() {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedIrrigation, setSelectedIrrigation] = useState("");
  const [selectedSoil, setSelectedSoil] = useState("");

  const crops = [
    { value: "rice", label: "Rice / चावल / അരി" },
    { value: "coconut", label: "Coconut / नारियल / തേങ്ങ" },
    { value: "banana", label: "Banana / केला / വാഴപ്പഴം" },
    { value: "black_pepper", label: "Black Pepper / काली मिर्च / കുരുമുളക്" },
    { value: "cardamom", label: "Cardamom / इलायची / ഏലക്ക" },
    { value: "coffee", label: "Coffee / कॉफ़ी / കോഫി" },
    { value: "tea", label: "Tea / चाय / ചായ" },
    { value: "rubber", label: "Rubber / रबड़ / റബ്ബർ" },
    { value: "arecanut", label: "Arecanut / सुपारी / അടക്ക" },
    { value: "tapioca", label: "Tapioca / कसावा / കപ്പ" },
    { value: "ginger", label: "Ginger / अदरक / ഇഞ്ചി" },
    { value: "turmeric", label: "Turmeric / हल्दी / മഞ്ഞൾ" },
  ];

  const soilTypes = [
    { value: "loamy", label: "Loamy / दोमट / ലോമി" },
    { value: "clay", label: "Clay / मिट्टी / മണ്ണ്" },
    { value: "laterite", label: "Laterite / लेटराइट / ലാറ്ററൈറ്റ്" },
    { value: "sandy", label: "Sandy / रेतीला / മണൽ" },
    { value: "peaty", label: "Peaty / पीटी / പീറ്റി" },
  ];

  const irrigationTypes = [
    { value: "drip", label: "Drip / ड्रिप / ഡ്രിപ്പ്" },
    { value: "sprinkler", label: "Sprinkler / स्प्रिंकलर / സ്‌പ്രിങ്ക്ലർ" },
    { value: "flood", label: "Flood / बाढ़ / വെള്ളപ്പൊക്കം" },
    { value: "manual", label: "Manual / मैनुअल / മാനുവൽ" },
    { value: "basin", label: "Basin / बेसिन / ബേസിൻ" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {t("my_field")}
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map Interface - untouched */}
        <div className="xl:col-span-2">
          {/* RAKSHIT ADD THE SOIL TYPE AND IRRIGATION TYPE BELOW  */}
          <MapView
            cropType={selectedCrop}
            soilType={selectedSoil}
            irrigationType={selectedIrrigation}
          />
        </div>

        {/* Right Column: Crop, Soil, Irrigation stacked vertically */}
        <div className="flex flex-col space-y-6 mt-8">
          {/* Crop Selection */}
          <Card className="mt-8">
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

          {/* Soil Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t("soil_type")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSoil} onValueChange={setSelectedSoil}>
                <SelectTrigger data-testid="select-soil-type">
                  <SelectValue placeholder={t("soil_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {soilTypes.map((soil) => (
                    <SelectItem key={soil.value} value={soil.value}>
                      {soil.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Irrigation Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t("irrigation_type")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedIrrigation}
                onValueChange={setSelectedIrrigation}
              >
                <SelectTrigger data-testid="select-irrigation-type">
                  <SelectValue placeholder={t("irrigation_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {irrigationTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
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
