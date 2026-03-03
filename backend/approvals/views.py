from .serializers import RequestSerializer, ApprovalSerializer
from rest_framework.generics import CreateAPIView, ListCreateAPIView
from .models import Request
from rest_framework.permissions import IsAuthenticated
from companies.permissions import IsCompanyMember, IsCompanyApprover

class RequestListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyMember]
    serializer_class = RequestSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Request.objects.filter(company__slug=slug)

class ApproveRequestView(CreateAPIView):
    permission_classes = [IsAuthenticated, IsCompanyApprover]
    serializer_class = ApprovalSerializer

    def perform_create(self, serializer):
        request_id = self.kwargs["pk"]
        approval_request = Request.objects.get(id=request_id)
        serializer.save(
            approver=self.request.user,
            request=approval_request
        )
