from django.urls import path

from .views import CompanyListCreateView, invite_member, my_role

urlpatterns = [
    path("companies/", CompanyListCreateView.as_view(), name="company-list-create"),
    path("companies/<slug:slug>/invite/", invite_member, name="invite-member"),
    path("companies/<slug:slug>/my-role/", my_role, name="my-role"),
]