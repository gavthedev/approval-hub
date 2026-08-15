from approvals.models import Request
from companies.models import Membership
from rest_framework import serializers

from .models import HomeItem


class PinnedRequestSummarySerializer(serializers.ModelSerializer):
    company_slug = serializers.CharField(source="company.slug", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    ticket_type_name = serializers.CharField(source="ticket_type.name", read_only=True)

    class Meta:
        model = Request
        fields = ["id", "title", "status", "ticket_type_name", "company_slug", "company_name"]


class HomeItemSerializer(serializers.ModelSerializer):
    request_detail = PinnedRequestSummarySerializer(source="request", read_only=True)
    company_slug = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    class Meta:
        model = HomeItem
        fields = [
            "id", "item_type", "order", "label", "url",
            "company", "company_slug", "company_name",
            "request", "request_detail", "stat_kind", "value", "created_at",
        ]
        read_only_fields = ["created_at"]
        extra_kwargs = {"request": {"write_only": True}}

    def get_company_slug(self, obj):
        return obj.company.slug if obj.company_id else None

    def get_company_name(self, obj):
        return obj.company.name if obj.company_id else None

    def get_value(self, obj):
        if obj.item_type != HomeItem.ItemType.STAT:
            return None

        user = self.context["request"].user
        qs = Request.objects.filter(is_deleted=False)

        if obj.stat_kind == HomeItem.StatKind.MY_OPEN_REQUESTS:
            if obj.company_id:
                qs = qs.filter(company_id=obj.company_id)
            else:
                qs = qs.filter(company__memberships__user=user, company__memberships__is_active=True)
            qs = qs.filter(created_by=user, status__in=[Request.Status.SUBMITTED, Request.Status.IN_REVIEW])
        elif obj.stat_kind == HomeItem.StatKind.PENDING_MY_APPROVAL:
            qs = qs.filter(
                status=Request.Status.IN_REVIEW,
                company__memberships__user=user,
                company__memberships__is_active=True,
                company__memberships__role__in=[Membership.Role.APPROVER, Membership.Role.ADMIN],
            )
            if obj.company_id:
                qs = qs.filter(company_id=obj.company_id)
        else:
            return None

        return qs.distinct().count()

    @staticmethod
    def _check_membership(user, company):
        if not Membership.objects.filter(user=user, company=company, is_active=True).exists():
            raise serializers.ValidationError("You are not a member of this company.")

    @staticmethod
    def _check_approver(user, company):
        if not Membership.objects.filter(
            user=user, company=company, is_active=True,
            role__in=[Membership.Role.APPROVER, Membership.Role.ADMIN],
        ).exists():
            raise serializers.ValidationError("Only approvers and admins can add this stat.")

    @staticmethod
    def _check_request_visible(user, request_obj):
        membership = Membership.objects.filter(user=user, company=request_obj.company, is_active=True).first()
        if membership is None:
            raise serializers.ValidationError("You are not a member of this company.")
        if membership.role == Membership.Role.MEMBER and request_obj.created_by_id != user.id:
            raise serializers.ValidationError("You can only pin your own requests.")

    def validate(self, attrs):
        item_type = attrs.get("item_type")
        user = self.context["request"].user

        if item_type == HomeItem.ItemType.SHORTCUT:
            if not attrs.get("label") or not attrs.get("url"):
                raise serializers.ValidationError("label and url are required for a shortcut.")
            company = attrs.get("company")
            if not company:
                raise serializers.ValidationError("company is required for a shortcut.")
            self._check_membership(user, company)

        elif item_type == HomeItem.ItemType.PINNED_REQUEST:
            request_obj = attrs.get("request")
            if not request_obj:
                raise serializers.ValidationError("request is required for a pinned request.")
            self._check_request_visible(user, request_obj)
            attrs["company"] = request_obj.company

        elif item_type == HomeItem.ItemType.STAT:
            stat_kind = attrs.get("stat_kind")
            if not stat_kind:
                raise serializers.ValidationError("stat_kind is required for a stat.")
            company = attrs.get("company")
            if company:
                self._check_membership(user, company)
                if stat_kind == HomeItem.StatKind.PENDING_MY_APPROVAL:
                    self._check_approver(user, company)

        return attrs
