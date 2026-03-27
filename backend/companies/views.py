from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated

from .models import Company, Membership
from .serializers import CompanySerializer


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
