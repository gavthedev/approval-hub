from django.contrib import admin

from .models import Approval, Request, RequestAttachment, RequestComment, RequestStatusHistory, TicketType, \
    TicketTypeField


class RequestAttachmentInline(admin.TabularInline):
    model = RequestAttachment
    extra = 0
    readonly_fields = ("filename", "file_size", "uploaded_by", "created_at")


class ApprovalInline(admin.StackedInline):
    model = Approval
    extra = 0
    readonly_fields = ("approver", "decision", "comment", "created_at")


class RequestCommentInline(admin.TabularInline):
    model = RequestComment
    extra = 0
    readonly_fields = ("author", "text", "created_at", "updated_at")


class RequestStatusHistoryInline(admin.TabularInline):
    model = RequestStatusHistory
    extra = 0
    readonly_fields = ("from_status", "to_status", "changed_by", "comment", "created_at")


class TicketTypeFieldInline(admin.TabularInline):
    model = TicketTypeField
    extra = 0


@admin.register(TicketType)
class TicketTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "company", "is_active", "created_by", "created_at")
    list_filter = ("is_active", "company")
    search_fields = ("name", "company__name")
    readonly_fields = ("created_at",)
    inlines = [TicketTypeFieldInline]


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ("ticket_type", "company", "created_by", "status", "created_at")
    list_filter = ("status", "company")
    search_fields = ("created_by__email", "company__name")
    readonly_fields = ("created_at", "updated_at", "schema_snapshot", "data")
    inlines = [RequestAttachmentInline, ApprovalInline, RequestCommentInline, RequestStatusHistoryInline]


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ("request", "approver", "decision", "created_at")
    list_filter = ("decision",)
    search_fields = ("approver__email",)
    readonly_fields = ("created_at",)