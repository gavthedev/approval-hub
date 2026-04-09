import resend
from decouple import config
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

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
