from django.urls import path
from .views import RequestListCreateView

urlpatterns = [
    path("requests/", RequestListCreateView.as_view(), name="request-list-create"),
]