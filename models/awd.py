import numpy as np

def detect_awd_from_ndwi(ndwi_series, wet_threshold=0.3, dry_threshold=0.2, min_cycles=1):
   
    state = None
    cycles = 0
    dry_days = 0

    for val in ndwi_series:
        if val > wet_threshold:
            if state == "dry":
                cycles += 1
            state = "wet"
        elif val < dry_threshold:
            dry_days += 1
            state = "dry"

    return {
        "awd_detected": cycles >= min_cycles,
        "cycles_count": cycles,
        "dry_days_detected": dry_days
    }


# # Example
# if _name_ == "_main_":
#     # Sample NDWI series for 10 dates (demo data)
#     ndwi_values = [0.35, 0.32, 0.28, 0.18, 0.25, 0.34, 0.31, 0.19, 0.22, 0.33]
#     result = detect_awd_from_ndwi(ndwi_values)
#     print(result)