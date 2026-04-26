import pytest
from approvals.models import Request
from companies.models import Company, Membership
from users.models import User


@pytest.mark.django_db
def test_request_state_machine():
    # create user + company
    user = User.objects.create_user(email="test@test.com", password="pass")
    company = Company.objects.create(name="Test Co", created_by=user)

    # create request
    req = Request.objects.create(
        company=company,
        created_by=user,
        title="Test",
        description="Test",
    )
    # check status
    assert req.status == Request.Status.DRAFT

    # check valid transition
    req.transition_to(Request.Status.SUBMITTED)
    assert req.status == Request.Status.SUBMITTED

    # check invalid transition
    with pytest.raises(ValueError):
        req.transition_to(Request.Status.APPROVED)
