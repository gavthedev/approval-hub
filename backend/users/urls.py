from django.urls import path

from .views import me, register, verify_email

urlpatterns = [
    path("me/", me),
    path("register/", register),
    path("verify/<uuid:token>/", verify_email),
]
