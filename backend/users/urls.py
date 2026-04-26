from django.urls import path

from .views import me, register, verify_email, claim_invite

urlpatterns = [
    path("me/", me),
    path("register/", register),
    path("verify/<uuid:token>/", verify_email),
    path("invite/<uuid:token>/claim/", claim_invite),
]
