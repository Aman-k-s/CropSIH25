from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class FieldData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    cropType = models.CharField(max_length=32)
    polygon = models.JSONField()

    def __self__(self):
        return self.polygon