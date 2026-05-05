from rest_framework import serializers

from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ["id", "name", "slug", "created_at", "my_role"]
        read_only_fields = ["slug", "created_by"]

    def get_my_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user, is_active=True).first()
        return membership.role if membership else None
