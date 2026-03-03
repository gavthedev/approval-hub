from rest_framework import serializers
from .models import Request, Approval

class RequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = Request
        fields = "__all__"

class ApprovalSerializer(serializers.ModelSerializer):

    class Meta:
        model = Approval
        fields = ["decision", "comment"]
