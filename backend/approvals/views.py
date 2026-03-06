from .serializers import RequestSerializer, ApprovalSerializer
from rest_framework.generics import CreateAPIView, ListCreateAPIView
from .models import Request, Approval
from rest_framework.permissions import IsAuthenticated
from companies.permissions import IsCompanyMember, IsCompanyApprover
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from companies.models import Company

class RequestListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]
    serializer_class = RequestSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Request.objects.filter(company__slug=slug)

    def perform_create(self, serializer):
        slug = self.kwargs["slug"]
        company=Company.objects.get(slug=slug)
        serializer.save(
            company=company,
            created_by=self.request.user
        )

class ApproveRequestCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]
    serializer_class = ApprovalSerializer

    def perform_create(self, serializer):
        request_id = self.kwargs["pk"]
        approval_request = Request.objects.get(id=request_id)

        if Approval.objects.filter(request=approval_request).exists():
            raise ValidationError("This request has already been reviewed.")

        serializer.save(
            approver=self.request.user,
            request=approval_request
        )
        approval_request.transition_to(Request.Status.APPROVED)

class RejectRequestCreateView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]
    serializer_class = ApprovalSerializer

    def perform_create(self, serializer):
        request_id = self.kwargs["pk"]
        approval_request = Request.objects.get(id=request_id)

        if Approval.objects.filter(request=approval_request).exists():
            raise ValidationError("This request has already been reviewed.")

        serializer.save(
            approver=self.request.user,
            request=approval_request
        )
        approval_request.transition_to(Request.Status.REJECTED)

class ReviewRequestView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]

    def post(self, request, slug, pk):
        approval_request = Request.objects.get(id=pk)
        approval_request.reviewed_by = request.user
        approval_request.save(update_fields=["reviewed_by"])
        approval_request.transition_to(Request.Status.IN_REVIEW)
        return Response({"status": "in_review"})
