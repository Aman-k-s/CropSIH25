import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { TrendingUp, Trees, Leaf, DollarSign, MapPin } from "lucide-react";
import { useEffect, useState } from "react";




export function DataAnalytics() {
  const MAP_KEY = ""
  const { t } = useTranslation();

  const [location, setLocation] = useState("Thiruvananthapuram, Kerala");
  const [mapQuery, setMapQuery] = useState(location);
  const [ccData, setCcData] = useState<any>(null);
const [ccLoading, setCcLoading] = useState(true);
const [ccError, setCcError] = useState<any>(null);

useEffect(() => {
  fetch("http://localhost:8000/field/cc", {
    headers: {
      Authorization: `Token d5168cd4b604859db241e89734016b806393e69f`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((json) => {
      setCcData(json);
      setCcLoading(false);
    })
    .catch((err) => {
      console.error("Carbon Credits fetch error:", err);
      setCcError(err);
      setCcLoading(false);
    });
}, []);


  const handleSearch = () => {
    setMapQuery(location);
  };

  function IndicesReport() {
    const [data, setData] = useState<any>(null); // backend data
    const [error, setError] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch("http://localhost:8000/field/awd", {
        headers: {
          Authorization: `Token d5168cd4b604859db241e89734016b806393e69f`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch((err) => {
          console.error("AWD fetch error:", err);
          setError(err);
          setLoading(false);
        });
    }, []);

    if (loading) {
      return (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              {t("indices_report")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Fetching AWD data...</p>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              {t("indices_report")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">Error: {error.message}</p>
          </CardContent>
        </Card>
      );
    }

    const { awd_detected, cycles_count, dry_days_detected } = data;

    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            {t("indices_report")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* NDWI Chart Mock */}
            <div className="h-48 ndvi-chart rounded-lg p-4 relative bg-gray-50">
              <div className="absolute top-4 left-4">
                <h4 className="font-medium text-primary">NDWI Trend Analysis</h4>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>
              <svg
                className="absolute bottom-4 left-4 right-4"
                height="80"
                width="100%"
              >
                <polyline
                  points="0,60 50,45 100,35 150,40 200,25 250,30 300,20"
                  fill="none"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="3"
                />
                <circle cx="300" cy="20" r="4" fill="rgb(34, 197, 94)" />
              </svg>
              <div className="absolute bottom-4 right-4 text-sm font-medium text-primary">
                Current: 0.75
              </div>
            </div>

            {/* AWD Data Section - KPI style */}
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* AWD Detected */}
              <div className="p-4 bg-green-50 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition">
                <p className="text-sm text-muted-foreground">AWD Status</p>
                <p className="text-xl font-bold text-green-700">
                  {awd_detected ? "Detected" : "Not Detected"}
                </p>
              </div>

              {/* Cycle Count */}
              <div className="p-4 bg-blue-50 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition">
                <p className="text-sm text-muted-foreground">Cycle Count</p>
                <p className="text-xl font-bold text-blue-700">
                  {cycles_count} cycles
                </p>
              </div>

              {/* Dry Days Detected */}
              <div className="p-4 bg-yellow-50 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition">
                <p className="text-sm text-muted-foreground">Dry Days</p>
                <p className="text-xl font-bold text-yellow-700">
                  {dry_days_detected} days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {t("data_analytics")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AWD / Indices Report */}
          <IndicesReport />

          {/* Carbon Credit + Tree Count Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Carbon Credits Estimation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="mr-2 h-5 w-5 text-primary" />
                  {t("carbon_credits")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div
                      className="text-3xl font-bold text-primary"
                      data-testid="text-carbon-credits"
                    >
                      {ccLoading ? "…" : ccError ? "Err" : ccData?.carbon_credits?.toFixed(2)}

                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("credits_earned")}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
  <span>{t("methane_reduction")}</span>
  <span className="font-medium">
    {ccLoading ? "…" : ccError ? "Err" : `${(ccData?.methane_reduction_kg / 1000).toFixed(1)} tCO₂e`}
  </span>
</div>
<div className="flex justify-between text-sm">
  <span>{t("water_saving")}</span>
  <span className="font-medium">
    {ccLoading ? "…" : ccError ? "Err" : `${ccData?.water_saved_cubic_m?.toFixed(1)} m³`}
  </span>
</div>

                  </div>
                  <div className="p-3 bg-accent/10 rounded-lg text-center">
                    <p className="text-sm text-accent font-medium">
                      {ccLoading ? "…" : ccError ? "Error" : `₹${ccData?.estimated_value_inr?.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tree Count Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trees className="mr-2 h-5 w-5 text-primary" />
                  {t("tree_count")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                    <Trees className="text-3xl text-primary h-8 w-8" />
                  </div>
                  <div>
                    <div
                      className="text-3xl font-bold text-primary"
                      data-testid="text-tree-count"
                    >
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("trees_detected")}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("last_scan")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Market Price Widget */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-primary" />
                {t("market_price")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between h-full space-y-4">
              {/* Market Price Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary">Wheat</p>
                    <p className="text-sm text-muted-foreground">Per quintal</p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-lg font-bold text-secondary"
                      data-testid="text-wheat-price"
                    >
                      ₹1,850
                    </p>
                    <p className="text-xs text-green-600">+2.5% ↗</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("best_mandi")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("distance")}
                  </p>
                </div>
              </div>

              {/* Google Maps Search */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search location"
                  className="flex-1 p-2 border rounded-md text-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <button
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>

              {/* Embedded Google Map */}
              <div className="w-full h-48 rounded-lg overflow-hidden shadow-sm">
                <iframe
                  title="Market Map"
                  src={`https://www.google.com/maps/embed/v1/place?key=${MAP_KEY}&q=${encodeURIComponent(
                    mapQuery
                  )}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

              {/* Directions Button */}
              <Button
                className="w-full bg-primary hover:bg-primary/90 mt-auto"
                data-testid="button-view-directions"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {t("view_directions")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
