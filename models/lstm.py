import torch
import torch.nn as nn
import joblib
import numpy as np
# LSTM Model
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
# Load Model + Scaler
def load_risk_model(model_path="models/risk_lstm_final.pth",
                    scaler_path="models/risk_scaler.save",
                    device="cpu"):
    model = RiskLSTM(input_size=4, hidden_size=64, num_layers=2).to(device)
    ckpt = torch.load(model_path, map_location=device)
    model.load_state_dict(ckpt['state_dict'])
    model.eval()

    scaler = joblib.load(scaler_path)
    return model, scaler

def predict_risk_from_values(sequence, model, scaler, device="cpu"):
    """
    sequence: list of last SEQ_LEN weeks, each element = [ndvi, rainfall, temperature, humidity]
    """
    seq_array = np.array(sequence).astype(np.float32)
    seq_scaled = scaler.transform(seq_array)   # normalize with saved scaler
    input_tensor = torch.tensor(seq_scaled).unsqueeze(0).to(device)  # shape (1, seq_len, features)

    with torch.no_grad():
        prob = float(model(input_tensor).cpu().item())

    return {
        "risk_probability": prob,
        "risk_level": "High" if prob > 0.5 else "Low"
    }

# 
# # Example Usage
# if __name__ == "__main__":
#     device = "cuda" if torch.cuda.is_available() else "cpu"
#     model, scaler = load_risk_model("models/risk_lstm_final.pth", "models/risk_scaler.save", device)

#     # Example: last 6 weeks data
#     last_seq = [
#         [0.72, 5, 28.1, 66],
#         [0.70, 0, 27.9, 62],
#         [0.68, 20, 29.3, 75],
#         [0.65, 15, 28.7, 80],
#         [0.62, 0, 28.0, 70],
#         [0.60, 10, 29.1, 78]
#     ]
#     result = predict_risk_from_values(last_seq, model, scaler, device)
#     print(result)
