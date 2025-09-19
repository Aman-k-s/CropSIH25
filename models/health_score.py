import numpy as np

#Get CNN Probability (your PyTorch inference function)
cnn_result = predict_health("/path/to/uploaded_image.jpg")  # 👈 from your trained model
p_cnn_healthy = cnn_result['probability']  # e.g. 0.85 if healthy

#Get Latest NDVI
ndvi_latest = float(df_full['ndvi'].values[-1])

#LSTM model
risk_prob = float(predict_risk_lstm(time_series_data))  # your risk prediction function

#FUSION FUNCTION
def compute_health_score(p_cnn_healthy, ndvi_raw, risk_prob, w1=0.4, w2=0.35, w3=0.25):
    ndvi_norm = float(np.clip(ndvi_raw, 0.0, 1.0))   # normalize NDVI
    risk_health = 1.0 - float(risk_prob)            # lower risk = higher health
    health_score = w1 * p_cnn_healthy + w2 * ndvi_norm + w3 * risk_health
    return float(np.clip(health_score, 0, 1))

health_score = compute_health_score(p_cnn_healthy, ndvi_latest, risk_prob)
print(f"CNN Healthy Prob: {p_cnn_healthy:.2f}")
print(f"NDVI Latest: {ndvi_latest:.3f}")
print(f"Predicted Risk Probability: {risk_prob:.3f}")
print(f"➡ Final Crop Health Score: {health_score*100:.1f}%")

# === ADVISORY LOGIC ===
if health_score > 0.75:
    advice = "Crop is healthy. Continue current practices."
elif health_score > 0.5:
    advice = "Slight stress detected. Monitor irrigation & scout for pests."
else:
    advice = "High stress detected. Immediate intervention recommended (check water, pests, nutrients)."

print(" Advisory:", advice)
