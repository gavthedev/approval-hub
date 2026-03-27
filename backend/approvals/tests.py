import pytest
from users.models import User
from companies.models import Company
from approvals.models import Request
from companies.models import Membership
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_request_state_machine():
    user = User.objects.create_user(email="test@test.com", password="pass")
    company = Company.objects.create(name="Test Co", created_by=user)

    req = Request.objects.create(
        company=company,
        created_by=user,
        title="Test",
        description="Test",
    )

    # first status
    assert req.status == Request.Status.DRAFT

    # valid transitions
    req.transition_to(Request.Status.SUBMITTED)
    assert req.status == Request.Status.SUBMITTED

    req.transition_to(Request.Status.IN_REVIEW)
    assert req.status == Request.Status.IN_REVIEW

    req.transition_to(Request.Status.APPROVED)
    assert req.status == Request.Status.APPROVED

    # invalid transition - doesnt go back from approved
    with pytest.raises(ValueError):
        req.transition_to(Request.Status.DRAFT)

@pytest.mark.django_db
def test_requests_endpoint_requires_auth():
    client = APIClient()
    user = User.objects.create_user(email="test2@test.com", password="pass")
    company = Company.objects.create(name="Test Co 2", created_by=user)

    # no token so 401
    res = client.get(f"/api/companies/{company.slug}/requests/")
    assert res.status_code == 401


@pytest.mark.django_db
def test_requests_endpoint_requires_membership():
    client = APIClient()
    user = User.objects.create_user(email="test3@test.com", password="pass")
    company = Company.objects.create(name="Test Co 3", created_by=user)

    # you are logged in but without membership so u get 403
    client.force_authenticate(user=user)
    res = client.get(f"/api/companies/{company.slug}/requests/")
    assert res.status_code == 403


@pytest.mark.django_db
def test_requests_endpoint_with_membership():
    client = APIClient()
    user = User.objects.create_user(email="test4@test.com", password="pass")
    company = Company.objects.create(name="Test Co 4", created_by=user)
    Membership.objects.create(user=user, company=company, role="member")

    # if u have membership then return 200
    client.force_authenticate(user=user)
    res = client.get(f"/api/companies/{company.slug}/requests/")
    assert res.status_code == 200

@pytest.mark.django_db
def test_approve_flow():
    client = APIClient()
    member = User.objects.create_user(email="member@test.com", password="pass")
    approver = User.objects.create_user(email="approver@test.com", password="pass")
    company = Company.objects.create(name="Test Co 5", created_by=approver)
    Membership.objects.create(user=member, company=company, role="member")
    Membership.objects.create(user=approver, company=company, role="approver")

    # member creates request
    req = Request.objects.create(
        company=company,
        created_by=member,
        title="Fix freezer",
        description="Broken",
        status=Request.Status.IN_REVIEW,
    )

    # approver approves
    client.force_authenticate(user=approver)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/approve/", {
        "decision": "approved",
        "comment": "Looks good"
    })
    assert res.status_code == 201
    req.refresh_from_db()
    assert req.status == Request.Status.APPROVED
