import resend
from companies.models import Invite, Membership
from decouple import config
from django.utils import timezone
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User, EmailConfirmation

resend.api_key = config('RESEND_API_KEY')


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        "email": request.user.email,
        "first_name": request.user.first_name,
        "last_name": request.user.last_name,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not User.objects.filter(email=email).exists():
        user = User.objects.create_user(
            email=email,
            password=password,
            is_verified=False
        )
        confirmation = EmailConfirmation.objects.create(user=user)

        resend.Emails.send({
            "from": "noreply@approvalhub.ch",
            "to": email,
            "subject": "Confirm your ApprovalHub account",
            "html": f"<p>Click <a href='https://approvalhub.ch/verify/{confirmation.token}'>here</a> to confirm your account.</p>"
        })

    return Response(
        {"message": "If this email is not registered, you will receive a confirmation shortly."},
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_email(request, token):
    try:
        confirmation = EmailConfirmation.objects.get(token=token)

        if confirmation.is_expired():
            return Response(
                {"error": "Confirmation link has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        confirmation.user.is_verified = True
        confirmation.user.save()
        confirmation.delete()

        return Response(
            {"message": "Email confirmed successfully. You can now login."},
            status=status.HTTP_200_OK
        )
    except EmailConfirmation.DoesNotExist:
        return Response(
            {"error": "Invalid confirmation link."},
            status=status.HTTP_400_BAD_REQUEST
        )


def _verify_dob(user, date_of_birth):
    if user.date_of_birth is None:
        return Response({"error": "Your account has no date of birth on record. Please contact support."},
                        status=status.HTTP_400_BAD_REQUEST)

    if str(user.date_of_birth) != date_of_birth:
        return Response({"error": "Incorrect date of birth."}, status=status.HTTP_400_BAD_REQUEST)

    return None


def _finalize_invite_claim(invite, user):
    Membership.objects.get_or_create(
        user=user,
        company=invite.company,
        defaults={"role": invite.role}
    )
    invite.is_used = True
    invite.claimed_by = user
    invite.claimed_at = timezone.now()
    invite.save()

    return Response({
        "message": "Invite accepted! Welcome to the team.",
        "company_slug": invite.company.slug
    }, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def claim_invite(request, token):
    try:
        invite = Invite.objects.get(token=token)
    except Invite.DoesNotExist:
        return Response({"error": "Invalid invite link."}, status=400)

    if invite.is_used:
        return Response({"error": "This invite has already been used."}, status=400)

    if invite.is_expired:
        return Response({"error": "This invite has expired."}, status=400)

    user_is_active = User.objects.filter(email=invite.email, is_active=True).exists()

    if request.method == "GET":
        return Response({"user_type": "existing" if user_is_active else "new"})

    # POST
    date_of_birth = request.data.get("date_of_birth")

    if user_is_active:
        try:
            user = User.objects.get(email=invite.email, is_active=True)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

        if not date_of_birth:
            return Response({"error": "date_of_birth is required."}, status=status.HTTP_400_BAD_REQUEST)

        error = _verify_dob(user, date_of_birth)
        if error:
            return error

        return _finalize_invite_claim(invite, user)

    else:
        password = request.data.get("password")

        if not date_of_birth or not password:
            return Response({"error": "date_of_birth and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=invite.email)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

        error = _verify_dob(user, date_of_birth)
        if error:
            return error

        user.set_password(password)
        user.is_active = True
        user.is_verified = True
        user.save(update_fields=["password", "is_active", "is_verified"])

        return _finalize_invite_claim(invite, user)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_verified:
            raise serializers.ValidationError(
                {"error": "Please verify your email before logging in."}
            )
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
