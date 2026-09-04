# SpendGuardian AI 🛡️

### Autonomous Payment Governance & Real-Time Risk Intelligence for AI Agents

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **SpendGuardian AI is a pre-transaction security and governance layer that evaluates autonomous AI-agent payment requests before they reach a payment gateway.**

---

## 📌 Overview

As AI agents become capable of making purchases, managing subscriptions, booking services, and interacting with payment APIs, organizations need a reliable way to control what these agents are allowed to spend.

Traditional fraud detection is often designed to identify suspicious activity **after or around the time a transaction occurs**.

SpendGuardian AI takes a **preventive approach**.

It operates as a payment governance firewall between an autonomous agent and the payment infrastructure, evaluating each transaction against:

* Enterprise spending policies
* Merchant and category restrictions
* Transaction velocity
* Historical spending behavior
* Agent trust levels
* Current security state
* Human approval requirements

Every transaction receives one of three decisions:

**`ALLOW` → `APPROVAL REQUIRED` → `BLOCK`**

This allows organizations to enforce financial controls before unauthorized or anomalous transactions reach the payment API.

---

## 🎯 Problem

Autonomous agents introduce a new class of financial risks.

An agent can potentially:

* Execute repeated transactions because of an infinite retry loop
* Spend beyond its assigned budget
* Interact with an unauthorized merchant
* Purchase items outside its intended category
* Operate during restricted hours
* Deviate significantly from its historical spending behavior
* Become compromised through malicious instructions or abnormal behavior

A conventional post-transaction monitoring system may detect these events only after financial exposure has already occurred.

### SpendGuardian's Approach

```text
AI Agent
   │
   │ Payment Request
   ▼
┌───────────────────────────────┐
│      SpendGuardian AI         │
│      Payment Firewall         │
├───────────────────────────────┤
│ Policy Evaluation             │
│ Behavioral Analysis           │
│ Trust Scoring                 │
│ Security State Management     │
└───────────────┬───────────────┘
                │
       ┌────────┼─────────┐
       ▼        ▼         ▼
    ALLOW   APPROVAL    BLOCK
             REQUIRED
       │        │         │
       ▼        ▼         ▼
   Gateway   Human      Transaction
   API       Review       Stopped
```

---

# 🚀 Key Features

## 1. Three-Way Transaction Decision Engine

Instead of using a simple allow/block model, SpendGuardian provides three outcomes:

| Decision            | Description                                        |
| ------------------- | -------------------------------------------------- |
| `ALLOW`             | Transaction satisfies policy and risk requirements |
| `APPROVAL REQUIRED` | Transaction requires human verification            |
| `BLOCK`             | Transaction violates a security or spending policy |

This enables organizations to balance automation with human oversight.

---

## 2. Deterministic Policy Engine

Core financial controls are enforced using deterministic rules rather than relying exclusively on probabilistic AI decisions.

Supported controls include:

* Per-transaction spending limits
* Daily cumulative spending limits
* Allowed merchant categories
* Restricted merchant categories
* Merchant allowlists
* Merchant blocklists
* Human approval thresholds
* Transaction velocity limits
* Business-hour restrictions

### Example Policy

```typescript
export interface Policy {
  agentId: string;
  dailyLimit: number;
  perTransactionLimit: number;

  allowedCategories: string[];
  restrictedCategories: string[];

  allowedMerchants: string[];
  blockedMerchants: string[];

  requireApprovalAbove: number;
  maxVelocityPerMinute: number;

  enforceBusinessHours: boolean;
}
```

---

## 3. Behavioral Anomaly Detection

SpendGuardian evaluates transaction behavior in addition to static policies.

### Velocity Burst Detection

Detects unusually rapid transaction attempts that may indicate:

* Infinite retry loops
* Agent malfunction
* Automated abuse
* Compromised agents

### Historical Spend Deviation

Compares a transaction against an agent's historical spending patterns.

Examples:

```text
Normal baseline:      ₹500
Current transaction: ₹1,000     → Elevated
Current transaction: ₹2,500     → High deviation
Current transaction: ₹10,000    → Critical deviation
```

### Cross-Agent Anomaly Detection

Identifies situations where an agent attempts transactions that are inconsistent with its assigned responsibilities.

---

## 4. Adaptive Security State Machine

Agents can transition through progressively stricter security states:

```text
                 ┌───────────┐
                 │  NORMAL   │
                 └─────┬─────┘
                       │ anomaly
                       ▼
                 ┌───────────┐
                 │  MONITOR  │
                 └─────┬─────┘
                       │ repeated anomalies
                       ▼
                 ┌───────────┐
                 │ RESTRICTED│
                 └─────┬─────┘
                       │ severe anomaly
                       ▼
                 ┌───────────┐
                 │ LOCKDOWN  │
                 └─────┬─────┘
                       │ critical threat
                       ▼
                 ┌───────────┐
                 │ SUSPENDED │
                 └───────────┘
```

### Security States

| State        | Behavior                            |
| ------------ | ----------------------------------- |
| `NORMAL`     | Full configured spending authority  |
| `MONITOR`    | Increased monitoring and auditing   |
| `RESTRICTED` | Reduced transaction authority       |
| `LOCKDOWN`   | Transactions require human approval |
| `SUSPENDED`  | All transactions blocked            |

The progression provides a controlled response to repeated or increasingly severe anomalies.

---

## 5. Explainable Trust Score

Each agent receives a **0–100 trust score** derived from its transaction history.

The system rewards compliant behavior and penalizes policy violations and anomalies.

### Trust Levels

|  Score | Classification  |
| -----: | --------------- |
| 80–100 | `TRUSTED`       |
|  60–79 | `MONITORED`     |
|  40–59 | `ELEVATED RISK` |
|   0–39 | `HIGH RISK`     |

Because the scoring logic is transparent, security teams can understand why an agent's trust level changed.

---

## 6. Emergency Kill-Switch

A compromised or high-risk agent can be immediately suspended.

The kill-switch can:

* Freeze an individual agent
* Prevent further payment attempts
* Record the security incident
* Preserve the associated risk information
* Require manual intervention before reactivation

---

## 7. What-If Policy Simulator

Before deploying a policy change, administrators can simulate its impact against historical transactions.

The simulator helps estimate:

* Transactions that would change from `ALLOW` → `BLOCK`
* Potential false positives
* Operational friction
* Additional transactions requiring approval
* Capital preserved under the proposed policy

This allows organizations to evaluate policy changes before applying them to live operations.

---

## 8. Automated Validation Suite

SpendGuardian includes a deterministic validation suite containing **100 policy and edge-case scenarios**.

Tests cover:

* Transaction-limit boundaries
* Daily spending limits
* Merchant restrictions
* Category restrictions
* Invalid amounts
* Zero and negative values
* Business-hour rules
* Velocity thresholds
* Agent security states
* Decision outcomes

Example boundary testing:

```text
Limit - ₹1   → ALLOW
Exact Limit  → ALLOW
Limit + ₹1   → BLOCK
```

---

# 🧪 Demonstration Scenarios

The application includes predefined scenarios for demonstrating different security decisions.

| Scenario               |   Amount | Expected Decision   |
| ---------------------- | -------: | ------------------- |
| Routine Food Order     |     ₹450 | `ALLOW`             |
| New Merchant           |   ₹1,200 | `APPROVAL REQUIRED` |
| Over-Limit Transaction |   ₹4,500 | `BLOCK`             |
| Unauthorized Category  |   ₹1,500 | `BLOCK`             |
| Velocity Burst         | ₹350 × 6 | `THROTTLED / BLOCK` |
| Agent Compromise       |  ₹25,000 | `CRITICAL BLOCK`    |

These scenarios demonstrate how the firewall responds to normal, ambiguous, anomalous, and critical payment requests.

---

# 🏗️ Architecture

SpendGuardian follows a modular client-side architecture.

```text
                    Autonomous AI Agent
                            │
                            ▼
                    Payment Request
                            │
                            ▼
              ┌─────────────────────────┐
              │   SpendGuardian Engine  │
              ├─────────────────────────┤
              │                         │
              │  1. Rule Engine         │
              │  2. Anomaly Detection   │
              │  3. Trust Engine        │
              │  4. Adaptive Engine     │
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                  Security Decision
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
         ALLOW          APPROVAL        BLOCK
                           │
                           ▼
                     Human Review
```

The core deterministic evaluation engine does not require an external runtime dependency for its policy evaluation.

---

# 🛠️ Technology Stack

### Frontend

* **React 18**
* **TypeScript**
* **Vite**
* **Tailwind CSS**

### Visualization & UI

* **Recharts** — transaction and decision analytics
* **Lucide React** — interface icons
* **Motion** — UI animations and transitions

### Architecture

* Modular component architecture
* Type-safe application logic
* Deterministic policy evaluation
* Centralized state management
* Client-side simulation and validation

---

# 📂 Project Structure

```text
spendguardian-ai/
│
├── src/
│   │
│   ├── components/
│   │   ├── CompromiseBanner.tsx
│   │   ├── DecisionChart.tsx
│   │   ├── Header.tsx
│   │   ├── LiveFeed.tsx
│   │   ├── MetricsCards.tsx
│   │   ├── SimulationPanel.tsx
│   │   └── WhyInspector.tsx
│   │
│   ├── data/
│   │   └── seedData.ts
│   │
│   ├── engine/
│   │   ├── adaptiveEngine.ts
│   │   ├── crossAgentAnomaly.ts
│   │   ├── ruleEngine.ts
│   │   └── trustEngine.ts
│   │
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── IncidentsPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LedgerPage.tsx
│   │   ├── PolicyPage.tsx
│   │   └── ValidationPage.tsx
│   │
│   ├── store/
│   │   └── StoreContext.tsx
│   │
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
│
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

# ⚡ Getting Started

## Prerequisites

Make sure you have installed:

* Node.js 18+
* npm 9+

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/spendguardian-ai.git
cd spendguardian-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local development URL displayed by Vite in your browser.

### 4. Build for production

```bash
npm run build
```

### 5. Run lint checks

```bash
npm run lint
```

---

# 🔐 Security Principles

SpendGuardian is designed around four core principles.

### 1. Defense in Depth

Multiple layers evaluate each transaction:

```text
Hard Policy Rules
       ↓
Behavioral Analysis
       ↓
Trust Evaluation
       ↓
Adaptive Security State
       ↓
Final Decision
```

### 2. Zero-Trust Autonomy

AI agents cannot independently expand their spending authority or modify their own security policies.

### 3. Fail Closed

Malformed or incomplete payment requests default to:

```text
BLOCK
```

rather than being allowed through the system.

### 4. Auditable Decisions

Transaction decisions are recorded with the information required to understand the corresponding policy and risk evaluation.

---

# 📊 Example Decision Flow

```text
Payment Request
      │
      ▼
Is the request valid?
      │
   No ─┴─→ BLOCK
      │
     Yes
      ▼
Policy Evaluation
      │
      ├── Limit exceeded ──────→ BLOCK
      │
      ├── Restricted category ─→ BLOCK
      │
      └── Policy compliant
                │
                ▼
       Behavioral Analysis
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
      Normal  Moderate  Critical
        │       │        │
        ▼       ▼        ▼
      ALLOW  APPROVAL   BLOCK
              REQUIRED
```

---

# 💡 Why SpendGuardian?

Traditional payment security often focuses on detecting suspicious transactions.

SpendGuardian focuses on **governing autonomous financial behavior before payment execution**.

| Traditional Approach          | SpendGuardian                   |
| ----------------------------- | ------------------------------- |
| Detect suspicious activity    | Prevent risky transactions      |
| Post-transaction focus        | Pre-transaction enforcement     |
| Primarily fraud-oriented      | Agent-governance oriented       |
| Binary decisions              | Three-way decisions             |
| Static controls               | Adaptive security states        |
| Limited explainability        | Rule and score-based reasoning  |
| Human intervention after risk | Human approval before execution |

---

# 🔮 Future Scope

Potential extensions include:

* Integration with live payment gateways
* REST API / middleware deployment
* Persistent transaction databases
* Enterprise authentication and RBAC
* LLM-assisted transaction reasoning
* Retrieval-Augmented Generation for policy knowledge
* Multi-tenant enterprise deployment
* Advanced behavioral ML models
* Cryptographically verifiable audit trails
* SIEM and enterprise security integrations
* Real-time agent identity and credential verification

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

4. Push the branch

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for more information.

---

## 👩‍💻 Project

**SpendGuardian AI**

Built as an exploration of secure, policy-driven financial governance for autonomous AI agents.

> **Give AI agents the ability to act — without giving them unrestricted access to money.**
