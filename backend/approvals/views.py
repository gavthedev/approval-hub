from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RequestSerializer
from rest_framework.generics import ListCreateAPIView
from .models import Request

class RequestListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RequestSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return Request.objects.filter(company__slug=slug)