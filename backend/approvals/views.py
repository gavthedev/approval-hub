from companies.models import Company
from companies.permissions import IsCompanyMember, IsCompanyApprover
from rest_framework.exceptions import ValidationError
from rest_framework.generics import CreateAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Request, Approval
from .serializers import RequestSerializer, ApprovalSerializer


class RequestListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]
    serializer_class = RequestSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Request.objects.filter(company__slug=slug)

    def perform_create(self, serializer):
        slug = self.kwargs["slug"]
        company = Company.objects.get(slug=slug)
        instance = serializer.save(
            company=company,
            created_by=self.request.user
        )
        instance.transition_to(Request.Status.SUBMITTED)


class ApproveRequestCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]
    serializer_class = ApprovalSerializer

    def perform_create(self, serializer):
        request_id = self.kwargs["pk"]
        approval_request = Request.objects.get(id=request_id)

        if Approval.objects.filter(request=approval_request).exists():
            raise ValidationError("This request has already been reviewed.")

        if not approval_request.can_transition_to(Request.Status.APPROVED):
            raise ValidationError(f"Cannot approve a request with status '{approval_request.status}'.")

        serializer.save(approver=self.request.user, request=approval_request)
        approval_request.transition_to(Request.Status.APPROVED)


class RejectRequestCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]
    serializer_class = ApprovalSerializer

    def perform_create(self, serializer):
        request_id = self.kwargs["pk"]
        approval_request = Request.objects.get(id=request_id)

        if Approval.objects.filter(request=approval_request).exists():
            raise ValidationError("This request has already been reviewed.")

        if not approval_request.can_transition_to(Request.Status.REJECTED):
            raise ValidationError(f"Cannot reject a request with status '{approval_request.status}'.")

        serializer.save(approver=self.request.user, request=approval_request)
        approval_request.transition_to(Request.Status.REJECTED)


class ReviewRequestView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]

    def post(self, request, slug, pk):
        approval_request = Request.objects.get(id=pk)
        approval_request.reviewed_by = request.user
        approval_request.save(update_fields=["reviewed_by"])
        approval_request.transition_to(Request.Status.IN_REVIEW)
        return Response({"status": "in_review"})
