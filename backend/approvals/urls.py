from django.urls import path

from .views import RequestListCreateView, ApproveRequestCreateView, RejectRequestCreateView, ReviewRequestView

urlpatterns = [
    path("companies/<slug:slug>/requests/", RequestListCreateView.as_view(), name="request-list-create"),
    path("companies/<slug:slug>/requests/<int:pk>/approve/", ApproveRequestCreateView.as_view(),
         name="approve-request-create"),
    path("companies/<slug:slug>/requests/<int:pk>/reject/", RejectRequestCreateView.as_view(),
         name="reject-request-create"),
    path("companies/<slug:slug>/requests/<int:pk>/review/", ReviewRequestView.as_view(), name="review-request")
]
