# Subscription Management System - Hackathon Project

## Brightloop Software Subscription Platform

A unified software platform that runs the full life of a subscription business, from product setup to revenue reporting.

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- JWT Authentication
- Pydantic (Data Validation)

**Frontend:**
- React 18+
- TypeScript
- Tailwind CSS
- React Router

## Project Structure

```
odooxflux/
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core config, security
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── db/            # Database configuration
│   ├── tests/             # Backend tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## Features

1. **User Management**
   - Email/password authentication
   - Role-based access control (Admin, Staff, Customer)
   - Password reset functionality

2. **Product & Plan Management**
   - Product creation with variants
   - Plan configuration (billing frequency, quantities)
   - Plan lifecycle management

3. **Subscription Management**
   - Subscription lifecycle (Draft → Quotation → Confirmed → Active → Closed)
   - Quotation templates
   - Automated billing

4. **Invoicing & Payments**
   - Automated invoice generation
   - Tax calculation
   - Discount application
   - Payment tracking

5. **Reporting**
   - Active subscription metrics
   - Revenue reports
   - Overdue invoice tracking
   - Performance optimized dashboards

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Documentation

FastAPI auto-generates OpenAPI documentation at:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## Database Schema

Key entities:
- Users
- Products
- Plans
- Subscriptions
- Quotations
- Invoices
- Payments
- Discounts
- Tax Rules
