def calculate_carbon_metrics(area_hectare: float,
                             ndwi_based_awd: bool,
                             crop_days: int = 100,
                             baseline_water_mm: float = 1200,
                             ch4_baseline_per_day: float = 1.3,
                             awd_reduction_factor: float = 0.35,
                             ch4_to_co2e: float = 27.2,
                             credit_price_inr: float = 900.0):
  
    # 1. Water use
    if ndwi_based_awd:
        actual_water_mm = baseline_water_mm * (1 - 0.35)  # 35% less water
    else:
        actual_water_mm = baseline_water_mm
        water_saved_mm = 0  # no saving if AWD not used

    water_saved_mm = baseline_water_mm - actual_water_mm
    water_saved_cubic_m = water_saved_mm * area_hectare * 10  # mm to cubic meters

    # 2. Methane reduction
    methane_baseline = ch4_baseline_per_day * area_hectare * crop_days
    if ndwi_based_awd:
        methane_reduction_kg = methane_baseline - awd_reduction_factor
    else:
        methane_reduction_kg = methane_baseline

    # 3. CO2e reduction
    co2e_reduction_kg = methane_reduction_kg * ch4_to_co2e
    co2e_reduction_ton = co2e_reduction_kg / 1000

    # 4. Credits + Value
    carbon_credits = co2e_reduction_ton
    estimated_value_inr = carbon_credits * credit_price_inr

    return {
        "area_hectare": area_hectare,
        "water_saved_mm": round(water_saved_mm, 2),
        "water_saved_cubic_m": round(water_saved_cubic_m, 2),
        "methane_reduction_kg": round(methane_reduction_kg, 2),
        "co2e_reduction_ton": round(co2e_reduction_ton, 3),
        "carbon_credits": round(carbon_credits, 3),
        "estimated_value_inr": round(estimated_value_inr, 2),
        "awd_detected": ndwi_based_awd}



#AWD mai variation chaiye toh yeh wala use krna

# import numpy as np
# from typing import List, Dict, Any

# def detect_awd_from_ndwi(
#     ndwi_series: List[float],
#     dates: List[str] = None,
#     wet_threshold: float = 0.30,
#     dry_threshold: float = 0.20,
#     min_dry_days_for_awd: int = 3,
#     min_cycles: int = 1,
#     min_dry_fraction: float = 0.05
# ) -> Dict[str, Any]:
#     """
#     Detect AWD from an NDWI time series using dry-day counts and wet-dry cycles.

#     Parameters
#     ----------
#     ndwi_series : List[float]
#         Chronological NDWI values (one per acquisition). Can be weekly / 16-day etc.
#     dates : List[str], optional
#         Optional list of date strings corresponding to ndwi_series (for reporting).
#     wet_threshold : float
#         NDWI >= wet_threshold considered 'wet' (ponded / flooded indicator).
#     dry_threshold : float
#         NDWI <= dry_threshold considered 'dry' (sufficient drying indicator).
#     min_dry_days_for_awd : int
#         Minimum consecutive dry acquisitions required to count a 'dry spell'.
#         (If acquisitions are ~7 days apart, min_dry_days_for_awd=3 implies ~3 weeks dry).
#     min_cycles : int
#         Minimum number of wet->dry->wet cycles to call AWD (default 1).
#     min_dry_fraction : float
#         Minimum fraction of total observations that must be 'dry' at least once to avoid noise (0-1).

#     Returns
#     -------
#     dict
#         {
#             "awd_detected": bool,
#             "cycles_count": int,
#             "dry_spells": [ {"start_idx":int,"end_idx":int,"length":int,"start_date":str,"end_date":str}, ... ],
#             "total_dry_days_count": int,
#             "dry_fraction": float,
#             "notes": str
#         }

#     ~Notes
#     -----
#     - This uses indices, not exact calendar days. If your ndwi cadence is weekly / 16-day,
#       interpret min_d~ry_days_for_awd accordingly (e.g., 3 * 7 days ~ 21 days).
#     - Tune thresholds per region; defaults are reasonable starting values.
#     """
#     ndwi = np.array(ndwi_series, dtype=float)
#     n = len(ndwi)
#     if n == 0:
#         return {"awd_detected": False, "cycles_count": 0, "dry_spells": [], "total_dry_days_count": 0, "dry_fraction": 0.0, "notes": "empty series"}

#     # classify each acquisition: 'wet', 'dry', or 'neutral'
#     state_arr = np.array(["neutral"] * n)
#     state_arr[ndwi >= wet_threshold] = "wet"
#     state_arr[ndwi <= dry_threshold] = "dry"

#     # find dry spells (consecutive dry indices)
#     dry_spells = []
#     i = 0
#     while i < n:
#         if state_arr[i] == "dry":
#             start = i
#             j = i + 1
#             while j < n and state_arr[j] == "dry":
#                 j += 1
#             length = j - start
#             dry_spells.append({"start_idx": start, "end_idx": j - 1, "length": length,
#                                "start_date": (dates[start] if dates else None),
#                                "end_date": (dates[j-1] if dates and j-1 < len(dates) else None)})
#             i = j
#         else:
#             i += 1

#     total_dry_days_count = sum(sp["length"] for sp in dry_spells)
#     dry_fraction = total_dry_days_count / n

#     # count wet->dry->wet cycles: detect pattern transitions
#     cycles = 0
#     # compress to sequence of states ignoring 'neutral' by mapping neutral to previous meaningful state if possible
#     meaningful = []
#     for s in state_arr:
#         if s == "neutral":
#             # skip neutrals; we'll only consider wet/dry transitions
#             continue
#         if not meaningful or meaningful[-1] != s:
#             meaningful.append(s)

#     # now count wet->dry->wet occurrences in meaningful
#     for idx in range(len(meaningful) - 2):
#         if meaningful[idx] == "wet" and meaningful[idx + 1] == "dry" and meaningful[idx + 2] == "wet":
#             cycles += 1

#     # Another way: count occurrences where a dry spell is surrounded by wet on both sides
#     cycles_alt = 0
#     for sp in dry_spells:
#         s, e = sp["start_idx"], sp["end_idx"]
#         left_wet = (s - 1 >= 0 and state_arr[s - 1] == "wet")
#         right_wet = (e + 1 < n and state_arr[e + 1] == "wet")
#         if left_wet and right_wet:
#             cycles_alt += 1

#     # choose cycles = max(cycles, cycles_alt)
#     cycles = max(cycles, cycles_alt)

#     # Decide AWD detected:
#     # - require at least one dry spell length >= min_dry_days_for_awd
#     # - require cycles >= min_cycles
#     # - require dry_fraction >= min_dry_fraction (avoid spurious short dry pixels)
#     long_enough_dry = any(sp["length"] >= min_dry_days_for_awd for sp in dry_spells)
#     awd_detected = (cycles >= min_cycles) and long_enough_dry and (dry_fraction >= min_dry_fraction)

#     notes = []
#     if not long_enough_dry:
#         notes.append(f"No dry spell >= {min_dry_days_for_awd} acquisitions.")
#     if cycles < min_cycles:
#         notes.append(f"Only {cycles} wet-dry-wet cycles found; need >= {min_cycles}.")
#     if dry_fraction < min_dry_fraction:
#         notes.append(f"Dry fraction too low ({dry_fraction:.2f}); threshold {min_dry_fraction}.")
#     if not notes:
#         notes = ["AWD pattern passes all thresholds."]
#     else:
#         notes = ["; ".join(notes)]

#     return {
#         "awd_detected": bool(awd_detected),
#         "cycles_count": int(cycles),
#         "dry_spells": dry_spells,
#         "total_dry_days_count": int(total_dry_days_count),
#         "dry_fraction": float(round(dry_fraction, 3)),
#         "notes": notes[0]
#     }


# def calculate_carbon_metrics(
#     area_hectare: float,
#     ndwi_series: List[float],
#     ndwi_dates: List[str] = None,
#     crop_days: int = 100,
#     baseline_water_mm: float = 1200.0,
#     ch4_baseline_kg_per_ha_per_day: float = 1.3,
#     awd_reduction_factor: float = 0.35,
#     ch4_to_co2e: float = 27.2,
#     credit_price_inr: float = 900.0,
#     # NDWI detection params (passed through to detector)
#     ndwi_params: dict = None
# ) -> Dict[str, Any]:
#     """
#     Compute water saved, methane reduction and carbon credits using NDWI-based AWD detection.

#     Parameters
#     ----------
#     area_hectare : float
#         Farm size in hectares.
#     ndwi_series : List[float]
#         NDWI time series for the farm polygon.
#     ndwi_dates : List[str], optional
#         Corresponding dates for the series (optional; used in detector reporting).
#     crop_days : int
#         Season duration in days (e.g., 100).
#     baseline_water_mm : float
#         Baseline seasonal water use in mm (for CF).
#     ch4_baseline_kg_per_ha_per_day : float
#         Baseline methane emission rate (kg CH4 / ha / day).
#     awd_reduction_factor : float
#         Fractional methane reduction when AWD fully followed (0.0-1.0).
#     ch4_to_co2e : float
#         GWP conversion factor (kg CO2e per kg CH4).
#     credit_price_inr : float
#         Monetary estimate per credit (INR per ton CO2e).
#     ndwi_params : dict
#         Optional parameters for detect_awd_from_ndwi.

#     Returns
#     -------
#     dict
#         {
#             "awd_result": { ... },
#             "area_hectare": float,
#             "awd_effective_fraction": float (0..1),
#             "actual_water_mm": float,
#             "water_saved_mm": float,
#             "water_saved_cubic_m": float,
#             "methane_reduction_kg": float,
#             "co2e_reduction_ton": float,
#             "carbon_credits": float,
#             "estimated_value_inr": float
#         }

#     Notes
#     -----
#     - This function uses detect_awd_from_ndwi to decide AWD. It also supports a 'partial AWD' mode:
#       if AWD is detected but dry fraction is low or cycles are minimal, we scale the AWD effect (e.g., 50% of full benefit).
#     """
#     # use defaults if none passed
#     if ndwi_params is None:
#         ndwi_params = {}

#     # 1) detect AWD from NDWI
#     awd_result = detect_awd_from_ndwi(ndwi_series, dates=ndwi_dates, **ndwi_params)

#     # 2) determine AWD compliance strength
#      full_compliance = False
#     partial_compliance = False
#     if awd_result["awd_detected"]:
#         if awd_result["cycles_count"] >= 2 and awd_result["dry_fraction"] >= 0.2:
#             full_compliance = True
#         else:
#             partial_compliance = True

#     # effective AWD fraction applied to water and methane savings (0..1)
#     if full_compliance:
#         eff = 1.0
#     elif partial_compliance:
#         eff = 0.5  # partial compliance -> half the benefit (tunable)
#     else:
#         eff = 0.0

#     # 3) water calculation
#      water_saving_fraction = 0.35  # default: AWD saves ~35% water (tunable)
#     actual_water_mm = baseline_water_mm * (1 - eff * water_saving_fraction)
#     water_saved_mm = baseline_water_mm - actual_water_mm
#     water_saved_cubic_m = water_saved_mm * area_hectare * 10.0  # mm -> cubic meters for hectares

#     # 4) methane reduction
#     methane_baseline_total_kg = ch4_baseline_kg_per_ha_per_day * area_hectare * crop_days
#     methane_reduction_kg = methane_baseline_total_kg * (eff * awd_reduction_factor)

#     # 5) convert to CO2e (tons)
#     co2e_reduction_kg = methane_reduction_kg * ch4_to_co2e
#     co2e_reduction_ton = co2e_reduction_kg / 1000.0

#     # 6) credits and value
#     carbon_credits = co2e_reduction_ton
#     estimated_value_inr = carbon_credits * credit_price_inr

#     return {
#         "awd_result": awd_result,
#         "area_hectare": round(area_hectare, 4),
#         "awd_effective_fraction": round(eff, 3),
#         "actual_water_mm": round(actual_water_mm, 2),
#         "water_saved_mm": round(water_saved_mm, 2),
#         "water_saved_cubic_m": round(water_saved_cubic_m, 2),
#         "methane_reduction_kg": round(methane_reduction_kg, 2),
#         "co2e_reduction_ton": round(co2e_reduction_ton, 3),
#         "carbon_credits": round(carbon_credits, 3),
#         "estimated_value_inr": round(estimated_value_inr, 2)
#     }


# # ---------------- Example usage ----------------
# if _name_ == "_main_":
#     # Example NDWI series (chronological). Assume acquisitions weekly (10 samples)
#     ndwi_values = [0.34, 0.33, 0.30, 0.18, 0.16, 0.21, 0.32, 0.29, 0.17, 0.31]
#     ndwi_dates = [f"2024-01-{day:02d}" for day in range(1, len(ndwi_values)+1)]

#     ndwi_params = {
#         "wet_threshold": 0.30,
#         "dry_threshold": 0.20,
#         "min_dry_days_for_awd": 2,   # since cadence is weekly, 2 acquisitions ~2 weeks dry
#         "min_cycles": 1,
#         "min_dry_fraction": 0.08
#     }

#     result = calculate_carbon_metrics(
#         area_hectare=1.0,
#         ndwi_series=ndwi_values,
#         ndwi_dates=ndwi_dates,
#         crop_days=100,
#         baseline_water_mm=1200.0,
#         ch4_baseline_kg_per_ha_per_day=1.3,
#         awd_reduction_factor=0.35,
#         ndwi_params=ndwi_params,
#         credit_price_inr=900.0
#     )

#     import json
#     print(json.dumps(result, indent=2))