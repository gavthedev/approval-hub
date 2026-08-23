import pytest
from companies.models import Company, Invite
from companies.views import _send_invite_email
from django.utils import timezone
from users.models import User


# ── Fix 5: HTML-escaping in invite emails ─────────────────────────

@pytest.mark.django_db
def test_send_invite_email_escapes_company_name_and_first_name(monkeypatch):
    captured = {}

    def fake_send(payload):
        captured.update(payload)
        return {"id": "fake-id"}  # mimic resend's response shape, no real network call

    monkeypatch.setattr("companies.views.resend.Emails.send", fake_send)

    admin = User.objects.create_user(email="xssadmin@test.com", password="pass")
    company = Company.objects.create(name="<script>alert(1)</script>", created_by=admin)
    invite = Invite.objects.create(
        company=company,
        email="victim@test.com",
        role="member",
        created_by=admin,
        expires_at=timezone.now() + timezone.timedelta(days=7),
    )

    _send_invite_email(company, "victim@test.com", "<img src=x onerror=alert(1)>", invite)

    assert captured  # confirm the stub was actually invoked, not a real API call
    html = captured["html"]

    # raw script/img tags must not appear unescaped in the email body
    assert "<script>alert(1)</script>" not in html
    assert "<img src=x onerror=alert(1)>" not in html

    # the escaped versions should be present instead
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html
    assert "&lt;img src=x onerror=alert(1)&gt;" in html


@pytest.mark.django_db
def test_send_invite_email_no_real_network_call_and_normal_name_unaffected(monkeypatch):
    captured = {}
    monkeypatch.setattr("companies.views.resend.Emails.send", lambda payload: captured.update(payload))

    admin = User.objects.create_user(email="normaladmin@test.com", password="pass")
    company = Company.objects.create(name="Acme Corp", created_by=admin)
    invite = Invite.objects.create(
        company=company,
        email="newhire@test.com",
        role="member",
        created_by=admin,
        expires_at=timezone.now() + timezone.timedelta(days=7),
    )

    _send_invite_email(company, "newhire@test.com", "Sam", invite)

    assert captured
    assert "Welcome to Acme Corp!" in captured["html"]
    assert "Hi Sam," in captured["html"]
    assert str(invite.token) in captured["html"]
