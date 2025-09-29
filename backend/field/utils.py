import ee
from django.shortcuts import get_object_or_404
from .models import FieldData

from shapely.geometry import Polygon
from pyproj import CRS, Transformer
from shapely.ops import transform

def fetchEEData(user, start_date="2024-06-01", end_date="2024-06-30"):
    """
    Fetch vegetation indices, rainfall, temperature, soil moisture,
    and NDVI/NDWI time series for the logged-in user's field.
    """

    # Fetch polygon for the user
    field_data = get_object_or_404(FieldData, user=user)
    coords = field_data.polygon
    aoi = ee.Geometry(coords)

    # --- Vegetation Indices ---
    sentinel = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
        .median()
    )

    ndvi = sentinel.normalizedDifference(["B8", "B4"]).rename("NDVI")
    evi = sentinel.expression(
        "2.5 * ((NIR - RED) / (NIR + 6*RED - 7.5*BLUE + 1))",
        {
            "NIR": sentinel.select("B8"),
            "RED": sentinel.select("B4"),
            "BLUE": sentinel.select("B2"),
        },
    ).rename("EVI")
    savi = sentinel.expression(
        "((NIR - RED) / (NIR + RED + 0.5)) * (1.5)",
        {"NIR": sentinel.select("B8"), "RED": sentinel.select("B4")},
    ).rename("SAVI")

    veg_stats = (
        ee.Image.cat([ndvi, evi, savi])
        .reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=aoi,
            scale=10,
            bestEffort=True,
        )
        .getInfo()
        or {}
    )

    # --- Crop Type ---
    worldcover = ee.Image("ESA/WorldCover/v100/2020")
    crop_class = (
        worldcover.reduceRegion(
            reducer=ee.Reducer.mode(),
            geometry=aoi,
            scale=10,
            bestEffort=True,
        ).getInfo()
        or {}
    )
    crop_type = crop_class.get("Map")

    # --- Rainfall ---
    rainfall = (
        ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
        .mean()
        .reduceRegion(ee.Reducer.mean(), aoi, 5000)
        .getInfo()
        or {}
    )
    rainfall_val = rainfall.get("precipitation")

    # --- Temperature ---
    lst = (
        ee.ImageCollection("MODIS/061/MOD11A2")
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
        .mean()
        .select("LST_Day_1km")
        .multiply(0.02)
        .reduceRegion(ee.Reducer.mean(), aoi, 1000)
        .getInfo()
        or {}
    )
    temp_val = lst.get("LST_Day_1km")

    # --- Soil Moisture ---
    soil = (
        ee.ImageCollection("ECMWF/ERA5_LAND/DAILY_RAW")
        .filterDate(start_date, end_date)
        .mean()
        .select("volumetric_soil_water_layer_1")
        .reduceRegion(ee.Reducer.mean(), aoi, 10000)
        .getInfo()
        or {}
    )
    soil_val = soil.get("volumetric_soil_water_layer_1")

    # --- NDVI Time Series ---
    ndvi_ts = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
        .map(
            lambda img: img.normalizedDifference(["B8", "B4"])
            .rename("NDVI")
            .set("date", img.date().format("YYYY-MM-dd"))
        )
        .select("NDVI")
    )

    ndvi_series = ndvi_ts.map(
        lambda img: ee.Feature(
            None,
            {
                "date": img.get("date"),
                "NDVI": img.reduceRegion(
                    ee.Reducer.mean(), aoi, 10
                ).get("NDVI"),
            },
        )
    )

    ndvi_list = ndvi_series.aggregate_array("NDVI").getInfo()
    date_list = ndvi_series.aggregate_array("date").getInfo()
    time_series = []
    if ndvi_list and date_list:
        for d, v in zip(date_list, ndvi_list):
            if v is not None:
                time_series.append({"date": d, "NDVI": v})

    # --- NDWI Time Series ---
    ndwi_ts = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(aoi)
        .filterDate(start_date, end_date)
        .map(
            lambda img: img.normalizedDifference(["B3", "B8"])
            .rename("NDWI")
            .set("date", img.date().format("YYYY-MM-dd"))
        )
        .select("NDWI")
    )

    ndwi_series = ndwi_ts.map(
        lambda img: ee.Feature(
            None,
            {
                "date": img.get("date"),
                "NDWI": img.reduceRegion(
                    ee.Reducer.mean(), aoi, 10
                ).get("NDWI"),
            },
        )
    )

    ndwi_list = ndwi_series.aggregate_array("NDWI").getInfo()
    ndwi_date_list = ndwi_series.aggregate_array("date").getInfo()
    ndwi_time_series = []
    if ndwi_list and ndwi_date_list:
        for d, v in zip(ndwi_date_list, ndwi_list):
            if v is not None:
                ndwi_time_series.append({"date": d, "NDWI": v})

    return {
        "NDVI": veg_stats.get("NDVI"),
        "EVI": veg_stats.get("EVI"),
        "SAVI": veg_stats.get("SAVI"),
        "crop_type_class": crop_type,
        "rainfall_mm": rainfall_val,
        "temperature_K": temp_val,
        "soil_moisture": soil_val,
        "ndvi_time_series": time_series,
        "ndwi_time_series": ndwi_time_series,
    }


def calculate_area_in_hectares(coords_list):
    
    # Create a shapely Polygon object from the coordinates
    polygon_geom = Polygon(coords_list)

    # Define the source (WGS 84 / EPSG:4326) and target (UTM Zone 43N / EPSG:32643)
    # This projection converts the coordinates to a meter-based system.
    project = Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True).transform

    # Apply the projection to the polygon
    projected_polygon = transform(project, polygon_geom)

    # Get the area in square meters from the projected polygon
    area_sq_meters = projected_polygon.area
    
    # Convert square meters to hectares (1 hectare = 10,000 m²)
    area_hectares = area_sq_meters / 10000

    return area_hectares