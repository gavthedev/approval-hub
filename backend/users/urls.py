from django.urls import path

from .views import me
from .views import register

urlpatterns = [
    path("me/", me),
    path("register/", register),
]
