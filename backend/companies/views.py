from rest_framework.permissions import IsAuthenticated
from .serializers import CompanySerializer
from rest_framework.generics import ListCreateAPIView
from .models import Company, Membership

class CompanyListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CompanySerializer

    def get_queryset(self):
        return Company.objects.filter(memberships__user=self.request.user)

    def perform_create(self, serializer):
        company = serializer.save(created_by=self.request.user)
        Membership.objects.create(
            user=self.request.user,
            company=company,
            role=Membership.Role.ADMIN
        )
