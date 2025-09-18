from django.urls import path
from field.views import FieldDataView, SavePolygon

urlpatterns = [
    path('ee', FieldDataView.as_view(), name='fieldData'),
    path('set_polygon', SavePolygon.as_view(), name='savePolygon'),
]