from datetime import date

from companies.models import Company, Membership
from companies.permissions import IsCompanyMember, IsCompanyApprover, IsCompanyAdmin
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.generics import CreateAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Request, TicketType, TicketTypeField, RequestAttachment
from .serializers import RequestSerializer, ApprovalSerializer, TicketTypeSerializer, TicketTypeFieldSerializer, \
    RequestCommentSerializer


# ── Ticket Types ────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated, IsCompanyMember])
def ticket_type_list_create(request, slug):
    if request.method == "GET":
        ticket_types = TicketType.objects.filter(company__slug=slug, is_deleted=False)
        return Response(TicketTypeSerializer(ticket_types, many=True).data)

    if request.membership.role != "admin":
        return Response({"error": "Only admins can create ticket types."}, status=status.HTTP_403_FORBIDDEN)

    serializer = TicketTypeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(company=request.membership.company, created_by=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def ticket_type_detail(request, slug, pk):
    try:
        ticket_type = TicketType.objects.get(id=pk, company__slug=slug, is_deleted=False)
    except TicketType.DoesNotExist:
        raise NotFound("Ticket type not found.")

    if request.method == "DELETE":
        ticket_type.is_deleted = True
        ticket_type.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = TicketTypeSerializer(ticket_type, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# ── Ticket Type Fields ───────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def ticket_type_field_create(request, slug, pk):
    try:
        ticket_type = TicketType.objects.get(id=pk, company__slug=slug, is_deleted=False)
    except TicketType.DoesNotExist:
        raise NotFound("Ticket type not found.")

    serializer = TicketTypeFieldSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(ticket_type=ticket_type)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def ticket_type_field_detail(request, slug, pk, field_id):
    try:
        field = TicketTypeField.objects.get(id=field_id, ticket_type__id=pk, ticket_type__company__slug=slug)
    except TicketTypeField.DoesNotExist:
        raise NotFound("Field not found.")

    if request.method == "DELETE":
        field.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = TicketTypeFieldSerializer(field, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# ── Requests ─────────────────────────────────────────────────────

class RequestListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]
    serializer_class = RequestSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        qs = Request.objects.filter(company__slug=slug, is_deleted=False)
        membership = Membership.objects.filter(
            user=self.request.user, company__slug=slug, is_active=True
        ).first()
        if membership and membership.role == "member":
            qs = qs.filter(created_by=self.request.user)
        return qs

    def perform_create(self, serializer):
        slug = self.kwargs["slug"]
        company = Company.objects.get(slug=slug)
        ticket_type_id = self.request.data.get("ticket_type")

        try:
            ticket_type = TicketType.objects.get(id=ticket_type_id, company=company, is_deleted=False, is_active=True)
        except TicketType.DoesNotExist:
            raise ValidationError("Invalid or inactive ticket type.")

        schema_snapshot = list(ticket_type.fields.values(
            "name", "field_type", "is_required", "order", "placeholder", "help_text"
        ))

        # Handle both JSON ({data: {...}}) and multipart (data.<name> flat keys)
        raw_data = self.request.data.get("data")
        if isinstance(raw_data, dict):
            data = raw_data
        else:
            data = {
                key[5:]: value
                for key, value in self.request.data.items()
                if key.startswith("data.") and not self.request.FILES.get(key)
            }

        user = self.request.user
        first_name = user.first_name
        last_name = user.last_name
        last_initial = f" {last_name[0]}." if last_name else ""
        name_part = f"{first_name}{last_initial}" if first_name else user.email
        day_str = date.today().strftime("%d %b")
        title = f"{ticket_type.name} | {name_part} | {day_str}"

        instance = serializer.save(
            company=company,
            created_by=user,
            ticket_type=ticket_type,
            schema_snapshot=schema_snapshot,
            data=data,
        )
        instance.title = title
        instance.save(update_fields=["title"])
        instance.transition_to(Request.Status.SUBMITTED, changed_by=user)

        for key, file in self.request.FILES.items():
            if key.startswith("data."):
                RequestAttachment.objects.create(
                    request=instance,
                    file=file,
                    filename=file.name,
                    file_size=file.size,
                    uploaded_by=user,
                )


class ApproveRequestView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]
    serializer_class = ApprovalSerializer

    def perform_create(self, serializer):
        try:
            approval_request = Request.objects.get(
                id=self.kwargs["pk"], company__slug=self.kwargs["slug"], is_deleted=False
            )
        except Request.DoesNotExist:
            raise NotFound("Request not found.")

        if not approval_request.can_transition_to(Request.Status.APPROVED):
            raise ValidationError(f"Cannot approve a request with status '{approval_request.status}'.")

        serializer.save(approver=self.request.user, request=approval_request)
        approval_request.transition_to(
            Request.Status.APPROVED,
            changed_by=self.request.user,
            comment=self.request.data.get("comment", "")
        )


class RejectRequestView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]
    serializer_class = ApprovalSerializer

    def perform_create(self, serializer):
        try:
            approval_request = Request.objects.get(
                id=self.kwargs["pk"], company__slug=self.kwargs["slug"], is_deleted=False
            )
        except Request.DoesNotExist:
            raise NotFound("Request not found.")

        if not approval_request.can_transition_to(Request.Status.REJECTED):
            raise ValidationError(f"Cannot reject a request with status '{approval_request.status}'.")

        serializer.save(approver=self.request.user, request=approval_request)
        approval_request.transition_to(
            Request.Status.REJECTED,
            changed_by=self.request.user,
            comment=self.request.data.get("comment", "")
        )


class ReviewRequestView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]

    def post(self, request, slug, pk):
        try:
            approval_request = Request.objects.get(id=pk, company__slug=slug, is_deleted=False)
        except Request.DoesNotExist:
            raise NotFound("Request not found.")

        if not approval_request.can_transition_to(Request.Status.IN_REVIEW):
            raise ValidationError(f"Cannot move a request with status '{approval_request.status}' to review.")

        approval_request.transition_to(
            Request.Status.IN_REVIEW,
            changed_by=request.user
        )
        return Response({"status": "in_review"})


def _get_visible_request(request, slug, pk):
    """Scope a single-request lookup the same way the list view scopes its
    queryset: members only ever get their own requests, approvers/admins get
    the whole company. Without this a member could read or comment on any
    other member's request by guessing its id.
    """
    qs = Request.objects.filter(company__slug=slug, is_deleted=False)
    if request.membership.role == "member":
        qs = qs.filter(created_by=request.user)
    try:
        return qs.get(id=pk)
    except Request.DoesNotExist:
        raise NotFound("Request not found.")


# ── Comments ─────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsCompanyMember])
def add_comment(request, slug, pk):
    approval_request = _get_visible_request(request, slug, pk)

    serializer = RequestCommentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(request=approval_request, author=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ── Details ─────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyMember])
def request_detail(request, slug, pk):
    req = _get_visible_request(request, slug, pk)
    return Response(RequestSerializer(req, context={'request': request}).data)
