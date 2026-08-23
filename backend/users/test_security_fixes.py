from datetime import date

import pytest
from companies.models import Company, Invite, Membership
from django.utils import timezone
from rest_framework.test import APIClient
from users.models import User


# ── Fix 4: password strength enforcement ──────────────────────────

@pytest.mark.django_db
def test_register_rejects_weak_password(monkeypatch):
    sent = []
    monkeypatch.setattr("users.views.resend.Emails.send", lambda payload: sent.append(payload))

    client = APIClient()
    res = client.post("/api/register/", {
        "email": "weakpass@test.com",
        "password": "password",  # common password -> fails CommonPasswordValidator
    })
    assert res.status_code == 400
    assert not User.objects.filter(email="weakpass@test.com").exists()
    assert sent == []  # no confirmation email sent for a rejected registration


@pytest.mark.django_db
def test_register_rejects_all_numeric_password(monkeypatch):
    sent = []
    monkeypatch.setattr("users.views.resend.Emails.send", lambda payload: sent.append(payload))

    client = APIClient()
    res = client.post("/api/register/", {
        "email": "numericpass@test.com",
        "password": "12345678",  # fails NumericPasswordValidator
    })
    assert res.status_code == 400
    assert not User.objects.filter(email="numericpass@test.com").exists()


@pytest.mark.django_db
def test_register_accepts_strong_password(monkeypatch):
    sent = []
    monkeypatch.setattr("users.views.resend.Emails.send", lambda payload: sent.append(payload))

    client = APIClient()
    res = client.post("/api/register/", {
        "email": "strongpass@test.com",
        "password": "Xk7$mQ2vLp9!wZrT",
    })
    assert res.status_code == 201
    assert User.objects.filter(email="strongpass@test.com").exists()
    assert len(sent) == 1  # confirmation email still sent on success (no regression)


def _make_pending_invite(dob=date(1990, 5, 20)):
    admin = User.objects.create_user(email="fix4admin@test.com", password="pass")
    company = Company.objects.create(name="Fix4 Invite Co", created_by=admin)
    Membership.objects.create(user=admin, company=company, role="admin")

    invited_user = User.objects.create_user(
        email="fix4invitee@test.com",
        password=None,
        first_name="Jane",
        last_name="Doe",
        date_of_birth=dob,
        is_verified=False,
        is_active=False,
    )
    invite = Invite.objects.create(
        company=company,
        email="fix4invitee@test.com",
        role="member",
        created_by=admin,
        expires_at=timezone.now() + timezone.timedelta(days=7),
    )
    return company, invited_user, invite, dob


@pytest.mark.django_db
def test_claim_invite_rejects_weak_password_for_new_user():
    company, invited_user, invite, dob = _make_pending_invite()
    old_password_hash = invited_user.password

    client = APIClient()
    res = client.post(f"/api/invite/{invite.token}/claim/", {
        "date_of_birth": str(dob),
        "password": "password",  # common password -> fails CommonPasswordValidator
    })
    assert res.status_code == 400

    invited_user.refresh_from_db()
    assert invited_user.is_active is False
    assert invited_user.password == old_password_hash

    invite.refresh_from_db()
    assert invite.is_used is False
    assert not Membership.objects.filter(user=invited_user, company=company).exists()


@pytest.mark.django_db
def test_claim_invite_accepts_strong_password_for_new_user():
    company, invited_user, invite, dob = _make_pending_invite()

    client = APIClient()
    res = client.post(f"/api/invite/{invite.token}/claim/", {
        "date_of_birth": str(dob),
        "password": "Xk7$mQ2vLp9!wZrT",
    })
    assert res.status_code == 200

    invited_user.refresh_from_db()
    assert invited_user.is_active is True
    assert Membership.objects.filter(user=invited_user, company=company).exists()
