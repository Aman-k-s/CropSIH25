from rest_framework import serializers

class FieldDataResponseSerializer(serializers.Serializer):
    NDVI = serializers.FloatField(allow_null=True)
    EVI = serializers.FloatField(allow_null=True)
    SAVI = serializers.FloatField(allow_null=True)
    crop_type_class = serializers.FloatField(allow_null=True)
    rainfall_mm = serializers.FloatField(allow_null=True)
    temperature_K = serializers.FloatField(allow_null=True)
    soil_moisture = serializers.FloatField(allow_null=True)
    ndvi_time_series = serializers.ListField(
        child=serializers.DictField(), 
        allow_empty=True,
        required=False
    )