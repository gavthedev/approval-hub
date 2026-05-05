import resend
from decouple import config
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User

from .models import Company, Membership, Invite
from .serializers import CompanySerializer

resend.api_key = config('RESEND_API_KEY')


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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invite_member(request, slug):
    try:
        membership = Membership.objects.get(
            user=request.user,
            company__slug=slug,
            role=Membership.Role.ADMIN,
            is_active=True
        )
    except Membership.DoesNotExist:
        return Response(
            {"error": "You don't have permission to invite members."},
            status=status.HTTP_403_FORBIDDEN
        )

    company = membership.company

    email = request.data.get("email")
    first_name = request.data.get("first_name")
    last_name = request.data.get("last_name")
    role = request.data.get("role", "member")
    date_of_birth = request.data.get("date_of_birth")

    if not all([email, first_name, last_name, date_of_birth]):
        return Response(
            {"error": "email, first_name, last_name and date_of_birth are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "A user with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        email=email,
        password=None,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
        is_verified=False,
        is_active=False,
    )

    invite = Invite.objects.create(
        company=company,
        email=email,
        role=role,
        created_by=request.user,
        expires_at=timezone.now() + timezone.timedelta(days=7),
    )

    resend.Emails.send({
        "from": "noreply@approvalhub.ch",
        "to": email,
        "subject": f"You've been invited to {company.name} on ApprovalHub",
        "html": f"""
            <h2>Welcome to {company.name}!</h2>
            <p>Hi {first_name},</p>
            <p>You have been invited to join <strong>{company.name}</strong> on ApprovalHub.</p>
            <p>Click the link below to set up your account:</p>
            <a href="https://approvalhub.ch/invite/{invite.token}">Accept Invitation</a>
            <p>This link expires in 7 days.</p>
        """
    })

    return Response(
        {"message": f"Invitation sent to {email}."},
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_role(request, slug):
    try:
        membership = Membership.objects.get(
            user=request.user,
            company__slug=slug,
            is_active=True
        )
        return Response({"role": membership.role})
    except Membership.DoesNotExist:
        return Response({"error": "Not a member."}, status=status.HTTP_403_FORBIDDEN)
