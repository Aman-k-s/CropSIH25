# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from rest_framework.permissions import IsAuthenticated

from .models import FieldData, Pest
from .serializers import (
    FieldDataResponseSerializer
)
from .utils import fetchEEData, calculate_area_in_hectares
from django.shortcuts import get_object_or_404

from models.health_score import get_health_score
from models.lstm import predict_risk_from_values
from models.cc import calculate_carbon_metrics
from models.cnn import predict_health
from models.awd import detect_awd_from_ndwi

class FieldDataView(APIView):
    permission_classes=[IsAuthenticated]

    def get(self, request):
        try:
            response_data = fetchEEData(request.user)

            resp_serializer = FieldDataResponseSerializer(data=response_data)
            resp_serializer.is_valid(raise_exception=True)

            return Response(resp_serializer.validated_data)

        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=500)

class SavePolygon(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            polygon = request.data.get("polygon")
            crop_type = request.data.get("cropType", "")

            if not polygon:
                return Response(
                    {"error": "Polygon data is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            field_data, created = FieldData.objects.update_or_create(
                user=request.user,
                defaults={"polygon": polygon, "cropType": crop_type},
            )

            return Response(
                {
                    "message": "Polygon saved successfully",
                    "created": created,
                    "polygon": field_data.polygon,
                    "cropType": field_data.cropType,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class getCoord(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        field_data = get_object_or_404(FieldData, user=request.user)
        polygon = field_data.polygon

        coords = polygon.get("coordinates", [])
        first_coord = coords[0][0] if coords and coords[0] else None

        return Response({"coord": first_coord})

# get coordinates list
def get_polygon(user):
    try:
        field_data = get_object_or_404(FieldData, user=user)
        return field_data.polygon
    except:
        return None

        
class PestReport(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        uploaded = Pest.objects.create(
            user = request.user,
            image = request.FILES["image"]
        )
        
        # cnn.py
        result = predict_health(uploaded.image.path)

        return Response(result, status=status.HTTP_201_CREATED)
    

class AWDreport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = fetchEEData(request.user)
        ndwi_data = data["ndwi_time_series"]

        # awd.py
        report = detect_awd_from_ndwi(ndwi_series=ndwi_data)
        return Response(report)
    
class CarbonCredit(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ndwi_data=fetchEEData(request.user)['ndwi_time_series']
        # awd.py
        awd = detect_awd_from_ndwi(ndwi_series=ndwi_data)["awd_detected"]

        polygon = get_polygon(user=request.user)
        # utils.py
        area = calculate_area_in_hectares(polygon['coordinates'][0])

        # cc.py
        result = calculate_carbon_metrics(area_hectare=area)
        return Response(result)
    
class PestPrediction(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # lstm.py
        data = fetchEEData(request.user)
        result = predict_risk_from_values(data)
        return Response(result)
    
class HealthScore(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = fetchEEData(request.user)

        # health_score.py
        result = get_health_score(image_path='../sample.jpg', ndvi_latest=data['ndwi_time_series'], sequence=data)
        return Response(result)