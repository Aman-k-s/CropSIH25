# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import FieldData
from .serializers import (
    FieldDataResponseSerializer,
)
from .utils import fetchEEData
from django.shortcuts import get_object_or_404

class FieldDataView(APIView):
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

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
    authentication_classes = [SessionAuthentication, TokenAuthentication]
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
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        field_data = get_object_or_404(FieldData, user=request.user)
        polygon = field_data.polygon

        coords = polygon.get("coordinates", [])
        first_coord = coords[0][0] if coords and coords[0] else None

        return Response({"coord": first_coord})