# Subscription Management System - Brightloop Software Platform

A unified full-lifecycle software platform for subscription businesses, managing everything from product & plan setup, quotation templates, recurring billing, automated invoicing, tax calculation, and payment tracking to revenue reporting.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database & ORM:** PostgreSQL + SQLAlchemy 2.0
- **Validation & Serialization:** Pydantic v2
- **Authentication:** JWT (JSON Web Tokens) with `python-jose` & `passlib[bcrypt]`
- **Migrations:** Alembic
- **ASGI Server:** Uvicorn

### Frontend
- **Framework:** React 18+ with TypeScript
- **Bundler & Dev Server:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS

---

## 📁 Project Structure

```
odooxflux/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/             # API v1 routes (auth, users, products)
│   │   │   └── api.py          # Central API router aggregator
│   │   ├── core/
│   │   │   ├── config.py       # Application settings & environment vars
│   │   │   └── security.py     # Password hashing, JWT utils, role guards
│   │   ├── db/
│   │   │   └── database.py     # SQLAlchemy engine & session management
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── base.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── plan.py
│   │   │   ├── subscription.py
│   │   │   ├── invoice.py
│   │   │   └── payment.py
│   │   ├── schemas/            # Pydantic schemas (validation & serialization)
│   │   │   └── user.py
│   │   ├── services/           # Business logic & external integrations
│   │   └── main.py             # FastAPI app initialization & CORS setup
│   ├── tests/                  # Backend test suite
│   ├── .env.example            # Sample backend configuration
│   └── requirements.txt        # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components & layouts
│   │   ├── pages/              # Route view pages (Dashboard, Customers, etc.)
│   │   ├── services/           # Axios API services
│   │   ├── types/              # TypeScript definitions & interfaces
│   │   └── App.tsx             # Main React entry point & routing configuration
│   └── package.json            # Frontend dependencies & scripts
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

## 🚀 How to Run the Project

### Prerequisites
Make sure you have the following installed on your machine:
- **Python 3.11+** (`python3 --version`)
- **Node.js 18+ & npm** (`node -v` and `npm -v`)
- **PostgreSQL** (`psql --version`)

---

### Step 1: Database Setup

1. Start your PostgreSQL service:
   ```bash
   # macOS (Homebrew)
   brew services start postgresql
   
   # Linux (systemd)
   sudo systemctl start postgresql
   ```

2. Create a new database for the project:
   ```bash
   createdb subscription_db
   ```
   *(Or create it via `psql`: `CREATE DATABASE subscription_db;`)*

---

### Step 2: Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL credentials and a secure secret key:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/subscription_db
   SECRET_KEY=your-secret-key-change-in-production-make-it-long-and-random
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

5. Start the backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

6. The backend server is now running:
   - **Base API URL:** `http://localhost:8000`
   - **Health Check:** `http://localhost:8000/health`
   - **Interactive API Docs (Swagger UI):** `http://localhost:8000/docs`
   - **Alternative Docs (ReDoc):** `http://localhost:8000/redoc`

---

### Step 3: Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - `http://localhost:5173` (or the port specified by Vite)

5. To create an optimized production build:
   ```bash
   npm run build
   ```

---

## 📡 API Endpoints Overview

All v1 API routes are prefixed under `/api/v1`:

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user | Public |
| `POST` | `/api/v1/auth/login` | Login with username/email & password, returns JWT tokens | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh an access token using a refresh token | Public |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token | Public |
| `POST` | `/api/v1/auth/reset-password` | Reset password using token | Public |
| `GET` | `/api/v1/auth/me` | Fetch currently logged-in user profile | Authenticated |

### 👥 User Management (`/api/v1/users`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/users/` | List all users (with search, pagination & role filter) | Admin |
| `GET` | `/api/v1/users/{user_id}` | Retrieve details for a specific user | Self / Admin |
| `PUT` | `/api/v1/users/{user_id}` | Update user profile information | Self / Admin |
| `DELETE` | `/api/v1/users/{user_id}` | Soft delete / deactivate user | Admin |

### 📦 Products & Variants (`/api/v1/products`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/products/` | List all products with search & pagination | Authenticated |
| `POST` | `/api/v1/products/` | Create a new product | Admin / Staff |
| `GET` | `/api/v1/products/{product_id}` | Get product details by ID | Authenticated |
| `PUT` | `/api/v1/products/{product_id}` | Update product information | Admin / Staff |
| `DELETE` | `/api/v1/products/{product_id}` | Delete product | Admin |
| `POST` | `/api/v1/products/{product_id}/variants` | Add variant to a product | Admin / Staff |

---

## 🧩 Core Platform Features

1. **User & Role Management**
   - Secure authentication with bcrypt password hashing and JWT tokens.
   - Role-Based Access Control (RBAC): `Admin`, `Staff`, `Customer`.
   - Token refresh mechanism and password reset workflows.

2. **Product Catalog & Pricing Plans**
   - Products supporting multiple variants with price adjustments.
   - Plans with flexible billing frequencies (Daily, Weekly, Monthly, Yearly).
   - Lifecycle management (Draft, Active, Deprecated).

3. **Subscription Lifecycle**
   - Full state transitions: `Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed`.
   - Automated recurrence tracking and expiration calculations.

4. **Invoicing & Payments**
   - Automated invoice generation linked to subscription cycles.
   - Support for line items, tax rules, and promotional discounts.
   - Multi-method payment processing and receipt tracking.

5. **Reporting & Analytics Dashboard**
   - Active subscription metrics and MRR / ARR analytics.
   - Overdue invoice alerts and revenue performance over time.
