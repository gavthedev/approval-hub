from django.contrib import admin

from .models import Company, Invite, Membership


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_by", "created_at")
    search_fields = ("name", "slug")
    readonly_fields = ("slug", "created_at", "updated_at")
    prepopulated_fields = {}  # slug is auto-generated in save()


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "company", "role", "is_active", "joined_at")
    list_filter = ("role", "is_active", "company")
    search_fields = ("user__email", "company__name")
    readonly_fields = ("joined_at",)


@admin.register(Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ("company", "email", "role", "is_used", "is_expired", "created_at")
    list_filter = ("is_used", "role", "company")
    search_fields = ("email", "company__name")
    readonly_fields = ("token", "created_at", "claimed_at")

    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True
