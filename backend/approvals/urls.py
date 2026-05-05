from django.urls import path

from .views import (
    RequestListCreateView,
    ApproveRequestView,
    RejectRequestView,
    ReviewRequestView,
    ticket_type_list_create,
    ticket_type_detail,
    ticket_type_field_create,
    ticket_type_field_detail,
    add_comment,
)

urlpatterns = [
    # Ticket Types
    path("companies/<slug:slug>/ticket-types/", ticket_type_list_create, name="ticket-type-list-create"),
    path("companies/<slug:slug>/ticket-types/<int:pk>/", ticket_type_detail, name="ticket-type-detail"),
    path("companies/<slug:slug>/ticket-types/<int:pk>/fields/", ticket_type_field_create,
         name="ticket-type-field-create"),
    path("companies/<slug:slug>/ticket-types/<int:pk>/fields/<int:field_id>/", ticket_type_field_detail,
         name="ticket-type-field-detail"),

    # Requests
    path("companies/<slug:slug>/requests/", RequestListCreateView.as_view(), name="request-list-create"),
    path("companies/<slug:slug>/requests/<int:pk>/approve/", ApproveRequestView.as_view(), name="approve-request"),
    path("companies/<slug:slug>/requests/<int:pk>/reject/", RejectRequestView.as_view(), name="reject-request"),
    path("companies/<slug:slug>/requests/<int:pk>/review/", ReviewRequestView.as_view(), name="review-request"),

    # Comments
    path("companies/<slug:slug>/requests/<int:pk>/comments/", add_comment, name="add-comment"),
]
