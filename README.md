# RecoverAI — Tier 2: Advanced Revenue Intelligence & Optimization

RecoverAI is an autonomous, policy-guarded Revenue Recovery Intelligence Platform for payment companies, merchants, and modern SaaS platforms. It evolves beyond simple retry logic into a comprehensive analytics, anomaly detection, experimentation, and optimization system.

---

## Core Product Pipeline

$$\text{Detect} \longrightarrow \text{Predict} \longrightarrow \text{Optimize} \longrightarrow \text{Experiment} \longrightarrow \text{Learn} \longrightarrow \text{Prevent} \longrightarrow \text{Recover} \longrightarrow \text{Measure}$$

---

## Key Tier 2 Capabilities

1. **Recovery Strategy Experimentation Engine (A/B Testing)**:
   - Evaluates recovery strategies with deterministic hashing assignment (`control` vs `treatment`).
   - Calculates recovery rate, recovered revenue, interventions, average attempts, customer contact rate, net yield, and statistical lift (`+13.4%`).
2. **Recovery Learning Engine**:
   - Aggregates empirical recovery outcomes across failure categories, intervention actions, customer segments, and processor gateways to dynamically calibrate future predictions without black-box ML opacity.
3. **Customer 360 Recovery Profile & Segmentation**:
   - Deterministic behavioral segments (`HIGH_VALUE_RELIABLE`, `HIGH_VALUE_RISK`, `FREQUENT_FAILURE`, `FAST_RECOVERY`, `SLOW_RECOVERY`, `PRICE_SENSITIVE`, `TECHNICAL_FAILURE_PRONE`, `NEW_CUSTOMER`).
   - Generates Recoverability Scores ($0-100$), preferred recovery actions, optimal recovery windows ($10\text{ AM}-12\text{ PM}$), and contact sensitivity levels.
4. **Revenue Leakage Radar**:
   - Company-wide macro analytics on TPV, revenue at risk, expected recoverable, captured revenue, and unrecovered leakage.
   - Multidimensional slicing by: Failure Type, Gateway, Payment Rail (Credit Card, UPI, ACH), Customer Segment, and Merchant Account.
5. **Payment Failure Anomaly & Incident Radar**:
   - Statistical detection of elevated failure rates over rolling windows.
   - Synthesizes operational incidents (`INC-20260826-01: Gateway A Timeout Spike`) with structured, explainable evidence checklists and 1-click resolution.
6. **Gateway Intelligence & Policy-Checked Routing**:
   - Real-time simulated gateway health tracking (Success rate, latency ms, timeout rate, failure distribution).
   - Recommends optimal gateway re-routing (e.g. routing away from degraded Gateway A to healthy Gateway B at $97.1\%$ success rate) under PolicyEngine constraints.
7. **Recovery Playbook Engine**:
   - Generates bounded multi-step recovery sequence timelines ($T+0$, $T+5\text{m}$, $T+24\text{h}$, $T+48\text{h}$, $T+72\text{h}$) with strict stopping rules.
8. **What-If Strategy Simulator**:
   - Interactive policy parameter sandbox allowing operators to adjust max attempts, cooldown hours, high-value thresholds, and retry delays to project immediate macro revenue yields against live portfolio records with **zero database mutation**.
9. **Policy Playground**:
   - Interactive sandbox testing arbitrary transaction failure parameters directly against the live authoritative `PolicyEngine`.
10. **Recovery ROI & Attribution**:
    - Calculates Net Recovered Revenue ($\text{Recovered} - \text{Intervention Cost}$), ROI Multipliers ($18.4\text{x}$), and revenue attribution across actions, failure types, strategies, and gateways.
11. **Operator Copilot**:
    - Read-only analytics AI assistant backed by live database telemetry and structured facts. Rejects direct execution commands by clarifying safety policy boundaries.

---

## Safety Architecture Contract

```
AI / Intelligence Proposes
          │
          ▼
Deterministic PolicyEngine (Authoritative Gatekeeper)
          │
          ▼
RecoveryEngine (Execution Authority)
          │
          ▼
GatewaySimulator (Simulated Processor)
          │
          ▼
AuditService (Immutable Ledger) + Learning Engine
```

* **No direct execution by AI**: Copilot is strictly read-only.
* **Authoritative Policy**: Every intervention must satisfy deterministic rules (`RULE_OPT_OUT_STOP`, `RULE_HIGH_VALUE_THRESHOLD`, `RULE_MAX_ATTEMPTS`, `RULE_COOLDOWN`, `RULE_ANTI_DUPLICATE`).
* **Monetary Precision**: All monetary values use PostgreSQL `NUMERIC(12, 2)` / Python `Decimal`.

---

## REST API Overview

- `GET /api/experiments/`: List A/B recovery experiments.
- `GET /api/experiments/{id}/results`: Statistical lift & strategy comparison.
- `GET /api/revenue-leakage/summary`: Multidimensional leakage breakdown.
- `GET /api/revenue-leakage/executive`: Executive revenue briefing.
- `GET /api/revenue-leakage/roi`: Net revenue ROI & attribution.
- `GET /api/incidents/`: Operational payment degradation incidents.
- `GET /api/incidents/detect`: Real-time anomaly detection check.
- `GET /api/gateways/health`: Live gateway health overview.
- `POST /api/gateways/recommend-route/{risk_id}`: Policy-checked gateway recommendation.
- `GET /api/playbooks/{risk_id}`: Multi-step recovery sequence playbook.
- `POST /api/strategy-simulator/simulate`: Zero-mutation what-if simulation.
- `POST /api/policy/playground`: Authoritative policy playground sandbox.
- `POST /api/copilot/query`: Read-only analytics copilot inquiry.
- `GET /api/customers/{id}/recovery-profile`: 360 customer recovery dossier.

---

## 3-Minute Demo Workflow

1. **Dashboard**: View overall revenue at risk, captured revenue, net recovery, and **18.4x ROI Multiple**.
2. **Revenue Leakage Radar**: Inspect macro leakage sliced by failure type, gateway, and merchant.
3. **Payment Incidents**: View active Gateway A degradation incident with deterministic root-cause evidence.
4. **Recovery Intelligence**: Review ranked opportunities with explainable probability gauges and candidate net yields.
5. **Opportunity Detail Drawer**: View "Why this action?" factual reasoning, candidate action comparisons, and execute single-step under policy guardrails.
6. **A/B Experiments**: Compare Control (Immediate retry: 61%) vs Treatment (6-hour delay: 74%) with `+21.3% Lift`.
7. **What-If Strategy Simulator**: Slide cooldown from 24h to 12h and high-value threshold to $1,500 to project incremental revenue yield.
8. **Policy Playground**: Test a $1,500 transaction or opted-out customer to verify deterministic policy enforcement.
9. **Operator Copilot**: Open the drawer and ask *"Which gateway is underperforming?"* or *"Execute all retries"* to observe evidence retrieval and safety rejection.
10. **Audit Trail**: Inspect full cryptographic traceability of all events.

---

## Verification
- Backend Pytest: `46 passed in 68.78s` (100% green).
- Frontend Build: `npm run build` passed with 0 errors.
