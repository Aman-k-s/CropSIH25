from django.urls import path
from field.views import FieldDataView, SavePolygon, getCoord, AWDreport

urlpatterns = [
    path('ee', FieldDataView.as_view(), name='fieldData'),
    path('set_polygon', SavePolygon.as_view(), name='savePolygon'),
    path('coord', getCoord.as_view(), name='getCoord'),
    path('awd', AWDreport.as_view(), name='AWDreport'),
]