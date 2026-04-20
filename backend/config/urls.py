urlpatterns = [
    path('admin/', admin.site.urls),

    # jwt
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # companies
    path('api/', include('companies.urls')),

    # approvals
    path('api/', include('approvals.urls')),

    # users
    path("api/", include("users.urls")),
]