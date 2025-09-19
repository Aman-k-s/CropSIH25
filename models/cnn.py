from PIL import Image

def predict_health(img_path):
    img = Image.open(img_path).convert("RGB")
    img = transform(img).unsqueeze(0).to(DEVICE)
    model.eval()
    with torch.no_grad():
        output = model(img)
        prob = torch.sigmoid(output).item()
    return {"probability": prob, "class": "Healthy" if prob > 0.5 else "Stressed"}
# test
# test_img = '/content/drive/MyDrive/Crop_data/Healthy/sample1.jpg'
# print(predict_health(test_img))
