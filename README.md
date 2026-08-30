# ⚡ RecoverAI — Autonomous Revenue Recovery & Payment Intelligence

> **Find revenue that’s slipping away and win it back.**  
> An autonomous, policy-bounded revenue recovery intelligence platform that detects payment degradations, diagnoses root causes, determines optimal interventions, and executes bounded recovery workflows across checkouts, recurring mandates, and B2B receivables.

[![CI / Test Suite](https://img.shields.io/badge/pytest-96%20passed-emerald.svg)](backend/tests/)
[![Frontend Build](https://img.shields.io/badge/vite-passing-blue.svg)](frontend/)
[![TypeScript](https://img.shields.io/badge/typescript-strict%205.0-blue.svg)](frontend/tsconfig.json)
[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11-yellow.svg)](backend/requirements.txt)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)

---

## 🏛️ Executive Summary & The Problem

Over **$440B+** is lost globally every year to false declines, unoptimized retry timing, mandate clearing bounces, and overdue invoices. 
- **Traditional Payment Processors** rely on *dumb retry loops* that blindly spam networks, triggering severe bank penalties and customer friction.
- **Unconstrained AI/LLMs** cannot be trusted with real money movements due to hallucinations, unpredictable outputs, and regulatory compliance risks.

### **The RecoverAI Solution: AI Reasoning + Deterministic Safety Guardrails**
RecoverAI introduces a **hybrid architectural model**:
1. **AI Proposes & Diagnoses**: Deep multi-engine telemetry classification, contextual root cause identification, optimal timing prediction, and localized dunning synthesis.
2. **PolicyEngine Strictly Authorizes**: Deterministic safety rules that **AI can NEVER override** (e.g., hard stop after 3 attempts, high-value human approval gates, cooldown safety windows, customer opt-out guarantees).

```
$$\text{Detect} \longrightarrow \text{Predict} \longrightarrow \text{Optimize} \longrightarrow \text{Experiment} \longrightarrow \text{Learn} \longrightarrow \text{Prevent} \longrightarrow \text{Recover} \longrightarrow \text{Measure}$$
```

---

## 🏗️ Core Architecture & Responsible AI Contract

```
┌────────────────────────────────────────────────────────────────────────────┐
│                             RECOVERAI PLATFORM                             │
├──────────────────────┬──────────────────────────────┬──────────────────────┤
│  1. INTELLIGENCE     │  2. GOVERNANCE & POLICIES    │  3. EXECUTION RAILS  │
├──────────────────────┼──────────────────────────────┼──────────────────────┤
│ • 15-Node Decision   │ • Deterministic Safety Gate  │ • Batch Recovery     │
│   Graph Visualizer   │ • Self-Learning Policy       │ • Adaptive Auth/3DS  │
│ • Predictive Risk    │   Optimizer (Human-in-Loop)  │ • NPCI Mandate Auto  │
│ • Heatmap & Leakage  │ • Human Approval Queue       │ • Hinglish Voice/WA  │
│ • Unit Economics ROI │ • Immutable Cryptographic    │ • B2B Receivables    │
│                      │   Audit Trail & Replay       │   Chaser & PTP       │
└──────────────────────┴──────────────────────────────┴──────────────────────┘
```

### **The Invariant Safety Hierarchy**
```
AI / Diagnostic Engine Proposes
               │
               ▼
Deterministic PolicyEngine (Authoritative Gatekeeper)
               │
               ▼
RecoveryEngine (Execution Authority)
               │
               ▼
Payment Rails & Gateway Simulators (UPI / Card / NACH)
               │
               ▼
AuditService (Immutable Cryptographic Ledger)
```

---

## 🎯 Specialized Hackathon Use Cases & Playbooks

### 1. **Payment Degradation → Root Cause → Recovery Action**
- Real-time detection of gateway degradation spikes (e.g., HDFC 504 timeouts).
- Automatically reroutes transactions around degraded processors to healthy backup acquiring rails with zero customer drop-off.

### 2. **Checkout Drop-Off & Smart 3DS Pre-Recovery**
- Pre-empts cart abandonment during intrusive OTP/3DS challenges.
- Requests frictionless 3DS exemptions for low-risk transactions (+5.8 pp checkout conversion lift) and caches network tokens.

### 3. **Failed Subscription Dunning with Decay Curves**
- Bounded retry sequence with diminishing returns decay curves.
- Delays retries to match customer paydays, pairs retries with soft WhatsApp reminders, and stops before churn thresholds (78.4% retention yield).

### 4. **B2B Receivables Chaser & Promise-to-Pay (PTP) Tracker**
- Categorizes corporate receivables into aging buckets (`0-30d`, `31-60d`, `61-90d`, `90d+`).
- Logs customer payment commitments (PTP), automatically pauses automated dunning during the grace period, and flags broken promises for human escalation.

### 5. **Mandate Retry Sequencer (UPI Autopay & eNACH)**
- Solves month-end debit bounce spikes (up to 64% failure rate on 28th–31st).
- Maps recurring mandate retries directly to the customer’s verified salary credit cycle (1st–5th of month) and NACH Cycle 1 windows.
- Features real-time **"Execute Now"** instant clearing receipts with NPCI reference IDs.

### 6. **Hinglish & Multilingual Conversational Recovery Studio**
- Synthesizes empathetic, culturally localized **Hinglish Voice IVR calls** (*"Namaste Rahul ji, aapka subscription payment..."*) with live browser speech synthesis (`window.speechSynthesis`).
- Interactive WhatsApp notification mockup with **1-Click UPI App intent** (Google Pay, PhonePe, Paytm, BHIM), Tokenized Card checkout, and 24/7 Priority Support dialing.

### 7. **Measured Money Recovered Across a Batch ("The Bar")**
- Executes prioritized batch recoveries across hundreds of transactions.
- Computes gross recovered volume, intervention costs, and net ROI yield with cryptographic execution receipts and audit logging.

---

## 🖥️ Platform Modules Deep-Dive

| Module | Route / Page | Capabilities |
| :--- | :--- | :--- |
| **Executive Dashboard** | `DashboardPage.tsx` | Macro money story, Revenue Protection Score ($87/100$), recovered vs unrecovered leakage. |
| **Recovery Control Center** | `RecoveryControlCenterPage.tsx` | Real-time recovery queue, operational stream, 1-click batch runner. |
| **Payment Decision Graph** | `WorkflowPage.tsx` | Flagship 15-node causal matrix decomposing ingestion, risk, policy bounds, and execution. |
| **Adaptive Authorization** | `WorkflowPage.tsx` | Smart 3DS optimization, loss breakdown, and counterfactual what-if analysis. |
| **Specialized Recovery Hub** | `SpecializedUseCasesPage.tsx` | Interactive hub for Mandates, B2B Receivables, PTP, and Hinglish Voice Studio. |
| **Policy Optimizer** | `PolicyOptimizerPage.tsx` | Self-learning optimizer surfacing decay curves and human approval proposals. |
| **Strategy Simulator** | `StrategySimulatorPage.tsx` | Zero-mutation policy parameter sandbox projecting macro revenue yield. |
| **Revenue Leakage Radar** | `RevenueLeakagePage.tsx` | Multi-dimensional slicing by Failure Type, Rail, Gateway, and Merchant. |
| **Decision Replay & Audit** | `DecisionReplayPage.tsx` | Forensic step-by-step state machine replay with cryptographic audit hashes. |
| **Operator Copilot** | `OperatorCopilotDrawer.tsx` | Read-only analytics AI assistant backed by live database telemetry. |

---

## 💻 Tech Stack

### **Backend**
- **Runtime**: Python 3.10+
- **Framework**: FastAPI (Async REST APIs)
- **Database**: PostgreSQL 15+ / SQLite with SQLAlchemy 2.0 ORM & Alembic migrations
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Testing**: Pytest (96 unit & integration test suites, 100% passing)

### **Frontend**
- **Framework**: React 18 with TypeScript (Strict Mode)
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS with custom fintech design system (Dark & Light themes)
- **Icons & Charts**: Lucide React & Recharts
- **Audio Engine**: Web Speech API (`window.speechSynthesis`)

---

## 🚀 Quickstart & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Prachiahlawat-30/Recover-AI.git
cd Recover-AI
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run test suite (All 96 tests)
pytest tests/

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend Swagger API documentation will be live at: [**http://localhost:8000/docs**](http://localhost:8000/docs)

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend application will be live at: [**http://localhost:5173**](http://localhost:5173)

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

