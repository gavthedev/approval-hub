from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import HomeItem
from .serializers import HomeItemSerializer


class HomeItemListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = HomeItemSerializer

    def get_queryset(self):
        return HomeItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_home_item(request, pk):
    try:
        item = HomeItem.objects.get(id=pk, user=request.user)
    except HomeItem.DoesNotExist:
        raise NotFound("Home item not found.")

    item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
