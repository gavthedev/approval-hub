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
        # Membership is only checked at creation time (HomeItemSerializer.validate).
        # Re-check it here too, so an item stops being returned the moment the
        # user's membership in its company lapses, instead of staying visible
        # (with live, current data) for as long as their access token is valid.
        qs = HomeItem.objects.filter(user=user).filter(
            Q(company__isnull=True)
            | Q(company__memberships__user=user, company__memberships__is_active=True)
        )
        # Same reasoning for role: a pinned request is only visible to a plain
        # member if they created the underlying request (the boundary the
        # request list/detail views enforce), re-checked live since the
        # pinning user's role can be downgraded after the item was created.
        # The company id list is precomputed rather than joined inline
        # because exclude() checks conditions spanning a multi-valued
        # relation (company__memberships) as independent EXISTS clauses, so
        # is_active/role/user would each match against any membership row on
        # the company instead of jointly against this user's one row.
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
