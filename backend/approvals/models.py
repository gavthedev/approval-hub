from django.conf import settings
from django.db import models


class Request(models.Model):
    class Category(models.TextChoices):
        FREEZER = "freezer", "Freezer"
        POS = "pos", "POS"
        OVEN = "oven", "Oven"
        UNIFORM = "uniform", "Uniform"
        LAPTOP = "laptop", "Laptop"
        OTHER = "other", "Other"

    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        IN_REVIEW = "in_review", "In Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="requests",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_requests",
    )
    title = models.CharField(max_length=255)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.MEDIUM,
    )
    location = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title}"

    # ---------- State machine transitions ----------

    ALLOWED_TRANSITIONS = {
        Status.DRAFT: [Status.SUBMITTED, Status.CANCELLED],
        Status.SUBMITTED: [Status.IN_REVIEW, Status.CANCELLED],
        Status.IN_REVIEW: [Status.APPROVED, Status.REJECTED],
        Status.APPROVED: [],
        Status.REJECTED: [],
        Status.CANCELLED: [],
    }

    def can_transition_to(self, new_status):
        return new_status in self.ALLOWED_TRANSITIONS.get(self.status, [])

    def transition_to(self, new_status):
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Cannot transition from '{self.status}' to '{new_status}'"
            )
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])


class Approval(models.Model):
    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name="approvals",
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="given_approvals",
    )
    decision = models.CharField(
        max_length=20,
        choices=Decision.choices,
    )
    comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.approver.email} → {self.get_decision_display()}"


class Attachment(models.Model):
    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to="attachments/%Y/%m/")
    file_name = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploaded_attachments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name
