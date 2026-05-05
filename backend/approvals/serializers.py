from rest_framework import serializers

from .models import Request, Approval, TicketType, TicketTypeField, RequestComment, RequestStatusHistory, \
    RequestAttachment


class TicketTypeFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketTypeField
        fields = ["id", "name", "field_type", "is_required", "order", "placeholder", "help_text", "max_file_size",
                  "allowed_file_types"]


class TicketTypeSerializer(serializers.ModelSerializer):
    fields = TicketTypeFieldSerializer(many=True, read_only=True)

    class Meta:
        model = TicketType
        fields = ["id", "name", "is_active", "created_at", "fields"]
        read_only_fields = ["created_at"]


class RequestCommentSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source="author.email", read_only=True)

    class Meta:
        model = RequestComment
        fields = ["id", "author_email", "text", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class RequestStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source="changed_by.email", read_only=True)

    class Meta:
        model = RequestStatusHistory
        fields = ["id", "from_status", "to_status", "changed_by_email", "comment", "created_at"]
        read_only_fields = ["created_at"]


class RequestAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestAttachment
        fields = ["id", "filename", "file_size", "created_at"]
        read_only_fields = ["created_at"]


class RequestSerializer(serializers.ModelSerializer):
    comments = RequestCommentSerializer(many=True, read_only=True)
    status_history = RequestStatusHistorySerializer(many=True, read_only=True)
    attachments = RequestAttachmentSerializer(many=True, read_only=True)
    ticket_type_name = serializers.CharField(source="ticket_type.name", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Request
        fields = [
            "id", "ticket_type", "ticket_type_name", "status",
            "schema_snapshot", "data", "created_by_email",
            "created_at", "updated_at", "comments",
            "status_history", "attachments"
        ]
        read_only_fields = ["status", "schema_snapshot", "created_at", "updated_at"]


class ApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Approval
        fields = ["decision", "comment"]