from rest_framework.permissions import BasePermission
from .models import Membership

class IsCompanyMember(BasePermission):
    def has_permission(self, request, view):
        slug = view.kwargs["slug"]
        return Membership.objects.filter(user=request.user, company__slug=slug, is_active=True).exists()

class IsCompanyApprover(BasePermission):
    def has_permission(self, request, view):
        slug = view.kwargs["slug"]
        return Membership.objects.filter(user=request.user, company__slug=slug, is_active=True, role__in=["approver", "admin"]).exists()
