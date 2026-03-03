from django.urls import path
from .views import RequestListCreateView, ApproveRequestCreateView

urlpatterns = [
    path("requests/", RequestListCreateView.as_view(), name="request-list-create"),
    path("requests/<int:pk>/approve/", ApproveRequestCreateView.as_view(), name="approve-request-create"),

]
