from .serializers import RequestSerializer, ApprovalSerializer
from rest_framework.generics import CreateAPIView, ListCreateAPIView
from .models import Request, Approval
from rest_framework.permissions import IsAuthenticated
from companies.permissions import IsCompanyMember, IsCompanyApprover
from rest_framework.exceptions import ValidationError

class RequestListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]
    serializer_class = RequestSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Request.objects.filter(company__slug=slug)

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

class RejectRequestCreateVIEW(CreateAPIVIEW):
    permission_classes = [IsAuthenticated, IsCompanyApprover]
    serializer_class = ApprovalSerializer

    def perform_create(self, serializer):
        request_id = selfkwargs["pk"]
        approval_request = Request.objects.get(id=request_id)

        if Approval.objects.filter(request=approval_request).exists():
            raise ValidationError("This request has already been reviewed.")

        serializer.save(
            approver=self.request.user,
            request=approval_request
        )
        approval_request.transition_to(Request.Status.REJECTED)
