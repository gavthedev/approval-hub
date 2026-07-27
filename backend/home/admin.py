from django.contrib import admin

from .models import HomeItem


@admin.register(HomeItem)
class HomeItemAdmin(admin.ModelAdmin):
    list_display = ("user", "item_type", "company", "label", "stat_kind", "created_at")
    list_filter = ("item_type", "company")
    search_fields = ("user__email", "label")
    readonly_fields = ("created_at",)
