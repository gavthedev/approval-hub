from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User


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

    if User.objects.filter(email=email).exists():
        return Response(
            {"message": "If this email is not registered, you will receive a confirmation shortly."},
            status=status.HTTP_201_CREATED
        )

    User.objects.create_user(email=email, password=password)
    return Response(
        {"message": "If this email is not registered, you will receive a confirmation shortly."},
        status=status.HTTP_201_CREATED
    )
