from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views
from field.views import PestReport

urlpatterns = [
    path('admin/', admin.site.urls),
    path('field/', include('field.urls')),
    path('pest', PestReport.as_view(), name='pest_report'),
    path('login', views.Login.as_view(), name='login'),
    path('signup', views.Signup.as_view(), name='signup'),
    path('test_token', views.TestToken.as_view(), name='test_token'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
