import torch
import torch.nn as nn
import joblib
import numpy as np

class RiskLSTM(nn.Module):
    def __init__(self, input_size=4, hidden_size=64, num_layers=2, dropout=0.1):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, 
                            batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_size, 1)
        self.act = nn.Sigmoid()
    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :] 
        out = self.fc(out)
        return self.act(out)

DEVICE = "cpu"
MODEL_PATH = "models/risk_lstm_final.pth"
SCALER_PATH = "models/risk_scaler.save"

def load_risk_model(model_path=MODEL_PATH, scaler_path=SCALER_PATH, device=DEVICE):
    model = RiskLSTM(input_size=4, hidden_size=64, num_layers=2).to(device)
    ckpt = torch.load(model_path, map_location=device)
    model.load_state_dict(ckpt['state_dict'])
    model.eval()
    scaler = joblib.load(scaler_path)
    return model, scaler

risk_model, risk_scaler = load_risk_model(MODEL_PATH, SCALER_PATH, DEVICE)

# Inference function
def predict_risk_from_values(sequence, device=DEVICE):
    """
    sequence: each element = [ndvi, rainfall, temperature, humidity]
              
    """
    seq_array = np.array(sequence).astype(np.float32)
    seq_scaled = risk_scaler.transform(seq_array)   # normalize
    input_tensor = torch.tensor(seq_scaled).unsqueeze(0).to(device)  # (1, seq_len, features)

    with torch.no_grad():
        prob = float(risk_model(input_tensor).cpu().item())

    return {
        "risk_probability": prob,
        "risk_level": "High" if prob > 0.5 else "Low"
    }
