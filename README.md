# Approval Hub

An internal workflow tool that replaces WhatsApp messages and verbal approvals with a structured, auditable request system. Employees submit requests, managers approve or reject them. With a full audit trail of every action.

**Live demo:** https://approvalhub.ch

---

## Tech Stack

**Backend:** Python, Django, Django REST Framework, PostgreSQL, JWT  
**Frontend:** TypeScript, React, Vite, Tailwind CSS, Axios  
**Infrastructure:** Docker, Nginx, Let's Encrypt SSL, Infomaniak VPS

---

## Features

- Submit equipment, expense, and other internal requests
- Approval workflow: submitted to in review to approved or rejected
- Full audit trail - every action is recorded with timestamp and actor
- JWT authentication with automatic token refresh
- Role-based access: member, approver, admin
- Multi-tenant: one instance supports multiple companies

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

## Testing

```bash
cd backend
pytest
```

## Deployment

Deployed via Docker Compose on Infomaniak VPS with Nginx reverse proxy and Let's Encrypt SSL.

```bash
git pull
docker compose up --build -d
```
