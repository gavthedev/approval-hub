import pytest
from users.models import User
from companies.models import Company
from approvals.models import Request


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
