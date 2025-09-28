import numpy as np
from cnn import predict_health
from lstm import predict_risk_from_values

#Fusion Function
def compute_health_score(p_cnn_healthy, ndvi_raw, risk_prob, w1=0.4, w2=0.35, w3=0.25):
    ndvi_norm = float(np.clip(ndvi_raw, 0.0, 1.0))
    risk_health = 1.0 - float(risk_prob) 
    health_score = w1 * p_cnn_healthy + w2 * ndvi_norm + w3 * risk_health
    return float(np.clip(health_score, 0, 1))  # 0..1 scale

#Main Call
def get_health_score(image_path, ndvi_latest, sequence):
    """
    Returns final fused health score (0..1)
    """
    # CNN
    cnn_result = predict_health(image_path)
    p_cnn_healthy = cnn_result['probability']

    # LSTM
    risk_result = predict_risk_from_values(sequence)
    risk_prob = risk_result['risk_probability']

    # Fusion
    return compute_health_score(p_cnn_healthy, ndvi_latest, risk_prob)