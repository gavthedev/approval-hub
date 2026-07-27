from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (TokenRefreshView, )
from users.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # jwt
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # companies
    path('api/', include('companies.urls')),

    # approvals
    path('api/', include('approvals.urls')),

    # users
    path("api/", include("users.urls")),

    # home
    path("api/", include("home.urls")),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
