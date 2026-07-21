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
    file_url = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    class Meta:
        model = RequestAttachment
        fields = ["id", "filename", "file_size", "created_at", "file_url"]
        read_only_fields = ["created_at"]


class RequestSerializer(serializers.ModelSerializer):
    comments = RequestCommentSerializer(many=True, read_only=True)
    status_history = RequestStatusHistorySerializer(many=True, read_only=True)
    attachments = RequestAttachmentSerializer(many=True, read_only=True)
    ticket_type_name = serializers.CharField(source="ticket_type.name", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    created_by_name = serializers.SerializerMethodField()

    def get_created_by_name(self, obj):
        user = obj.created_by
        first_name = user.first_name
        last_name = user.last_name
        if first_name or last_name:
            if last_name:
                return f"{first_name} {last_name[0]}."
            return first_name
        return user.email

    class Meta:
        model = Request
        fields = [
            "id", "ticket_type", "ticket_type_name", "title", "status",
            "schema_snapshot", "data", "created_by_email", "created_by_name",
            "created_at", "updated_at", "comments",
            "status_history", "attachments"
        ]
        read_only_fields = ["title", "status", "schema_snapshot", "created_at", "updated_at"]


class ApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Approval
        fields = ["decision", "comment"]