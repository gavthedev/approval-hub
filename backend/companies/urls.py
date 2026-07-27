from django.urls import path

from .views import CompanyListCreateView, company_detail, invite_member, my_role

urlpatterns = [
    path("companies/", CompanyListCreateView.as_view(), name="company-list-create"),
    path("companies/<slug:slug>/", company_detail, name="company-detail"),
    path("companies/<slug:slug>/invite/", invite_member, name="invite-member"),
    path("companies/<slug:slug>/my-role/", my_role, name="my-role"),
]
