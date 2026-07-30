import pytest
from approvals.models import Request, TicketType, TicketTypeField
from companies.models import Company
from companies.models import Membership
from rest_framework.test import APIClient
from users.models import User


@pytest.mark.django_db
def test_request_state_machine():
    user = User.objects.create_user(email="test@test.com", password="pass")
    company = Company.objects.create(name="Test Co", created_by=user)

    req = Request.objects.create(
        company=company,
        created_by=user,
        title="Test",
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


@pytest.mark.django_db
def test_ticket_type_list_create():
    client = APIClient()
    admin = User.objects.create_user(email="ticketadmin@test.com", password="pass")
    member = User.objects.create_user(email="ticketmember@test.com", password="pass")
    outsider = User.objects.create_user(email="outsider1@test.com", password="pass")
    company = Company.objects.create(name="Ticket Co", created_by=admin)
    Membership.objects.create(user=admin, company=company, role="admin")
    Membership.objects.create(user=member, company=company, role="member")

    # non-member -> 403
    client.force_authenticate(user=outsider)
    res = client.get(f"/api/companies/{company.slug}/ticket-types/")
    assert res.status_code == 403

    # member can list (empty so far)
    client.force_authenticate(user=member)
    res = client.get(f"/api/companies/{company.slug}/ticket-types/")
    assert res.status_code == 200
    assert res.data == []

    # member cannot create
    res = client.post(f"/api/companies/{company.slug}/ticket-types/", {"name": "Broken Equipment"})
    assert res.status_code == 403

    # admin can create
    client.force_authenticate(user=admin)
    res = client.post(f"/api/companies/{company.slug}/ticket-types/", {"name": "Broken Equipment"})
    assert res.status_code == 201
    assert res.data["name"] == "Broken Equipment"

    # member now sees it in the list
    client.force_authenticate(user=member)
    res = client.get(f"/api/companies/{company.slug}/ticket-types/")
    assert len(res.data) == 1


@pytest.mark.django_db
def test_ticket_type_list_create_cross_company_scoping():
    client = APIClient()
    admin = User.objects.create_user(email="crossadmin@test.com", password="pass")
    company_a = Company.objects.create(name="Company A", created_by=admin)
    company_b = Company.objects.create(name="Company B", created_by=admin)
    Membership.objects.create(user=admin, company=company_a, role="admin")
    # admin has no membership in company_b

    client.force_authenticate(user=admin)
    res = client.get(f"/api/companies/{company_b.slug}/ticket-types/")
    assert res.status_code == 403


@pytest.mark.django_db
def test_ticket_type_detail_update_and_delete():
    client = APIClient()
    admin = User.objects.create_user(email="tdadmin@test.com", password="pass")
    member = User.objects.create_user(email="tdmember@test.com", password="pass")
    company = Company.objects.create(name="TD Co", created_by=admin)
    Membership.objects.create(user=admin, company=company, role="admin")
    Membership.objects.create(user=member, company=company, role="member")
    tt = TicketType.objects.create(company=company, name="Original", created_by=admin)

    # member cannot update
    client.force_authenticate(user=member)
    res = client.put(f"/api/companies/{company.slug}/ticket-types/{tt.id}/", {"name": "Hacked"}, format="json")
    assert res.status_code == 403

    # admin can update
    client.force_authenticate(user=admin)
    res = client.put(f"/api/companies/{company.slug}/ticket-types/{tt.id}/", {"name": "Renamed"}, format="json")
    assert res.status_code == 200
    tt.refresh_from_db()
    assert tt.name == "Renamed"

    # nonexistent id -> 404
    res = client.put(f"/api/companies/{company.slug}/ticket-types/999999/", {"name": "X"}, format="json")
    assert res.status_code == 404

    # admin can delete (soft delete)
    res = client.delete(f"/api/companies/{company.slug}/ticket-types/{tt.id}/")
    assert res.status_code == 204
    tt.refresh_from_db()
    assert tt.is_deleted is True

    # soft-deleted ticket type no longer shows up in the list
    res = client.get(f"/api/companies/{company.slug}/ticket-types/")
    assert res.data == []


@pytest.mark.django_db
def test_ticket_type_field_create_update_delete():
    client = APIClient()
    admin = User.objects.create_user(email="fieldadmin@test.com", password="pass")
    member = User.objects.create_user(email="fieldmember@test.com", password="pass")
    company = Company.objects.create(name="Field Co", created_by=admin)
    Membership.objects.create(user=admin, company=company, role="admin")
    Membership.objects.create(user=member, company=company, role="member")
    tt = TicketType.objects.create(company=company, name="Equipment Report", created_by=admin)

    # member cannot add fields
    client.force_authenticate(user=member)
    res = client.post(f"/api/companies/{company.slug}/ticket-types/{tt.id}/fields/",
                       {"name": "Location", "field_type": "text"})
    assert res.status_code == 403

    # admin can add fields
    client.force_authenticate(user=admin)
    res = client.post(f"/api/companies/{company.slug}/ticket-types/{tt.id}/fields/",
                       {"name": "Location", "field_type": "text"})
    assert res.status_code == 201
    field_id = res.data["id"]

    # member cannot update or delete fields
    client.force_authenticate(user=member)
    res = client.put(f"/api/companies/{company.slug}/ticket-types/{tt.id}/fields/{field_id}/",
                      {"name": "Renamed"}, format="json")
    assert res.status_code == 403

    # admin can update
    client.force_authenticate(user=admin)
    res = client.put(f"/api/companies/{company.slug}/ticket-types/{tt.id}/fields/{field_id}/",
                      {"name": "Room"}, format="json")
    assert res.status_code == 200
    assert TicketTypeField.objects.get(id=field_id).name == "Room"

    # admin can delete (hard delete)
    res = client.delete(f"/api/companies/{company.slug}/ticket-types/{tt.id}/fields/{field_id}/")
    assert res.status_code == 204
    assert not TicketTypeField.objects.filter(id=field_id).exists()


@pytest.mark.django_db
def test_add_comment():
    client = APIClient()
    member = User.objects.create_user(email="commentmember@test.com", password="pass")
    outsider = User.objects.create_user(email="commentoutsider@test.com", password="pass")
    company = Company.objects.create(name="Comment Co", created_by=member)
    Membership.objects.create(user=member, company=company, role="member")
    req = Request.objects.create(company=company, created_by=member, title="Test",
                                  status=Request.Status.SUBMITTED)

    # non-member cannot comment
    client.force_authenticate(user=outsider)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/comments/", {"text": "Hi"})
    assert res.status_code == 403

    # member can comment
    client.force_authenticate(user=member)
    res = client.post(f"/api/companies/{company.slug}/requests/{req.id}/comments/", {"text": "Looks good"})
    assert res.status_code == 201
    assert req.comments.count() == 1


@pytest.mark.django_db
def test_request_detail_view():
    client = APIClient()
    member = User.objects.create_user(email="detailmember@test.com", password="pass")
    outsider = User.objects.create_user(email="detailoutsider@test.com", password="pass")
    company = Company.objects.create(name="Detail Co", created_by=member)
    other_company = Company.objects.create(name="Other Detail Co", created_by=outsider)
    Membership.objects.create(user=member, company=company, role="member")
    Membership.objects.create(user=outsider, company=other_company, role="admin")
    req = Request.objects.create(company=company, created_by=member, title="Detail Test",
                                  status=Request.Status.SUBMITTED)

    # member of a different company cannot view
    client.force_authenticate(user=outsider)
    res = client.get(f"/api/companies/{company.slug}/requests/{req.id}/")
    assert res.status_code == 403

    # own company's slug with someone else's request id -> 404, not a cross-company leak
    res = client.get(f"/api/companies/{other_company.slug}/requests/{req.id}/")
    assert res.status_code == 404

    # member can view
    client.force_authenticate(user=member)
    res = client.get(f"/api/companies/{company.slug}/requests/{req.id}/")
    assert res.status_code == 200
    assert res.data["title"] == "Detail Test"
