from rest_framework import serializers
from .models import Request, Approval

class RequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = Request
        fields = "__all__"
        read_only_fields = ["company", "created_by", "status", "reviewed_by"]

class ApprovalSerializer(serializers.ModelSerializer):

    class Meta:
        model = Approval
        fields = ["decision", "comment"]
