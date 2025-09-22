from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class FieldData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    cropType = models.CharField(max_length=32)
    polygon = models.JSONField()

    def __self__(self):
        return self.polygon
    
class Pest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to="pest/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __self__(self):
        return f"{self.user.username} - {self.uploaded_at.strftime('&Y-%m-%d %H:%M:%S')}"