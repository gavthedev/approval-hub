from rest_framework.permissions import BasePermission

from .models import Membership


class IsCompanyMember(BasePermission):
    def has_permission(self, request, view):
        slug = view.kwargs["slug"]
        membership = Membership.objects.filter(user=request.user, company__slug=slug, is_active=True).first()
        if membership is None:
            return False
        request.membership = membership
        return True


class IsCompanyApprover(BasePermission):
    def has_permission(self, request, view):
        slug = view.kwargs["slug"]
        membership = Membership.objects.filter(
            user=request.user, company__slug=slug, is_active=True, role__in=["approver", "admin"]
        ).first()
        if membership is None:
            return False
        request.membership = membership
        return True


class IsCompanyAdmin(BasePermission):
    def has_permission(self, request, view):
        slug = view.kwargs["slug"]
        membership = Membership.objects.filter(
            user=request.user, company__slug=slug, is_active=True, role="admin"
        ).first()
        if membership is None:
            return False
        request.membership = membership
        return True
