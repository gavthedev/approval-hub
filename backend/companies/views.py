from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import CompanySerializer
from rest_framework.generics import ListCreateAPIView
from .models import Company

class CompanyListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CompanySerializer

    def get_queryset(self):
        return Company.objects.filter(memberships__user=self.request.user)