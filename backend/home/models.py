from django.conf import settings
from django.db import models


class HomeItem(models.Model):
    class ItemType(models.TextChoices):
        SHORTCUT = "shortcut", "Shortcut"
        PINNED_REQUEST = "pinned_request", "Pinned Request"
        STAT = "stat", "Stat"

    class StatKind(models.TextChoices):
        MY_OPEN_REQUESTS = "my_open_requests", "My Open Requests"
        PENDING_MY_APPROVAL = "pending_my_approval", "Pending My Approval"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="home_items",
    )
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="home_items",
        null=True,
        blank=True,
    )
    item_type = models.CharField(max_length=20, choices=ItemType.choices)
    order = models.PositiveIntegerField(default=0)

    # shortcut only
    label = models.CharField(max_length=100, blank=True, default="")
    url = models.CharField(max_length=500, blank=True, default="")

    # pinned_request only
    request = models.ForeignKey(
        "approvals.Request",
        on_delete=models.CASCADE,
        related_name="pinned_by",
        null=True,
        blank=True,
    )

    # stat only
    stat_kind = models.CharField(max_length=30, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.user.email} | {self.item_type}"
