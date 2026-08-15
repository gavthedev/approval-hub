from companies.models import Membership
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import HomeItem
from .serializers import HomeItemSerializer


class HomeItemListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = HomeItemSerializer

    def get_queryset(self):
        user = self.request.user
        qs = HomeItem.objects.filter(user=user).filter(
            Q(company__isnull=True)
            | Q(company__memberships__user=user, company__memberships__is_active=True)
        )
        member_company_ids = Membership.objects.filter(
            user=user, is_active=True, role=Membership.Role.MEMBER,
        ).values_list("company_id", flat=True)
        qs = qs.exclude(
            Q(item_type=HomeItem.ItemType.PINNED_REQUEST)
            & Q(company_id__in=member_company_ids)
            & ~Q(request__created_by=user)
        )
        return qs

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
