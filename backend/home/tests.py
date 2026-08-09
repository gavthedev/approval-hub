import pytest
from approvals.models import Request, TicketType
from companies.models import Company, Membership
from rest_framework.test import APIClient
from users.models import User

from .models import HomeItem


@pytest.mark.django_db
def test_create_shortcut():
    client = APIClient()
    user = User.objects.create_user(email="shortcutuser@test.com", password="pass")
    company = Company.objects.create(name="Shortcut Co", created_by=user)
    Membership.objects.create(user=user, company=company, role="member")

    client.force_authenticate(user=user)
    res = client.post("/api/home-items/", {
        "item_type": "shortcut", "label": "Report Broken Equipment",
        "url": f"/company/{company.slug}", "company": company.id,
    })
    assert res.status_code == 201
    assert res.data["label"] == "Report Broken Equipment"
    assert res.data["company_slug"] == company.slug


@pytest.mark.django_db
def test_create_shortcut_foreign_company_rejected():
    client = APIClient()
    user = User.objects.create_user(email="shortcutuser2@test.com", password="pass")
    other = User.objects.create_user(email="shortcutowner2@test.com", password="pass")
    foreign_company = Company.objects.create(name="Foreign Co", created_by=other)

    client.force_authenticate(user=user)
    res = client.post("/api/home-items/", {
        "item_type": "shortcut", "label": "x", "url": "/x", "company": foreign_company.id,
    })
    assert res.status_code == 400


@pytest.mark.django_db
def test_create_pinned_request():
    client = APIClient()
    user = User.objects.create_user(email="pinuser@test.com", password="pass")
    company = Company.objects.create(name="Pin Co", created_by=user)
    Membership.objects.create(user=user, company=company, role="member")
    tt = TicketType.objects.create(company=company, name="Broken Thing", created_by=user)
    req = Request.objects.create(company=company, ticket_type=tt, created_by=user,
                                  status=Request.Status.SUBMITTED, title="Fix the oven")

    client.force_authenticate(user=user)
    res = client.post("/api/home-items/", {"item_type": "pinned_request", "request": req.id})
    assert res.status_code == 201
    assert res.data["request_detail"]["title"] == "Fix the oven"
    assert res.data["request_detail"]["company_slug"] == company.slug


@pytest.mark.django_db
def test_create_pinned_request_foreign_company_rejected():
    client = APIClient()
    user = User.objects.create_user(email="pinuser2@test.com", password="pass")
    other = User.objects.create_user(email="pinowner2@test.com", password="pass")
    foreign_company = Company.objects.create(name="Foreign Pin Co", created_by=other)
    Membership.objects.create(user=other, company=foreign_company, role="member")
    foreign_req = Request.objects.create(company=foreign_company, created_by=other,
                                          status=Request.Status.SUBMITTED, title="Not yours")

    client.force_authenticate(user=user)
    res = client.post("/api/home-items/", {"item_type": "pinned_request", "request": foreign_req.id})
    assert res.status_code == 400


@pytest.mark.django_db
def test_create_pinned_request_other_member_same_company_rejected():
    client = APIClient()
    owner = User.objects.create_user(email="pinowner3@test.com", password="pass")
    other_member = User.objects.create_user(email="pinother3@test.com", password="pass")
    approver = User.objects.create_user(email="pinapprover3@test.com", password="pass")
    company = Company.objects.create(name="Shared Pin Co", created_by=owner)
    Membership.objects.create(user=owner, company=company, role="member")
    Membership.objects.create(user=other_member, company=company, role="member")
    Membership.objects.create(user=approver, company=company, role="approver")
    req = Request.objects.create(company=company, created_by=owner,
                                 status=Request.Status.SUBMITTED, title="Owner's request")

    # a fellow member (not the owner) cannot pin it - not 403, mirrors the
    # request-detail boundary of not confirming a peer's request exists
    client.force_authenticate(user=other_member)
    res = client.post("/api/home-items/", {"item_type": "pinned_request", "request": req.id})
    assert res.status_code == 400
    assert not HomeItem.objects.filter(user=other_member).exists()

    # an approver can pin any member's request in the company
    client.force_authenticate(user=approver)
    res = client.post("/api/home-items/", {"item_type": "pinned_request", "request": req.id})
    assert res.status_code == 201


@pytest.mark.django_db
def test_pinned_request_hidden_when_pinning_users_role_is_downgraded():
    client = APIClient()
    owner = User.objects.create_user(email="pindowngradeowner@test.com", password="pass")
    approver = User.objects.create_user(email="pindowngradeapprover@test.com", password="pass")
    company = Company.objects.create(name="Downgrade Pin Co", created_by=owner)
    Membership.objects.create(user=owner, company=company, role="member")
    approver_membership = Membership.objects.create(user=approver, company=company, role="approver")
    req = Request.objects.create(company=company, created_by=owner,
                                 status=Request.Status.SUBMITTED, title="Owner's request")

    client.force_authenticate(user=approver)
    pinned_id = client.post("/api/home-items/", {"item_type": "pinned_request", "request": req.id}).data["id"]

    res = client.get("/api/home-items/")
    assert {item["id"] for item in res.data} == {pinned_id}

    # demote approver -> member: the pin they made of someone else's request
    # must stop being returned even though the HomeItem row still exists
    approver_membership.role = "member"
    approver_membership.save()

    res = client.get("/api/home-items/")
    assert res.data == []
    assert HomeItem.objects.filter(id=pinned_id).exists()


@pytest.mark.django_db
def test_create_stat_counts_correctly():
    client = APIClient()
    user = User.objects.create_user(email="statuser@test.com", password="pass")
    company = Company.objects.create(name="Stat Co", created_by=user)
    Membership.objects.create(user=user, company=company, role="member")
    Request.objects.create(company=company, created_by=user, status=Request.Status.SUBMITTED, title="A")
    Request.objects.create(company=company, created_by=user, status=Request.Status.DRAFT, title="B")

    client.force_authenticate(user=user)
    res = client.post("/api/home-items/", {
        "item_type": "stat", "stat_kind": "my_open_requests", "company": company.id,
    })
    assert res.status_code == 201
    assert res.data["value"] == 1


@pytest.mark.django_db
def test_list_only_returns_own_items():
    client = APIClient()
    user_a = User.objects.create_user(email="usera@test.com", password="pass")
    user_b = User.objects.create_user(email="userb@test.com", password="pass")
    company = Company.objects.create(name="Shared Co", created_by=user_a)
    Membership.objects.create(user=user_a, company=company, role="member")
    Membership.objects.create(user=user_b, company=company, role="member")

    HomeItem.objects.create(user=user_a, item_type="shortcut", label="A's shortcut", url="/x", company=company)

    client.force_authenticate(user=user_b)
    res = client.get("/api/home-items/")
    assert res.status_code == 200
    assert res.data == []


@pytest.mark.django_db
def test_delete_own_item():
    client = APIClient()
    user = User.objects.create_user(email="deleteuser@test.com", password="pass")
    company = Company.objects.create(name="Delete Co", created_by=user)
    Membership.objects.create(user=user, company=company, role="member")
    item = HomeItem.objects.create(user=user, item_type="shortcut", label="x", url="/x", company=company)

    client.force_authenticate(user=user)
    res = client.delete(f"/api/home-items/{item.id}/")
    assert res.status_code == 204
    assert not HomeItem.objects.filter(id=item.id).exists()


@pytest.mark.django_db
def test_delete_others_item_404():
    client = APIClient()
    owner = User.objects.create_user(email="owner3@test.com", password="pass")
    other = User.objects.create_user(email="other3@test.com", password="pass")
    company = Company.objects.create(name="NotYours Co", created_by=owner)
    Membership.objects.create(user=owner, company=company, role="member")
    item = HomeItem.objects.create(user=owner, item_type="shortcut", label="x", url="/x", company=company)

    client.force_authenticate(user=other)
    res = client.delete(f"/api/home-items/{item.id}/")
    assert res.status_code == 404
    assert HomeItem.objects.filter(id=item.id).exists()


@pytest.mark.django_db
def test_membership_revoked_hides_company_scoped_items():
    client = APIClient()
    user = User.objects.create_user(email="revokeuser@test.com", password="pass")
    company = Company.objects.create(name="Revoke Co", created_by=user)
    membership = Membership.objects.create(user=user, company=company, role="member")
    tt = TicketType.objects.create(company=company, name="Thing", created_by=user)
    req = Request.objects.create(company=company, ticket_type=tt, created_by=user,
                                  status=Request.Status.SUBMITTED, title="Fix it")

    client.force_authenticate(user=user)
    pinned_id = client.post("/api/home-items/", {"item_type": "pinned_request", "request": req.id}).data["id"]
    stat_id = client.post("/api/home-items/", {
        "item_type": "stat", "stat_kind": "my_open_requests", "company": company.id,
    }).data["id"]
    all_companies_id = client.post("/api/home-items/", {
        "item_type": "stat", "stat_kind": "my_open_requests",
    }).data["id"]

    res = client.get("/api/home-items/")
    assert {item["id"] for item in res.data} == {pinned_id, stat_id, all_companies_id}

    # revoke membership (offboarding)
    membership.is_active = False
    membership.save()

    res = client.get("/api/home-items/")
    assert {item["id"] for item in res.data} == {all_companies_id}
    remaining_stat = next(item for item in res.data if item["id"] == all_companies_id)
    assert remaining_stat["value"] == 0

    # restore membership -> everything reappears
    membership.is_active = True
    membership.save()
    res = client.get("/api/home-items/")
    assert {item["id"] for item in res.data} == {pinned_id, stat_id, all_companies_id}


@pytest.mark.django_db
def test_pending_my_approval_stat_requires_approver_role():
    client = APIClient()
    member = User.objects.create_user(email="planmember@test.com", password="pass")
    company = Company.objects.create(name="Plan Co", created_by=member)
    Membership.objects.create(user=member, company=company, role="member")

    client.force_authenticate(user=member)
    res = client.post("/api/home-items/", {
        "item_type": "stat", "stat_kind": "pending_my_approval", "company": company.id,
    })
    assert res.status_code == 400


@pytest.mark.django_db
def test_pending_my_approval_stat_counts_and_revokes_live():
    client = APIClient()
    approver = User.objects.create_user(email="planapprover@test.com", password="pass")
    other_member = User.objects.create_user(email="planother@test.com", password="pass")
    company = Company.objects.create(name="Plan Approver Co", created_by=approver)
    membership = Membership.objects.create(user=approver, company=company, role="approver")
    Membership.objects.create(user=other_member, company=company, role="member")
    Request.objects.create(company=company, created_by=other_member,
                            status=Request.Status.IN_REVIEW, title="Needs approval")
    Request.objects.create(company=company, created_by=other_member,
                            status=Request.Status.SUBMITTED, title="Not yet in review")

    client.force_authenticate(user=approver)
    res = client.post("/api/home-items/", {
        "item_type": "stat", "stat_kind": "pending_my_approval", "company": company.id,
    })
    assert res.status_code == 201
    assert res.data["value"] == 1

    # demote to member -> the live count must drop to 0, not keep showing 1
    membership.role = "member"
    membership.save()
    res = client.get("/api/home-items/")
    assert res.data[0]["value"] == 0


@pytest.mark.django_db
def test_pending_my_approval_stat_all_companies_only_counts_where_approver():
    client = APIClient()
    user = User.objects.create_user(email="planmulti@test.com", password="pass")
    company_approver_in = Company.objects.create(name="Approver Co", created_by=user)
    company_member_in = Company.objects.create(name="Member Only Co", created_by=user)
    Membership.objects.create(user=user, company=company_approver_in, role="approver")
    Membership.objects.create(user=user, company=company_member_in, role="member")
    Request.objects.create(company=company_approver_in, created_by=user,
                            status=Request.Status.IN_REVIEW, title="In approver co")
    Request.objects.create(company=company_member_in, created_by=user,
                            status=Request.Status.IN_REVIEW, title="In member-only co")

    client.force_authenticate(user=user)
    res = client.post("/api/home-items/", {"item_type": "stat", "stat_kind": "pending_my_approval"})
    assert res.status_code == 201
    # only the request in the company where the user is an approver should count
    assert res.data["value"] == 1
