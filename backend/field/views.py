# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from rest_framework.permissions import IsAuthenticated

from .models import FieldData, Pest
from .serializers import (
    FieldDataResponseSerializer, PestResultSerializer
)
from .utils import fetchEEData
from django.shortcuts import get_object_or_404

from models.cnn import predict_health


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
    
class PestReport(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        uploaded = Pest.objects.create(
            user = request.user,
            image = request.FILES["image"]
        )
        
        result = predict_health(uploaded.image.path)
        serializer = PestResultSerializer({"result":result})

        return Response(serializer.data, status=status.HTTP_201_CREATED)