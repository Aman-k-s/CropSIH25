import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

def load_model(model_path="crop_health_model.pth", device="cpu"):
    model = models.mobilenet_v2(weights=None)
    model.classifier[1] = nn.Linear(model.last_channel, 1)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model.to(device)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

DEVICE = "cpu"
MODEL_PATH = "crop_health_model.pth"
model = load_model(MODEL_PATH, DEVICE)

# Inference function
def predict_health(img_path, device=DEVICE):
    img = Image.open(img_path).convert("RGB")
    img = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(img)
        prob = torch.sigmoid(output).item()

    return {
        "probability": float(prob),
        "class": "Healthy" if prob > 0.5 else "Stressed"
    }

# # Testing
# if __name__ == "__main__":
#     device = "cuda" if torch.cuda.is_available() else "cpu"
#     model = load_model("crop_health_model.pth", device)

#     result = predict_health("test_leaf.jpg", model, device)
#     print(result)
