import torch
import torch.nn as nn
import joblib
import numpy as np

class RiskLSTM(nn.Module):
    def __init__(self, input_size=4, hidden_size=64, num_layers=2, dropout=0.1):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_size, 1)
        self.act = nn.Sigmoid()
    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]    # take last timestep
        out = self.fc(out)
        return self.act(out)

#Load model + scaler once at import
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

scaler = joblib.load("models/risk_scaler.save")  # path relative to backend
model = RiskLSTM(input_size=4, hidden_size=64, num_layers=2).to(device)

ckpt = torch.load("models/risk_lstm_final.pth", map_location=device)
model.load_state_dict(ckpt['state_dict'])
model.eval()

SEQ_LEN = 6   # must match training

#function
def predict_risk(ndvi_seq, rainfall_seq, temp_seq, humidity_seq):
    """
    Args:
        ndvi_seq (list of float): NDVI values, length = SEQ_LEN
        rainfall_seq (list of float): rainfall values
        temp_seq (list of float): temperature values
        humidity_seq (list of float): humidity values

    Returns:
        float: risk probability (0..1)
    """
    assert len(ndvi_seq) == SEQ_LEN, f"Need {SEQ_LEN} timesteps"
    assert len(rainfall_seq) == SEQ_LEN
    assert len(temp_seq) == SEQ_LEN
    assert len(humidity_seq) == SEQ_LEN

    # Stack features: shape (seq_len, 4)
    raw_seq = np.stack([ndvi_seq, rainfall_seq, temp_seq, humidity_seq], axis=1)
    scaled_seq = scaler.transform(raw_seq).astype(np.float32)

    # Convert to tensor
    input_tensor = torch.tensor(scaled_seq).unsqueeze(0).to(device)  # (1, seq_len, 4)

    with torch.no_grad():
        risk_prob = float(model(input_tensor).cpu().item())

    return risk_prob
