import pytest
from companies.models import Company, Membership
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from users.models import User

from .models import Approval, Request, RequestAttachment, TicketType, TicketTypeField


# ── Fix 1: self-approval block ──────────────────────────────────

@pytest.mark.django_db
def test_creator_cannot_approve_own_request():
    client = APIClient()
    creator = User.objects.create_user(email="selfapprove@test.com", password="pass")
    company = Company.objects.create(name="Self Approve Co", created_by=creator)
    # creator also holds the approver role in their own company
    Membership.objects.create(user=creator, company=company, role="approver")

    req = Request.objects.create(
        company=company, created_by=creator, title="Buy myself a laptop",
        status=Request.Status.IN_REVIEW,
    )

    client.force_authenticate(user=creator)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/approve/", {
        "decision": "approved", "comment": "Approving my own request",
    })
    assert res.status_code == 403

    # no state mutation happened
    req.refresh_from_db()
    assert req.status == Request.Status.IN_REVIEW
    assert Approval.objects.filter(request=req).count() == 0


@pytest.mark.django_db
def test_creator_cannot_reject_own_request():
    client = APIClient()
    creator = User.objects.create_user(email="selfreject@test.com", password="pass")
    company = Company.objects.create(name="Self Reject Co", created_by=creator)
    Membership.objects.create(user=creator, company=company, role="admin")

    req = Request.objects.create(
        company=company, created_by=creator, title="Approve my own thing",
        status=Request.Status.IN_REVIEW,
    )

    client.force_authenticate(user=creator)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/reject/", {
        "decision": "rejected", "comment": "n/a",
    })
    assert res.status_code == 403

    req.refresh_from_db()
    assert req.status == Request.Status.IN_REVIEW
    assert Approval.objects.filter(request=req).count() == 0


@pytest.mark.django_db
def test_creator_cannot_review_own_request():
    client = APIClient()
    creator = User.objects.create_user(email="selfreview@test.com", password="pass")
    company = Company.objects.create(name="Self Review Co", created_by=creator)
    Membership.objects.create(user=creator, company=company, role="admin")

    req = Request.objects.create(
        company=company, created_by=creator, title="Review my own thing",
        status=Request.Status.SUBMITTED,
    )

    client.force_authenticate(user=creator)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/review/")
    assert res.status_code == 403

    req.refresh_from_db()
    assert req.status == Request.Status.SUBMITTED


@pytest.mark.django_db
def test_self_approval_block_takes_priority_over_invalid_transition():
    # status is DRAFT, so can_transition_to(APPROVED) would also fail (400) -
    # confirm the 403 self-check fires first rather than a 400 transition error,
    # matching the code's check ordering.
    client = APIClient()
    creator = User.objects.create_user(email="selfdraft@test.com", password="pass")
    company = Company.objects.create(name="Self Draft Co", created_by=creator)
    Membership.objects.create(user=creator, company=company, role="admin")

    req = Request.objects.create(
        company=company, created_by=creator, title="Still a draft",
        status=Request.Status.DRAFT,
    )

    client.force_authenticate(user=creator)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/approve/", {
        "decision": "approved", "comment": "x",
    })
    assert res.status_code == 403


@pytest.mark.django_db
def test_different_approver_can_still_approve_reject_review():
    # regression check: the self-approval block must not break the legitimate flow
    client = APIClient()
    member = User.objects.create_user(email="legitmember@test.com", password="pass")
    approver = User.objects.create_user(email="legitapprover@test.com", password="pass")
    company = Company.objects.create(name="Legit Flow Co", created_by=approver)
    Membership.objects.create(user=member, company=company, role="member")
    Membership.objects.create(user=approver, company=company, role="approver")

    req = Request.objects.create(
        company=company, created_by=member, title="Fix freezer",
        status=Request.Status.SUBMITTED,
    )

    client.force_authenticate(user=approver)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/review/")
    assert res.status_code == 200
    req.refresh_from_db()
    assert req.status == Request.Status.IN_REVIEW

    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/approve/", {
        "decision": "approved", "comment": "Looks good",
    })
    assert res.status_code == 201
    req.refresh_from_db()
    assert req.status == Request.Status.APPROVED
    assert Approval.objects.filter(request=req).count() == 1


@pytest.mark.django_db
def test_different_approver_can_still_reject():
    client = APIClient()
    member = User.objects.create_user(email="legitmember2@test.com", password="pass")
    approver = User.objects.create_user(email="legitapprover2@test.com", password="pass")
    company = Company.objects.create(name="Legit Reject Co", created_by=approver)
    Membership.objects.create(user=member, company=company, role="member")
    Membership.objects.create(user=approver, company=company, role="approver")

    req = Request.objects.create(
        company=company, created_by=member, title="Broken chair",
        status=Request.Status.IN_REVIEW,
    )

    client.force_authenticate(user=approver)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/reject/", {
        "decision": "rejected", "comment": "Not needed",
    })
    assert res.status_code == 201
    req.refresh_from_db()
    assert req.status == Request.Status.REJECTED


# ── Fix 2: decision is server-set, not client-controlled ────────

@pytest.mark.django_db
def test_approve_endpoint_ignores_client_supplied_decision():
    client = APIClient()
    member = User.objects.create_user(email="fix2member@test.com", password="pass")
    approver = User.objects.create_user(email="fix2approver@test.com", password="pass")
    company = Company.objects.create(name="Fix2 Approve Co", created_by=approver)
    Membership.objects.create(user=member, company=company, role="member")
    Membership.objects.create(user=approver, company=company, role="approver")

    req = Request.objects.create(
        company=company, created_by=member, title="Test", status=Request.Status.IN_REVIEW,
    )

    client.force_authenticate(user=approver)
    # client tries to sneak a "rejected" decision into an approve request
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/approve/", {
        "decision": "rejected", "comment": "x",
    })
    assert res.status_code == 201

    req.refresh_from_db()
    assert req.status == Request.Status.APPROVED

    approval = Approval.objects.get(request=req)
    assert approval.decision == Approval.Decision.APPROVED


@pytest.mark.django_db
def test_reject_endpoint_ignores_client_supplied_decision():
    client = APIClient()
    member = User.objects.create_user(email="fix2member2@test.com", password="pass")
    approver = User.objects.create_user(email="fix2approver2@test.com", password="pass")
    company = Company.objects.create(name="Fix2 Reject Co", created_by=approver)
    Membership.objects.create(user=member, company=company, role="member")
    Membership.objects.create(user=approver, company=company, role="approver")

    req = Request.objects.create(
        company=company, created_by=member, title="Test", status=Request.Status.IN_REVIEW,
    )

    client.force_authenticate(user=approver)
    # client tries to sneak an "approved" decision into a reject request
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/reject/", {
        "decision": "approved", "comment": "x",
    })
    assert res.status_code == 201

    req.refresh_from_db()
    assert req.status == Request.Status.REJECTED

    approval = Approval.objects.get(request=req)
    assert approval.decision == Approval.Decision.REJECTED


# ── Fix 3: file upload type/size validation ──────────────────────

def _make_ticket_type_with_file_field(company, admin, allowed="pdf,jpg", max_mb=1):
    tt = TicketType.objects.create(company=company, name="Expense Report", created_by=admin)
    field = TicketTypeField.objects.create(
        ticket_type=tt, name="receipt", field_type=TicketTypeField.FieldType.FILE,
        is_required=False, allowed_file_types=allowed, max_file_size=max_mb,
    )
    return tt, field


@pytest.mark.django_db
def test_disallowed_file_extension_rejected_and_no_request_created():
    client = APIClient()
    admin = User.objects.create_user(email="fix3admin@test.com", password="pass")
    company = Company.objects.create(name="Fix3 Co", created_by=admin)
    Membership.objects.create(user=admin, company=company, role="member")
    tt, field = _make_ticket_type_with_file_field(company, admin)

    bad_file = SimpleUploadedFile("virus.exe", b"MZ fake exe content", content_type="application/octet-stream")

    client.force_authenticate(user=admin)
    res = client.post(f"/api/companies/{company.slug}/requests/", {
        "ticket_type": tt.id,
        "data.receipt": bad_file,
    }, format="multipart")

    assert res.status_code == 400
    assert Request.objects.filter(company=company).count() == 0
    assert RequestAttachment.objects.count() == 0


@pytest.mark.django_db
def test_oversized_file_rejected_and_no_request_created():
    client = APIClient()
    admin = User.objects.create_user(email="fix3admin2@test.com", password="pass")
    company = Company.objects.create(name="Fix3 Size Co", created_by=admin)
    Membership.objects.create(user=admin, company=company, role="member")
    tt, field = _make_ticket_type_with_file_field(company, admin, allowed="pdf,jpg", max_mb=1)

    oversized_content = b"a" * (2 * 1024 * 1024)  # 2MB, over the 1MB limit
    big_file = SimpleUploadedFile("receipt.pdf", oversized_content, content_type="application/pdf")

    client.force_authenticate(user=admin)
    res = client.post(f"/api/companies/{company.slug}/requests/", {
        "ticket_type": tt.id,
        "data.receipt": big_file,
    }, format="multipart")

    assert res.status_code == 400
    assert Request.objects.filter(company=company).count() == 0
    assert RequestAttachment.objects.count() == 0


@pytest.mark.django_db
def test_valid_small_pdf_accepted():
    client = APIClient()
    admin = User.objects.create_user(email="fix3admin3@test.com", password="pass")
    company = Company.objects.create(name="Fix3 Valid Co", created_by=admin)
    Membership.objects.create(user=admin, company=company, role="member")
    tt, field = _make_ticket_type_with_file_field(company, admin, allowed="pdf,jpg", max_mb=1)

    good_file = SimpleUploadedFile("receipt.pdf", b"%PDF-1.4 fake pdf content", content_type="application/pdf")

    client.force_authenticate(user=admin)
    res = client.post(f"/api/companies/{company.slug}/requests/", {
        "ticket_type": tt.id,
        "data.receipt": good_file,
    }, format="multipart")

    assert res.status_code == 201
    assert Request.objects.filter(company=company).count() == 1
    attachment = RequestAttachment.objects.get()
    assert attachment.filename == "receipt.pdf"
    assert attachment.request.company == company


@pytest.mark.django_db
def test_unrestricted_file_field_accepts_any_extension():
    client = APIClient()
    admin = User.objects.create_user(email="fix3admin4@test.com", password="pass")
    company = Company.objects.create(name="Fix3 Unrestricted Co", created_by=admin)
    Membership.objects.create(user=admin, company=company, role="member")
    # empty allowed_file_types -> no restriction configured
    tt, field = _make_ticket_type_with_file_field(company, admin, allowed="", max_mb=None)

    weird_file = SimpleUploadedFile("notes.xyz", b"whatever content", content_type="application/octet-stream")

    client.force_authenticate(user=admin)
    res = client.post(f"/api/companies/{company.slug}/requests/", {
        "ticket_type": tt.id,
        "data.receipt": weird_file,
    }, format="multipart")

    assert res.status_code == 201
    assert Request.objects.filter(company=company).count() == 1
    assert RequestAttachment.objects.filter(filename="notes.xyz").exists()
