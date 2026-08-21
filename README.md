# Task2Cash – Earn Points & Redeem Rewards

> **"Complete. Earn. Redeem."**  
> A production-grade gamified task, quiz, rewards, and points web platform built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS**, **Python FastAPI**, and **MongoDB**.

---

## 🌟 Executive Overview

**Task2Cash** is a fintech-inspired gamification platform where users complete educational quizzes, coding challenges, and daily activities to earn points, maintain streaks, climb competitive leaderboards, unlock achievements, and redeem rewards such as Mobile Recharge, UPI transfers, and Bank Payouts.

> [!IMPORTANT]
> **Sandbox / Demo Reward Architecture**: All monetary redemptions and mobile recharges operate in **DEMO/SANDBOX mode**. No real money is transferred. The platform utilizes an extensible `PaymentProvider` abstraction layer designed for seamless integration with real payment gateways (e.g., RazorpayX, Cashfree, PayTM) in production.

---

## 🚀 Key Features

### 👤 User Experience
- **Interactive Landing Page**: Modern dark/light mode landing page with animated metrics, step-by-step onboarding, and testimonial carousel.
- **Dynamic User Dashboard**: Real-time points counter, level badge, XP progress bar, 7-day streak calendar, and daily activities summary.
- **Quiz Engine**: Timed quizzes with multiple-choice and true/false questions, client-side answer obfuscation, and backend scoring verification.
- **Task Hub**: Categorized tasks (Coding, Tech, Surveys, Daily Challenges) with difficulty filters, instant validation, and text proof submissions.
- **Point Wallet & Immutable Ledger**: Full transaction history (`EARN`, `BONUS`, `REDEEM`, `REFUND`, `ADJUSTMENT`) with negative balance prevention.
- **Rewards Marketplace**: Redeem points for Mobile Recharge, UPI transfers, Bank Transfers, and Gift Cards in demo mode.
- **Daily Streak System**: 7-day escalating reward calendar with automatic reset and claim safeguards.
- **Referral Network**: Unique referral codes (`T2C-XXXXXX`), referral dashboard with attribution metrics and signup bonuses.
- **Tiered Level Progression**: Bronze, Silver, Gold, Platinum, and Diamond tiers with dynamic XP thresholds.
- **Achievement Showcase**: Unlocked and locked achievement badges with progress percentages and instant point rewards.
- **Real-Time Notification Hub**: In-app notifications with unread counts and WebSocket-ready dispatching.

### 🛡️ Admin & Control Center
- **Executive Analytics**: Recharts visualizations for user acquisition, points flow, redemption categories, and activity logs.
- **User Management**: User search, status toggles (Active/Suspended), password resets, and transaction audit trails.
- **Task & Quiz CRUD**: Full administrative creation and editing suites with dynamic question builders.
- **Reward & Point Pricing**: Real-time configurable conversion rates (e.g., 100 points = ₹1) and daily limits.
- **Withdrawal Review & Simulation**: Status workflow (`PENDING` ➔ `PROCESSING` ➔ `COMPLETED` / `REJECTED`) with masked sensitive account numbers.
- **Heuristic Fraud Detection**: Automated flags for impossible quiz speeds, rapid point spikes, and abnormal referral velocities.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v7, Axios, React Hook Form, Zod |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, Motor (Async MongoDB), PyMongo, Passlib/Bcrypt, PyJWT, WebSockets |
| **Database** | MongoDB (`task2cash` database with 17 indexed collections) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, Oxlint, TypeScript Compiler (`tsc -b`) |

---

## 📂 Project Architecture

```
cash/
├── README.md                      # Project documentation
├── backend/                       # FastAPI asynchronous backend
│   ├── .env.example               # Backend environment template
│   ├── requirements.txt           # Python dependencies
│   ├── pytest.ini                 # Pytest configuration
│   ├── seed.py                    # Comprehensive database seeder
│   ├── app/
│   │   ├── main.py                # Application entrypoint & middleware
│   │   ├── core/                  # Security, JWT, hashing, config
│   │   ├── database/              # MongoDB connection & index managers
│   │   ├── models/                # Database collection schemas
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── services/              # Domain business logic & heuristics
│   │   ├── routers/               # REST API endpoints & WebSockets
│   │   └── providers/             # Pluggable PaymentProvider abstraction
│   └── tests/                     # Automated test suite
└── frontend/                      # React TypeScript frontend
    ├── package.json               # Frontend dependencies
    ├── vite.config.ts             # Vite build configuration
    ├── tsconfig.json              # TypeScript root config
    └── src/
        ├── App.tsx                # Routing and global layout
        ├── main.tsx               # DOM mount point
        ├── index.css              # Design tokens & Tailwind setup
        ├── types/                 # TypeScript type interfaces
        ├── services/              # Axios API client
        ├── contexts/              # Auth, Theme, Notification contexts
        ├── components/            # Reusable UI widgets & modals
        └── pages/                 # User & Admin application pages
```

---

## ⚙️ Quick Start & Installation

### 1. Prerequisites
- **Node.js** (v18+ recommended) & **npm**
- **Python** (v3.10+ recommended)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

---

### 2. Backend Setup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Key settings in `.env`:
     ```ini
     MONGO_URL=mongodb://localhost:27017
     DB_NAME=task2cash
     JWT_SECRET=super_secret_jwt_key_change_in_production_2026
     JWT_ACCESS_EXPIRE_MINUTES=60
     JWT_REFRESH_EXPIRE_DAYS=7
     DEMO_MODE=true
     ADMIN_EMAIL=admin@task2cash.com
     ADMIN_PASSWORD=Admin@123456
     ```

5. Seed the database with demo users, tasks, quizzes, rewards, and leaderboards:
   ```bash
   python seed.py
   ```

6. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Root: `http://localhost:8000`
   - Swagger Interactive Docs: `http://localhost:8000/docs`
   - ReDoc Documentation: `http://localhost:8000/redoc`

---

### 3. Frontend Setup

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Frontend Application: `http://localhost:5173`

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@task2cash.com` | `Admin@123456` |
| **Demo User** | `raghav@example.com` | `Password@123` |
| **Demo User** | `priya@example.com` | `Password@123` |
| **Demo User** | `sneha@example.com` | `Password@123` |

*(You can also register a brand new user account directly from the `/register` page.)*

---

## 🧪 Testing

### Backend Automated Test Suite
Run the 9 end-to-end integration tests covering all 14 core subsystems:
```bash
cd backend
.venv\Scripts\python -m pytest
```

### Frontend Build & Lint Verification
Verify zero TypeScript compilation errors and production bundling:
```bash
cd frontend
npm run build
npm run lint
```

---

## 💳 Payment Provider Integration Guide

The application follows the **Dependency Inversion Principle** via `app/providers/base.py`:

```python
class PaymentProvider(ABC):
    @abstractmethod
    async def create_mobile_recharge(self, request: RechargeRequest) -> ProviderTransactionResult: ...
    @abstractmethod
    async def create_upi_payout(self, request: UPIPayoutRequest) -> ProviderTransactionResult: ...
    @abstractmethod
    async def create_bank_payout(self, request: BankPayoutRequest) -> ProviderTransactionResult: ...
```

To switch to a live gateway (e.g. RazorpayX, Cashfree, or PayTM Payouts):
1. Implement `RealPaymentProvider` in `app/providers/real_provider_placeholder.py`.
2. Configure provider API keys in `.env`.
3. Toggle `DEMO_MODE=false` in `.env` and `app/core/config.py`.

---

## ⚖️ Responsible Rewards & Legal Compliance

Task2Cash is designed for positive gamification and educational engagement.
- Points represent internal platform loyalty points.
- Default conversion rate is **100 points = ₹1 Demo Value**.
- Clear disclaimers appear on all redemption and payout confirmations.
- Terms of Service and Responsible Rewards policies are accessible from the application footer.

---

## 📄 License
MIT License. Developed for Task2Cash Web Platform.
