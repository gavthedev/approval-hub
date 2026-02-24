from django.contrib import admin

from .models import Approval, Attachment, Request


class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0
    readonly_fields = ("file_name", "uploaded_by", "created_at")


class ApprovalInline(admin.StackedInline):
    model = Approval
    extra = 0
    readonly_fields = ("approver", "decision", "comment", "created_at")


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "created_by", "category", "severity", "status", "created_at")
    list_filter = ("status", "severity", "category", "company")
    search_fields = ("title", "description", "created_by__email")
    readonly_fields = ("created_at", "updated_at")
    inlines = [AttachmentInline, ApprovalInline]


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ("request", "approver", "decision", "created_at")
    list_filter = ("decision",)
    search_fields = ("request__title", "approver__email")
    readonly_fields = ("created_at",)


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("file_name", "request", "uploaded_by", "created_at")
    search_fields = ("file_name", "request__title")
    readonly_fields = ("created_at",)
