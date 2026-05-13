# NexaPlan - Project Context

This document provides essential context about the NexaPlan platform's architecture and features. **AI Assistants must read this file before proceeding with any new session to understand the system.**

## 1. Tenants: Tenant Management Module

**Overview:** The centralized command matrix for provisioning, monitoring, and governing all client workspaces (tenants) operating on the platform.

**System Processes & UI Behaviors:**

- **Provision New Tenant (Action):** Clicking this button initializes a multi-step modal wizard designed for Custom Enterprise or Government onboarding.
  - **Data Payload:** Requires input for Organization Name, Main Admin details, Subscription Tier, and Organizational Structure Type (e.g., Corporate = "Departments", Government = "Bureaus/Offices"). All core tenant attributes (including Phone and OrgType) are captured.
  - **Backend Transaction:** Bypasses the PayMongo checkout flow entirely. The system executes a MySQL script to generate an isolated database schema for the client, seeds the default permissions, and dispatches securely hashed temporary login credentials via SMTP.
- **Edit (Action):** Expands a side-panel for deep-level tenant configuration. Allows modification of contact details, manual tier upgrades, or overriding the dynamic organizational labels defined during provisioning.
- **Archive (Action):** Executes a "soft delete" transaction. A boolean flag (`isArchived = true`) is updated in the MySQL database. PayMongo recurring billing is instantly canceled via API webhook. The tenant's UI access is blocked, but data remains restorable for a 30-day grace period.

- **"Login As" / Impersonation Protocol (Implemented):** A secure, token-based feature allowing Super Admins to generate a temporary session within a specific client's workspace. It utilizes a dedicated backend endpoint that swaps the current JWT for a tenant-specific token, enabling seamless troubleshooting without client credentials.

## 2. Billing: Subscription & PayMongo Engine

**Overview:** The financial operations center handling all subscription lifecycles, pricing configurations, and payment gateway synchronizations.

**System Processes & UI Behaviors:**

- **PayMongo Integration:** The `PaymentsController` manages checkout links. `PayMongo:SecretKey` MUST be configured in `appsettings.json`. Empty fallback keys have been stripped out of development environments to ensure the real PayMongo flow is always engaged.
- **Price Configuration Settings (Integration):** An interface area allowing adjustments to the Monthly and Annual pricing for Starter, Professional, and Enterprise tiers. Changing these values pushes an API update to PayMongo to modify the base subscription products.
- **Refresh/Sync (Action):** Clicking the "Sync PayMongo" button triggers a POST request to `/api/super-admin/invoices/sync`. This logic now includes **Automated Admin Unlocking**: when a successful payment is detected for a tenant, the system automatically reactivates the Main Admin user account and clears any "Locked" status, ensuring immediate access upon payment.
- **Premium Toast System (UI Standard):** All financial and administrative actions now use an integrated Toast notification engine instead of browser-native alerts. This provides a consistent, high-end user experience with real-time feedback on API transactions.
- **Invoice Management:** Clicking an individual invoice queries the database for the specific PayMongo Payment Intent ID. It allows the issuance of partial or full refunds directly through the dashboard.

**Architectural Additions Required:**

- **Webhook Failure Logs:** A monitoring table that displays missed or failed PayMongo webhooks (e.g., if a payment succeeds but the server fails to register it due to a connection drop).

## 3. Admins: Main Admin Accounts

**Overview:** The Identity and Access Management (IAM) module focused exclusively on tracking the highest-privileged users within each client organization.

**System Processes & UI Behaviors:**

- **Security Posture Tracking:** Continuously queries the MySQL user table to aggregate metrics on Multi-Factor Authentication (MFA) adoption.
- **Security & Auth (Edit Modal Upgrade):** The Tenant Edit modal now includes a dedicated "Security & Auth" section. This allows Super Admins to perform immediate **Password Resets** for Main Admins and manually override account locking/activation status.
- **Create Admin Account (Action):** A contingency tool used if a client organization loses access to their primary admin account. Generates a new Main Admin profile mapped to a dynamically populated dropdown list of existing tenants (rather than a raw text input) to prevent data orphaned profiles.

## 4. Trial Requests: Trial Request Management

**Overview:** The security gateway for the platform, preventing bot registrations, spam, and server exhaustion by mandating manual verification for free trials.

**System Processes & UI Behaviors:**

- **Review/View Details (Action):** Every row in the trial table is clickable. Pending requests say "Review →", while approved/rejected requests say "View Details", opening a comprehensive verification dossier.
- **Approval Transaction:** Clicking "Approve" triggers a cascade of backend events: The account status shifts to "Active", the MySQL database allocates workspace storage, the PayMongo customer profile is drafted (awaiting future payment details), a 14-day trial countdown timer is initiated in the UI.
  - **Password Retrieval:** The system retrieves the original password hash the user submitted during the registration step, ensuring they can log in seamlessly with the credentials they initially created.
  - **Email Notification:** Uses an integrated `SmtpClient` implementation (configured in `appsettings.json`) to securely dispatch live welcome emails upon approval.
  - **UI Modal:** A UI modal also immediately presents confirmation to the Super Admin upon clicking Approve.
- **Rejection Transaction:** Deletes the pending request from the queue and adds the applicant's email domain or IP address to a blacklist table to prevent repeated spam submissions.

## 5. UI/UX Standards & Validation

**Overview:** The platform adheres to a premium design system that prioritizes non-intrusive feedback and integrated validation.

- **Zero-Alert Policy:** Browser-native `alert()` and `confirm()` prompts are **strictly prohibited across the entire codebase**. All confirmation dialogs must be implemented as React modal components. Any remaining `window.alert()` or `window.confirm()` calls are bugs and must be replaced.
- **Integrated Error Banners:** The Login, Register, and Checkout pages use custom React components to display validation errors (e.g., invalid credentials) directly within the page layout.
- **Actionable Feedback:** All operations trigger Toast notifications via the `addToast()` system (success / error / info variants with iconography).
- **Admin Lock Modal:** `AdminsView.tsx` now shows a proper `lockConfirmId` modal instead of `window.confirm()` for disabling admin accounts.

## 5.5 Authentication (FIXED — Session 5)

**Login endpoint (`AuthController.Login`):**

- EF Core CANNOT translate `u.Email.Trim()` or `u.Email.ToLower()` to MySQL SQL — these caused `null` user results even when email existed.
- **Final fix:** Fetch by `u.Email == request.Email.Trim()` (literal equality, MySQL handles case-insensitivity). If no results, fetch ALL users and filter in C# with `.Trim().ToLower()` comparison as fallback.
- Returns `userId`, `tenantId`, `roleId`, `name`, `email`.

**CRITICAL — Actual Role IDs in DB (from `Program.cs` seeding order):**
| RoleID | Role Name |
|---|---|
| 1 | Super Admin |
| 2 | Main Admin |
| **3** | **Finance Manager** |
| **4** | **Department Head** |
| 5 | Auditor |
| 6 | Viewer |

⚠️ Previous code assumed Finance Manager = 4, Department Head = 3. **This was wrong.** All role checks must use 3 for Finance Manager and 4 for Department Head.

**`ImpersonateTenant` endpoint:** Returns `userId` for correct session storage.

## 6. Main Admin Dashboard (v2 — Fully Functional)

**Overview:** The tenant-scoped workspace management system for the highest-privileged user within each client organization.

### Architecture

- **Backend:** Split into dedicated controllers under `NexaPlan.API/Controllers/MainAdmin/`:
  - `MainAdminBaseController.cs` — shared `GetTenantId()` helper; all others inherit from this
  - `MainAdminSummaryController.cs` — `GET api/main-admin/summary`, `GET api/main-admin/roles`
  - `MainAdminUsersController.cs` — full CRUD + bulk actions at `api/main-admin/users`
  - `MainAdminDepartmentsController.cs` — full CRUD at `api/main-admin/departments`
  - `MainAdminSettingsController.cs` — `GET/PUT api/main-admin/settings`
  - `MainAdminLogsController.cs` — `GET api/main-admin/logs` (search, type, date range)
  - `MainAdminBillingController.cs` — `GET api/main-admin/billing`, `POST billing/upgrade`, `POST billing/cancel`
- **DTOs:** `NexaPlan.API/DTOs/MainAdminDtos.cs` — all request/response DTOs
- **Frontend:** `src/app/(roles)/main-admin/MainAdminSystem.tsx` (orchestrator) + individual view components in `views/`
- **API Client:** `src/api/mainAdminApi.ts` with all fully-typed functions

### Tabs & Features

| Tab                     | Status         | Key Features                                                                                                                                            |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview                | ✅ Live        | Seat usage + color warning (≥80% amber, ≥90% red), clickable role chart (routes to Users tab pre-filtered), dept quick-access, recent activity          |
| Forecasting & Analytics | ✅ Live (stub) | Burn rate line chart (mock), dept budget table with status flags, AI warning modals; AI engine placeholder                                              |
| Users & Roles           | ✅ Live        | Full CRUD, Finance Manager department restriction, `lastTempPassword` viewable with eye toggle, bulk activate/suspend/delete, role/status search filter |
| Departments             | ✅ Live        | Card-grid CRUD, budget caps, head assignment, dynamic label (Dept/Bureau/Division by OrgType)                                                           |
| Settings                | ✅ Live        | MFA toggle, fiscal year, currency, unsaved-changes warning banner                                                                                       |
| Audit Logs              | ✅ Live        | Search, type filter, date range, CSV export                                                                                                             |
| Billing                 | ✅ Live        | Plan card, next due date + countdown warning, Upgrade/Renew/Cancel actions via PayMongo checkout                                                        |

### Business Rules

- **Finance Manager (RoleID = 4):** Cannot be assigned to a department — they have org-wide budget oversight. Enforced in both backend and frontend.
- **`LastTempPassword`:** Stored in plain text on `Users.LastTempPassword` (EF migration: `20260503081804_AddLastTempPassword`). Surfaced to admin in the edit modal with an eye toggle. Cleared/updated whenever a new temp password is set.
- **Seat limits by tier:** Starter=15, Professional=50, Enterprise=200, Trial=10.
- **Billing cancel** sets `Tenant.RegistrationStatus = "CancellationPending"` — plan stays active until cycle end.
- **Billing upgrade/renew** creates a new PayMongo checkout session for the selected tier.

### Session / Auth (FIXED)

- `App.jsx` `useEffect` now restores sessions on **page refresh** by reading `localStorage.user.roleId` and routing accordingly (roleId 1→super-admin, 2→main-admin, 3→dept-head, 4→finance-manager, 5→auditor).
- **"Login As" impersonation** (SuperAdminSystem.tsx) now stores `roleId: 2` and `userId` in the `localStorage.user` object, then calls `window.location.reload()` instead of navigating to `/main-admin/dashboard` (which didn't exist in the SPA). App.jsx reads the refreshed state and routes correctly.
- **Logout** calls `window.location.reload()` after clearing localStorage — App.jsx sees no user and shows landing page.

### Known / Future Work

- AI Forecasting engine not yet implemented — tab shows mock data with "Coming Soon" notice.
- Dept budget tracking uses estimated mock multipliers until real expense data is wired in.

## 7. Super Admin Backend Refactor (v2 — Session 4)

**The monolithic `SuperAdminController.cs` has been split into focused controllers under `NexaPlan.API/Controllers/SuperAdmin/`:**

| File                               | Route Prefix                     | Responsibilities                                                                                   |
| ---------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `SuperAdminBaseController.cs`      | (abstract)                       | Shared `SyncPendingPaymentsAsync()` and `FormatTimeAgo()` helpers; all SA controllers inherit this |
| `SuperAdminDashboardController.cs` | `api/super-admin/summary`        | Platform-wide KPI summary (tenants, MRR, trials, invoices)                                         |
| `SuperAdminTenantsController.cs`   | `api/super-admin/tenants`        | Full tenant CRUD, provisioning, archiving, impersonation                                           |
| `SuperAdminAdminsController.cs`    | `api/super-admin/admins`         | Main admin CRUD, lock/unlock (with optional password reset)                                        |
| `SuperAdminTrialController.cs`     | `api/super-admin/trial-requests` | Trial approval/rejection + SMTP dispatch + fallback log                                            |
| `SuperAdminBillingController.cs`   | `api/super-admin/invoices`       | Invoice list, PayMongo sync, refunds                                                               |
| `SuperAdminConfigController.cs`    | `api/super-admin/config`         | System config CRUD (PayMongo keys, SMTP settings)                                                  |

**Old `SuperAdminController.cs` has been deleted.** All frontend API calls continue to hit the same `api/super-admin/*` routes — no frontend changes needed.

## 8. UI Fixes (Session 4)

- **OverviewTab:** Removed `max-w-*` constraint. Layout is now `w-full` with responsive Tailwind grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` for KPIs, `grid-cols-1 lg:grid-cols-3` for the bottom panels). Fills the entire viewport at any screen size.
- **BillingTab:** Removed `max-w-3xl` — now `w-full` so the plan card and invoice table stretch to fill available space.

## 9. Budget Planning & Scenarios (Phase 1 Completed — Session 6)

**Overview:** Implemented the core engine for Department Head budget requests, variance analysis, and the Finance Manager scenario "Control Room."

### Architecture

- **Backend Models:**
  - Upgraded `BudgetProposal` (added Title, string ProposalStatus, Priority, Justification, ReviewNotes, timestamps).
  - Upgraded `LineItem` (added Description, computed Total, and `IsRejected` flag).
  - Upgraded `BudgetScenario` (made tenant-level with AdjustmentMultiplier, IsActive, and `IsArchived` flag).
- **Backend Controllers:**
  - `DeptHeadBaseController`, `DeptHeadProposalsController`, `DeptHeadVarianceController`, `DeptHeadScenariosController`.
  - `FinanceManagerBaseController`, `FinanceManagerApprovalsController`, `FinanceManagerScenariosController`, `FinanceManagerAllocationController`.
- **Frontend Clients:** `deptHeadApi.ts` and `financeManagerApi.ts`.

### Key Features

- **Proposals Engine:** Dept Heads can create draft proposals with multiple line items, submit for review, and track status.
- **Approvals & Line-Item Rejection:** Finance Managers can review proposals and toggle individual line items as "Excluded" before approving, dynamically recalculating the total. The system calculates a real-time Budget Impact Warning against the department's cap.
- **Budget Allocation & Reallocation Tool:** The Allocation View provides drill-down capabilities into a department's approved proposals. Finance Managers can seamlessly transfer surplus funds between departments (with full Audit Logging) to address deficits.
- **Scenario Control Room:** Finance Managers can create global scenarios (e.g., "Conservative Cut (-20%)") and activate them. Scenarios can also contain granular department overrides (stored via JSON).
- **Archive/History:** Scenarios can be archived into a historical log instead of being permanently deleted, preserving past financial assumptions.
- **Auto-Freeze Logic:** Activating a scenario with a multiplier < 1.0 automatically scans pending/approved proposals and flags "Low Priority" (or "High Priority" if severe cut) proposals as "Frozen".
- **Global Alert Banner:** A persistent warning banner appears at the top of BOTH the Dept Head and Finance Manager dashboards when any restrictive scenario (multiplier < 1.0) is active.
- **Variance Analysis & Pacing:** Tracks actual spend of "Approved" proposals against the active budget cap. Incorporates **Fiscal Year Pacing metrics** that automatically trigger a "CRITICAL BURN" alert if a department's utilization percentage outpaces the elapsed time in the year. Includes a 1-Click PDF Audit feature for at-risk departments.

## 10. Expense Reconciliation Flow (Session 7)

**Overview:** Bridges the gap between an approved budget (Committed) and a real purchase (Spent). Ensures Variance Analysis and AI Forecasting have real numbers to work with.

### Data Flow

1. **Approval (Existing):** Finance Manager approves a proposal → funds are `Committed` (proposal total contributes to allocated spend).
2. **Expense Log (New — Dept Head):** After the actual purchase, the Dept Head navigates to the new **"Log Expenses"** tab and submits an expense ticket linked to the approved `ProposalID`, entering the _exact_ amount spent and uploading a receipt.
3. **Reconciliation (New — Finance Manager):** Finance Manager sees all pending expense tickets in the new **"Reconciliation"** tab. They review the receipt, then click **"Clear"** → the backend sets `Expense.Status = "Reconciled"`, accumulates `Department.ActualSpent += expense.Amount`, and logs an audit record.
4. **Data Feed:** `Department.ActualSpent` feeds directly into `GET /api/finance-manager/allocations` (which VarianceView consumes), overriding the proposal-based estimate with the real reconciled figure.

### New Files

| File                                                             | Role                                                                                                                                   |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Models/Expense.cs`                                              | New `Expenses` table: links to ProposalID, stores Amount, ReceiptUrl, Status, SubmittedBy, ReconciledBy                                |
| `Models/Department.cs`                                           | Added `ActualSpent` column — accumulates reconciled expense totals                                                                     |
| `Controllers/DeptHead/DeptHeadExpensesController.cs`             | `GET /dept-head/expenses`, `GET /dept-head/proposals/approved`, `POST /dept-head/expenses`                                             |
| `Controllers/FinanceManager/FinanceManagerExpensesController.cs` | `GET /finance-manager/expenses?status=`, `POST /finance-manager/expenses/{id}/reconcile`, `POST /finance-manager/expenses/{id}/reject` |
| `Controllers/DeptHead/DeptHeadBaseController.cs`                 | Added `GetDepartmentIdAsync()` helper (resolves dept from User.DepartmentID)                                                           |
| `views/department-head/ExpensesView.tsx`                         | Dept Head expense log form — links proposal, enters amount, uploads receipt                                                            |
| `views/finance-manager/ReconciliationView.tsx`                   | Finance Manager review table — Clear/Reject with confirm modal                                                                         |

### Migration

- `20260504045354_AddExpenseFlow` — Creates `Expenses` table + adds `ActualSpent` to `Departments`

### Business Rules

- Dept Heads can only log expenses against `ProposalStatus == "Approved"` proposals in their own department.
- Finance Managers can filter expenses by status (Pending / Reconciled / Rejected).
- `Department.ActualSpent` is the **authoritative** actual spend figure used by VarianceView (preferred over proposal-based estimates).
- Rejecting an expense does NOT update ActualSpent — it prompts the Dept Head to resubmit with a corrected receipt.

## 11. Auditor Dashboard & Compliance Engine (Session 8)

**Overview:** A read-only compliance module that provides a global view of all financial and administrative events, automated policy scans, and cryptographic integrity of financial records.

### Architecture

- **Backend Controllers:**
  - `AuditorBaseController.cs` — Shared tenant/user resolution helper.
  - `AuditorAuditTrailController.cs` — `GET /logs`, `GET /logs/summary`, `POST /logs/{id}/flag`, `POST /logs/{id}/unflag`.
  - `AuditorComplianceController.cs` — `GET /compliance/rules`, `GET /compliance/scan` (live check), `POST/PUT/DELETE /compliance/rules` (custom rules).
  - `AuditorStatementsController.cs` — `GET /statements`, `POST /statements/{id}/access`, `GET /statements/{id}/access-log`.
- **Backend Models:**
  - `AuditLog`: Upgraded with Flagging properties (`IsFlagged`, `FlagReason`, `FlaggedBy`, `FlaggedAt`). FK navigations set to `NoAction` to prevent legacy data constraints.
  - `ComplianceRule`: Tracks active policies (e.g. BudgetIncrease limits) with numeric thresholds. Allows lead auditor to create non-system custom rules.
  - `FinancialStatement`: Finalized reports with `Sha256Hash` cryptographic integrity fields.
  - `StatementAccessLog`: Highly granular log tracking exactly who/when/where viewed or downloaded financial records.
- **Frontend Clients:** `auditorApi.ts` — fully typed client interface.
- **Frontend UI (`src/app/(roles)/compliance-audit/`):**
  - **`ComplianceAuditSystem.tsx`**: Refactored orchestrator replacing the old 1000-line monolithic file.
  - **`layout/AuditorTopNav.tsx`**: Navigation and Profile controls.
  - **`views/OverviewView.tsx`**: Top-level KPIs summarizing total logs, flags, and recent activity.
  - **`views/AuditTrailsView.tsx`**: Complete log explorer with deep-dive metadata display. Allows Auditors to "Flag for Investigation" directly on anomalous rows.
  - **`views/ComplianceScansView.tsx`**: Real-time evaluation of `ComplianceRules` against live data. Includes "Deep Link" buttons to jump directly to logs causing a violation (e.g., transactions outside business hours).
  - **`views/FinancialStatementsView.tsx`**: Read-only display of finalized PDFs/Excel sheets with SHA-256 integrity hashes clearly visible. Includes granular Access History tracking panel.

### Key Features

- **Idempotent Migrations:** Due to partial schema collisions, `AddAuditorTables` utilizes `IF NOT EXISTS` raw SQL statements to guarantee database integrity during execution.
- **Visual Flagging:** Auditors can suspend review and request details by flagging a log entry with a written reason.
- **Live Scans:** The compliance check engine runs C# queries directly on `Departments`, `AuditLogs`, and `BudgetProposals` to evaluate thresholds dynamically rather than relying on stale snapshots.

## 12. VAT & Dynamic SaaS Pricing (Session 9)

**Overview:** Implemented comprehensive tax logic across SaaS billing and internal procurement, and introduced dynamic SaaS pricing configurable via the Super Admin dashboard.

### Architecture Updates

- **Models:**
  - `Expense`: Added `TaxPaid` to track exact VAT from physical receipts during expense reconciliation.
  - `LineItem`: Added `IsVatInclusive` flag to differentiate base cost vs. VAT on budget proposals.
  - `Invoice`: Added `TaxAmount` and `VatInclusive` to explicitly separate VAT on SaaS subscription invoices.
- **Backend Controllers:**
  - `SuperAdminConfigController`: Added `GET /api/pricing` (public endpoint) and updated config keys to store pricing tiers and global VAT rules.
  - `PaymentsController`: Refactored to fetch dynamic pricing from `SystemConfigs` instead of a hardcoded catalog. Calculates final charge and explicit VAT breakdown based on the `pricing_vat_inclusive` setting before dispatching to PayMongo.
  - `DeptHeadExpensesController` & `FinanceManagerExpensesController`: Updated to pass and store `TaxPaid` during the expense log and reconcile flow.
  - `DeptHeadProposalsController`: Updated to accept and return `IsVatInclusive` for individual line items.

### Frontend UI Changes

- **Super Admin - Billing View:** Added a "SaaS Pricing Configuration" panel allowing live updates to Starter, Professional, and Enterprise tier pricing (monthly/annual) and a global VAT Application toggle.
- **Super Admin - Config View:** Removed the hardcoded PayMongo Gateway Secrets panel to enhance security.
- **Landing Page - Pricing Table:** Refactored to fetch prices dynamically from `/api/pricing` and display an appropriate VAT disclaimer based on the global rule.
- **Dept Head - New Request View:** Added "VAT Inclusive/Exclusive" toggles per line item and a real-time VAT breakdown in the total summary.
- **Dept Head - Expenses View:** Added a dedicated "Tax Amount Paid (VAT)" field in the expense logging modal to capture actual receipt data.
- **Finance Manager - Approval View:** Added a "Tax Breakdown" summary panel showing Requested, Estimated Base Cost, and Estimated 12% VAT.
- **Finance Manager - Variance View:** Introduced a "Gross (With Tax) / Net (Without Tax)" toggle that dynamically recalculates all pacing and variance figures.
- **Compliance Audit - Financial Statements:** Added a "Total Tax Capitalized" line item for cryptographic audit traceability.

## 13. Financial Lifecycle Flow (Session 10)

**Overview:** Implemented the end-to-end budget lifecycle guardrails tying top-down allocations to bottom-up requests, reconciliation, and scenario cutoffs.

### Backend Updates

- **New Model:** `DepartmentAllocation` stores `DepartmentID`, `FiscalYear`, `TotalAllocatedCap`, and `SetByAdminID` for top-down caps.
- **BudgetProposal Extensions:** Added `RequestedAmount`, `PriorityRank` (1-4), and `IsTaxInclusive` to support ranking and validation.
- **Expense Status Alignment:** Standardized pending state to `Pending_Reconciliation` (UI normalizes to `Pending`).

### Core API Rules

- **Main Admin Allocation Guard:** `MainAdminDepartmentsController` now enforces Main Admin role (RoleID = 2) when setting/updating department caps and writes to `DepartmentAllocations`.
- **Dept Head Guard Endpoint:** `GET /api/dept-head/allocations/guard` returns `totalAllocatedCap`, `committedFunds`, and `remainingCap` for pre-submit validation.
- **Proposal Validation (Phase 3):** Proposal creation/update rejects if `Committed + RequestedAmount > TotalAllocatedCap` with a clear error message.
- **Scenario Cutoff (Phase 5):** Activating a scenario with `AdjustmentMultiplier < 1.0` now orders proposals by `PriorityRank` and freezes lower-priority proposals once the ScenarioCap is exceeded.

### KPI Alignment

- Finance Manager allocation KPIs now compute caps from `DepartmentAllocations` (fallback to `AnnualBudgetCap`) and use `RequestedAmount` for totals.

## 14. ML Forecasting Engine — AI Forecasting Tab (Session 11)

**Overview:** Connected the Finance Manager "AI Forecasting" tab to a real Random Forest ML model served via Python FastAPI.

### Architecture

- **Python ML Microservice:** `NexaPlan.API/ml_service/main.py` — FastAPI on port 8001.
  - Loads `nexaplan_rf_model.pkl` (scikit-learn Pipeline: scaler + OHE + RandomForestRegressor).
  - Applies **proportional scaling fix**: model was trained on budgets ≤ ₱19,985; larger real-world budgets are capped to `TRAINING_MAX`, prediction is scaled back up by `real_budget / TRAINING_MAX`.
  - Inputs: `Budgeted_Amount` (float), `Department` (string), `Month` (3-letter string e.g. "JAN").
  - Output: `predicted_spending`, `variance_amount`, `variance_pct`, `risk_level`.
  - Model performance: R² = 0.8166, MAE = 0.1426 (log scale).
  - Run: `uvicorn main:app --host 0.0.0.0 --port 8001 --reload`

- **New .NET Controller:** `Controllers/FinanceManager/FinanceManagerForecastController.cs`
  - Route: `GET /api/finance-manager/forecast?fiscalYear=2026`
  - Inherits `FinanceManagerBaseController` (takes `AppDbContext context` via constructor).
  - Loads departments from `_context.Departments` (filtered by `TenantID`).
  - Budget source: `DepartmentAllocations.TotalAllocatedCap` for the fiscal year, falls back to `Department.AnnualBudgetCap`.
  - Makes 12 HTTP POST calls per department to `http://localhost:8001/predict` (one per month).
  - Auto-generates AI insight cards (warning / optimization / success) based on risk levels.
  - `IHttpClientFactory` is used (already registered via `builder.Services.AddHttpClient()` in `Program.cs`).

- **New DTOs:** `DTOs/ForecastDtos.cs`
  - `MlPredictRequest`, `MlPredictResponse`, `MonthForecastDto`, `DeptForecastDto`, `InsightDto`, `ForecastSummaryDto`

- **Frontend API:** Appended to `src/api/financeManagerApi.ts`
  - Types: `MonthForecast`, `DeptForecast`, `ForecastInsight`, `ForecastSummary`
  - Function: `getForecastSummary(fiscalYear)` — uses existing `apiFetch` helper (X-Tenant-Id / X-User-Id headers, no JWT Bearer token).

- **Frontend View:** `src/app/(roles)/finance-manager/views/ForecastingView.tsx`
  - Added `useEffect` to call `getForecastSummary(2026)` on mount.
  - All 3 hardcoded data arrays (`forecastData`, `varianceData`, `aiInsights`) replaced with derived computed values from API response.
  - Loading spinner shown while fetching.
  - KPI cards, model accuracy %, variance chart, and AI insights now show live ML-powered data.
  - All JSX structure and Tailwind classes preserved — only data source changed.

### Critical Implementation Notes

- `AppDbContext` is the correct DbContext name (NOT `NexaPlanDbContext`).
- Department PK is `DepartmentID`, Tenant FK is `TenantID`, name field is `DepartmentName`.
- `DepartmentAllocation` PK is `AllocationID`, FKs are `DepartmentID` and `TenantID`.
- `Department` model has NO `IsArchived` field — do not filter on it.
- `builder.Services.AddHttpClient()` was already present in `Program.cs` line 18 before this session.
- The `requirements.txt` uses unpinned versions (no version pins) to support Python 3.13.

## 15. Monthly Budget Planning & Variance Analytics (Session 12)

**Overview:** Upgraded the financial engine to support monthly planning precision, tying `PlannedMonth` and `PlannedYear` to `BudgetProposals` and `Expenses` for granular tracking.

### Architecture Updates

- **Models:**
  - `BudgetProposal`: Added `PlannedMonth` (string, e.g., "JAN") and `PlannedYear` (int) to allow Dept Heads to schedule spending in specific periods.
  - `Expense`: Added `ExpenseDate` (DateTime) to track exactly when funds were incurred during reconciliation.
- **Backend Controllers:**
  - `DeptHeadProposalsController`: Updated DTOs and creation logic to accept `PlannedMonth` and `PlannedYear` alongside line items.
  - `FinanceManagerApprovalsController`: Surfaced planned time context for Finance Manager review.
  - `FinanceManagerForecastController`: Upgraded to utilize **actual approved monthly proposals** for predictions when available, falling back to `AnnualCap / 12` only when specific plans are absent.
  - **New Controller:** `FinanceManagerVarianceController` handles `GET /api/finance-manager/variance?fiscalYear=...&month=...` returning monthly aggregated budget vs actual.
- **Frontend Clients:** `deptHeadApi.ts` and `financeManagerApi.ts` updated with `VarianceSummary`, `DeptVariance`, and `MonthlyVariance` types.

### UI Enhancements

- **Dept Head - New Request View:** Added an optional Month & Year picker next to the Priority field.
- **Finance Manager - Variance View:** Implemented a new dropdown filter for "Full Year" vs specific months. Data fetches dynamically and reflects in the tracking table.

### Business Rules

- "Full Year" variance views sum all approved proposals and all reconciled expenses.
- Month-specific views isolate budgets strictly allocated to that month against expenses executed/linked to that month.
- ML Forecasting engine accurately scales predicted metrics using real month-allocated totals instead of flat dividing the annual cap, vastly improving projection reliability.

## 16. Corporate Treasury Model & Deterministic Forecasting (Session 16)

**Overview:** Shifted the AI Forecasting tab from a purely ML-predictive model to a **deterministic Treasury View** backed by real DB data, with ML repositioned as a risk-advisory and anomaly-detection layer.

### Architecture Changes

#### Backend — `FinanceManagerAnalyticsController.cs` (complete rewrite)

- Route: `GET /api/finance-manager/forecast?fiscalYear=2026`
- **Four data lines** are now calculated and returned in `chartData[]`:
  | Field | Source | Meaning |
  |---|---|---|
  | `actual` | `Expenses.ExpenseDate` (SpentDate) | Real reconciled spend by receipt date |
  | `committed` | `BudgetProposals` (Approved, PlannedMonth) | Sum of approved proposals per month |
  | `upperBound` | Approved + Pending proposals | Worst-case if all pending proposals approved |
  | `trendLine` | Python `/forecast/trend` or `/forecast/moving-average` | Statistical trend forecast for future months |
- **ML Risk Dots**: For each dept × month, calls `/predict` on the RF model. Returns `mlPredictedSpending` and `mlRiskLevel` (Low/Medium/High) — used as overlay signals, never as the primary line.
- **Trend method selection**: ≥6 months of data → Weighted Moving Average; 3–5 months → Linear Trend (OLS); <3 months → no trend line rendered.
- **`monthsOfData`** and **`hasEnoughData`** fields tell the frontend when to show the trend line and advisory banner.
- **Insight generation** uses `mlRiskLevel` (from RF model) instead of the old deterministic variance threshold.

#### Backend — `FinanceManagerVarianceController.cs` (extended)

- Added `IHttpClientFactory` injection to call `/predict` per department.
- New response fields on `DeptVarianceDto`:
  - `mlExpectedSpending`: RF model's predicted spend for that dept+period.
  - `isAnomaly`: `true` when actual spend exceeds ML expectation by >20%.
- **Dead code removed**: Eliminated the unused `expensesQuery` variable.

#### DTOs — `ForecastDtos.cs` (updated)

- `MonthForecastDto` now has 8 parameters (added `MlPredictedSpending`, `MlRiskLevel`).
- `DeptVarianceDto` now has 10 parameters (added `MlExpectedSpending`, `IsAnomaly`).
- Removed `ForecastSummaryDto` record (replaced by anonymous object return).
- Added `ChartMonthDto` for documentation clarity.

#### Python ML Service — `main.py` (already complete from Session 15)

- `/predict` — RF model for dept+month risk signals.
- `/forecast/trend` — OLS linear regression with 1.5σ confidence band.
- `/forecast/moving-average` — Weighted MA + recent 3-month trend, 1.2σ band.

#### Backend — `SuperAdminConfigController.cs`

- `PricingController` (nested in same file) correctly serves `GET /api/pricing` as a public endpoint (no auth required).
- The `BillingView.tsx` → `getPricing()` → `https://nexaplan.runasp.net/api/pricing` chain is fully wired.

### Frontend Changes

#### `ForecastingView.tsx` (complete rewrite)

- Now calls `financeManagerApi.getTrendForecast(2026)` which hits `/api/finance-manager/forecast`.
- **Chart renders 4 distinct lines:**
  - **Actual Spend** (solid blue `#2563EB`) — only plotted for months with reconciled expenses.
  - **Budget Cap** (dashed grey `#94A3B8`) — flat reference line.
  - **Committed** (solid green `#10B981`) — sum of approved proposals per month.
  - **Trend Forecast** (dashed purple `#8B5CF6`) — only rendered when `hasEnoughData === true`.
  - **Confidence Band** — `trendUpper`/`trendLower` shaded area from Python service.
- **Advisory banner** shown when `hasEnoughData === false` prompting user to reconcile expenses with receipt dates.
- **Variance by dept** table replaces the old bar chart — shows Committed, Variance, and a **ML Expected column** (purple badge) with ⚠ anomaly flag.
- KPI cards now show `projectedEOY` (sum of committed), `totalBudget` (from allocations), and `depletionRisk`.

#### `VarianceView.tsx` (extended)

- Added **ML Expected** column (purple header) between Variance and % Used.
- Shows `mlExpectedSpending` as a purple badge; shows ⚠ when `isAnomaly === true`.
- Respects the Gross/Net toggle (divides by 1.12 when net mode active).

#### `financeManagerApi.ts` (updated)

- `DeptVariance` interface extended with `mlExpectedSpending: number` and `isAnomaly: boolean`.
- `getTrendForecast(fiscalYear)` already present, calls `/forecast?fiscalYear=...`.

### Critical Field-Name Reference (verified against actual models)

| Controller Query            | Model Class            | Correct Field Name                                      |
| --------------------------- | ---------------------- | ------------------------------------------------------- |
| Reconciled expenses by date | `Expense`              | `ExpenseDate` (nullable DateTime)                       |
| Expense dept filter         | `Expense`              | `TenantID`, `DepartmentID` (direct FKs, no join needed) |
| Dept annual cap             | `Department`           | `AnnualBudgetCap`                                       |
| Dept actual spent           | `Department`           | `ActualSpent`                                           |
| Allocation cap              | `DepartmentAllocation` | `TotalAllocatedCap`                                     |
| Proposal month              | `BudgetProposal`       | `PlannedMonth` (string), `PlannedYear` (int?)           |
| Proposal amount             | `BudgetProposal`       | `RequestedAmount` (preferred), fallback `TotalAmount`   |

### Build Status

- **.NET API**: `dotnet build` → ✅ 0 errors, 0 warnings.
- **Frontend**: `npm run build` → ✅ 0 errors.
- **ML Service**: Running on `http://localhost:8001`, endpoints: `/predict`, `/forecast/trend`, `/forecast/moving-average`, `/health`.

## 18. Budget Planning, Allocation & Forecasting Improvements (Session 18)

**Overview:** Enhanced the end-to-end budget management flow from top-down company limits to bottom-up department allocations, and stabilized forecasting data mapping.

### Architecture & Backend Updates

- **Company Budget Management:**
  - `MainAdminSettingsController.cs`: Upgraded `GetSettings` and `UpdateSettings` to include `TotalCompanyBudget` (stored on the `Tenant` model). This allows Main Admins to set the global spending cap for the entire organization.
  - `MainAdminDtos.cs`: Updated `UpdateSettingsDto` to include `decimal TotalCompanyBudget`.
- **Month Resolution Logic (Forecasting & Variance):**
  - `FinanceManagerAnalyticsController.cs` & `FinanceManagerVarianceController.cs`: Refactored `ResolveMonthIndex` and `ResolveMonthLabel` to be case-insensitive and handle multiple formats (full names like "January", 3-letter abbreviations like "JAN", and numeric strings like "1"). This fixes the issue where committed spending data was incorrectly mapped or missing from the forecasting chart.
- **Allocation Context:**
  - `FinanceManagerAllocationController.cs`: Updated the `allocations` endpoint to return `totalCompanyBudget`, enabling the UI to calculate utilization relative to the global cap.

### Frontend UI/UX Enhancements

- **Main Admin - Settings:** Added a dedicated "Annual Company Budget" field in the Settings tab.
- **Finance Manager - Budget Allocation:**
  - **KPI Dashboard:** Replaced the static "Departments" count card with a "Company Budget" overview showing the total organizational pool and a real-time progress bar for global distribution.
  - **Enhanced Allocation Modal:** The "Set Department Cap" modal now provides a deep-dive context window for the selected department, showing its current allocation, actual reconciled spend, and the **Global Budget Remaining** (preventing over-allocation).
  - **Visual Feedback:** All financial inputs now include currency symbols and monospace font for better readability.

- **Stabilization & White Screen Fixes:**
  - **Frontend Resilience:** Added `safeLocale` helper and extensive null/undefined checks in `ForecastingView.tsx` and `AllocationView.tsx` to prevent runtime crashes caused by `toLocaleString()` on missing API data.
  - **API Consistency:** Updated frontend mapping to handle both camelCase and PascalCase property names for monthly forecasts.
  - **Data Visibility:** Improved the forecasting data resolution by adding `SubmittedAt.Year` as a final fallback for `FiscalYear` filters, ensuring legacy or partially-seaded data appears correctly on charts.
  - **Build Integrity:** Fixed a C# compile error in `FinanceManagerAnalyticsController.cs` related to invalid null-conditional usage on `DateTime` structs.
  - **Dynamic Year:** Switched the Finance Manager's forecasting view to default to the current calendar year instead of a hardcoded 2026.

### Business Rules
- The `TotalCompanyBudget` is the authoritative source of truth for organizational spending capacity.
- Finance Managers are guided by the "Global Budget Remaining" metric when setting department caps to ensure the organization stays within the Main Admin's defined limits.
- Forecasting now accurately maps `PlannedMonth` data regardless of whether the user enters full names or abbreviations.
- Reconciled expenses are now strictly filtered by the selected fiscal year to prevent mixing historical data into current trajectory charts.

## 20. Dynamic Pricing, Profiles & Company Settings (Session 20)

**Overview:** Modernized the platform with dynamic configuration for pricing, global user profile rendering, organization management for Main Admins, and enhanced billing visibility.

### Architecture & Backend Updates

- **Dynamic Pricing Model:**
  - Added `PricingPlan` and `PricingBenefit` models to allow Super Admins full CRUD control over subscription tiers.
  - Updated `SuperAdminConfigController.cs` with new endpoints for managing plans and benefits.
  - Refactored `PricingController.cs` to fetch active plans from the database instead of using hardcoded defaults.
- **Company Profile Management:**
  - Enhanced `MainAdminSettingsController.cs` and `Tenant` model to include `CompanyName`, `ContactPerson`, `ContactEmail`, and `Phone`.
  - Updated `MainAdminDtos.cs` to support these new organizational fields.

### Frontend UI/UX Enhancements

- **Super Admin - Pricing CRUD:**
  - Created a new "Pricing" tab in the Super Admin dashboard featuring a full-featured management interface for creating, editing, and deleting pricing tiers.
  - Supports toggle for "Most Popular" badges and "Active/Draft" status.
- **Global User Profiles:**
  - Refactored Top Navigation bars across all roles (Super Admin, Main Admin, Finance Manager, Dept Head, Auditor) to dynamically render user names, roles, and initials from the authenticated session.
- **Main Admin - Company Settings:**
  - Integrated organization management into the "Settings" tab, allowing Main Admins to update their company contact information and branding details.
- **Enhanced Billing Tab:**
  - Completely redesigned the Billing interface for Main Admins.
  - Added a visual subscription progress bar showing time remaining in the current cycle.
  - Improved renewal and countdown visibility for upcoming invoices.
  - Dynamically fetches pricing tiers for upgrade options instead of using hardcoded lists.
- **Landing Page Stabilization:**
  - Updated the public Landing Page to fetch and render pricing tiers dynamically from the API, ensuring the frontend always reflects the latest configurations set by the Super Admin.

## Session 20: System Modernization & ML Forecasting Integration
- **Dynamic Profile Integration:**
  - Updated the `User` model to include `FirstName` and `LastName` fields.
  - Refactored authentication flow to return separate name fields, enabling a personalized "Welcome, [First Name]" experience across all dashboards.
  - Standardized Top Navigation components to dynamically render user initials and full names from the auth state.
- **Superadmin Pricing Revamp:**
  - Fully integrated the dynamic Pricing CRUD interface in the Superadmin dashboard.
  - Refactored the public Landing Page's `PricingTable` to consume the new `PricingPlan` API, replacing legacy hardcoded tiers with live configurations.
- **ML Forecasting Engine:**
  - **Hybrid Routing:** Implemented a hybrid model setup in `ml_service/main.py` using both Random Forest (for `Budgeted_Amount` <= 19985) and Ridge Regression (for `Budgeted_Amount` > 19985) to correctly extrapolate beyond the training range while retaining precision for smaller budgets.
  - **Enhanced Responses:** The `/predict` endpoint now returns `model_used` and `confidence_note` alongside standard metrics and uncertainty bands (`upper_bound`, `lower_bound`). These fields are successfully wired through the .NET backend into the frontend's Variance and Forecasting views.
- **Main Admin Enhancements:**
  - Functionalized the "Company Settings" module and enhanced the "Billing" tab with live subscription tracking and renewal countdowns.


## 21. ML Prediction Clamp & Analytics Diagnostics (Session 21)

**Overview:** Fixed over-exaggerated Ridge Regression predictions and added end-to-end diagnostic logging to both the ML microservice and the .NET analytics controller.

### Issue 1 � Ridge Model Over-Prediction (Fixed)

**Root cause:** Ridge Regression, trained on log1p(Actual_Spending) from budgets <= 19985, extrapolates large log-space values for big budgets (e.g. 500000+). np.expm1() on those values can produce hundreds-of-millions outputs � model artifacts, not reality.

**Fix applied in ml_service/main.py:**
- After np.expm1(), a sanity clamp is applied:
  - Floor: predicted_spending >= Budgeted_Amount * 0.10
  - Ceiling: predicted_spending <= Budgeted_Amount * 2.00
- A print() log emitted to the uvicorn console for every /predict call:
  - Fields: model=, dept=, month=, budget=, log_pred=, raw_expm1=, clamped=
- Hybrid routing (RF <= 19985, Ridge > 19985) is unchanged.

### Issue 2 � Forecasting Chart Flat at 0 (Diagnostics Added)

**Fix applied in FinanceManagerAnalyticsController.cs:**
- Added Console.WriteLine at three key points per department per request:
  1. [ANALYTICS] Dept=X | Reconciled expenses found=N (raw DB row count)
  2. [ANALYTICS] Dept=X | Expenses matching fiscalYear=N: N month(s) with data (after year filter)
  3. [ANALYTICS] Dept=X | Approved proposals found=N | Months with committed data=N
- Added [CHARTDATA] MON: budget=X | actual=X | committed=X per month in chart builder.
- These logs appear in the dotnet run terminal to distinguish: (a) no DB rows, (b) fiscal year filter mismatch on ExpenseDate, (c) PlannedMonth format failing ResolveMonthIndex.
- ResolveMonthIndex handles JAN / January / 1 formats case-insensitively � verified unchanged.

### Build Note
- dotnet build dry run: only MSB3026/MSB3027 file-lock warnings (exe held by running dotnet run). Zero C# compilation errors. Hot-reload picks up changes automatically.

## 22. Pure Ridge Model � Raw-Dollar Predictions (Session 22)

**Overview:** Replaced the hybrid RF + Ridge setup with a single Ridge Regression model trained
natively on raw dollar values. This eliminates all log-space math and extrapolation artifacts.

### Model Change

| Old | New |
|---|---|
| nexaplan_rf_model (2).pkl + nexaplan_ridge_model.pkl (log-space) | nexaplan_ridge_model (1).pkl (raw dollars) |
| Hybrid routing: RF <= 19985, Ridge > 19985 | 100% Ridge, all budget sizes |
| np.expm1() inverse transform required | No transform � model outputs real PHP values |
| Sanity clamp (0.10 floor / 2.00 ceiling) | Removed � model is natively bounded |

### Changes in ml_service/main.py

- Removed: RF_MODEL_PATH, RIDGE_MODEL_PATH, rf_pipeline, ridge_pipeline, TRAINING_MAX
- Added: MODEL_PATH = 'nexaplan_ridge_model (1).pkl', pipeline = joblib.load(MODEL_PATH)
- /predict try block: single pipeline.predict(row)[0], no if/else routing, no expm1()
- Risk thresholds updated to utilization-based: >= 92% High, >= 78% Medium, else Low
- Console log simplified: [PREDICT] model=Ridge | dept= | month= | budget= | predicted=
- /health updated: reports Ridge Regression (raw-dollar, v1) only
- DEPT_VOLATILITY and MONTH_RISK retained for upper/lower confidence bands
- All /forecast/trend and /forecast/moving-average endpoints unchanged

### Business Rules

- The new Ridge model scales proportionally for any budget size (no training ceiling)
- Risk classification uses utilization % (predicted / budget * 100), not variance %
- variance_amt and variance_pct are still returned in the response for UI display

## 23. Risk Threshold Recalibration & YTD Anomaly Fix (Session 23)

**Overview:** Two targeted bug fixes � corrected false-positive High Risk warnings caused by
miscalibrated thresholds, and fixed the isAnomaly flag in Full Year variance view that was
comparing YTD actual spend against a single-month ML prediction.

### Fix 1 � Utilization Risk Thresholds (ml_service/main.py)

The new raw-dollar Ridge model accurately predicts ~99% budget utilization (departments
naturally spend nearly their full allocation). The old thresholds (92/78) triggered constant
false-positive High/Medium alerts.

New thresholds:
- >= 100% utilization -> High   (maxing out or overspending)
- >= 95% utilization  -> Medium (normal use-it-or-lose-it zone)
- < 95% utilization   -> Low    (safely under budget)

Only the three threshold numbers changed. No model, routing, or response shape changes.

### Fix 2 � Full Year isAnomaly False Positives (FinanceManagerVarianceController.cs)

Root cause: The Full Year view compared accumulated YTD ActualSpent (e.g. 5 months of spend)
against a single ML prediction for December � an apples-to-oranges comparison that always
triggered isAnomaly.

Fix logic:
- Full Year view (filterMonth == null): loops over all elapsed months of the fiscal year
  (1 to DateTime.Now.Month if current year, else 1-12 for past years), calls GetMlExpected()
  for each month using cap/12 as the monthly budget probe, sums the results into ytdMlTotal.
  isAnomaly is then computed as: (actualSpent - ytdMlTotal) / ytdMlTotal > 20%.
- Single month view (filterMonth != null): unchanged � one ML call, compare to that month's actual.

This makes the YTD ML expected spending scale proportionally with time elapsed in the year,
preventing the false-positive anomaly flags that appeared in the Full Year dashboard view.

## 24. Live Currency Serialization & Hybrid Model Fix (Session 24)

**Overview:** Implemented a real-time USD/PHP currency fetcher and fixed the np.expm1() extrapolation bug for the raw-dollar Ridge model.

### Currency Layer
- Added 
equests to 
equirements.txt and fetched live rates from open.er-api.com with a 58.0 fallback.
- Budgets are converted from PHP -> USD, routed to models, and predicted USD is converted back to PHP.

### Model Routing Fix
- **Random Forest:** Handled as log-space (
p.expm1(log_pred)) for budgets between $5,000 and $19,000 USD.
- **Ridge Regression:** Corrected to handle 
exaplan_ridge_model (1).pkl as raw-dollar output (removed 
p.expm1() inversion to prevent exponentially huge miscalculations).

## 25. Hybrid Insight Engine & Relaxed Risk Thresholds (Session 25)

**Overview:** Fixed two major presentation issues — conflicting forecast insights in the C# analytics controller and over-sensitive risk flags on the Seasonal Risk Calendar.

### Change 1 — Hybrid Insight Engine (FinanceManagerAnalyticsController.cs)

Replaced the old GenerateInsights() method (which could produce simultaneous conflicting insights like ''reallocate funds'' AND ''overrun risk'' for the same department) with a mutually exclusive 3-rule engine:

| Rule | Trigger | Output Type | Title |
|---|---|---|---|
| Critical Overrun | ML risk High/Medium AND DB utilization >= 75% | Warning | Budget Overrun Risk — {Dept} |
| Late Surge | ML risk High/Medium AND DB utilization < 75% | Caution | Hidden Burn Rate — {Dept} |
| Safe Reallocation | ML risk Low AND DB utilization < 60% | Opportunity | Safe Reallocation — {Dept} |

- DB utilization is computed live as: Sum(approved proposals) / AnnualBudget * 100
- Dominant ML risk for the dept is derived from all monthly ML risk signals (High > Medium > Low)
- safeToMove estimate = AnnualBudget * (1 - utilization%) * 0.5
- All insights now use Source: 'Hybrid (DB + ML)'

### Change 2 — Relaxed Seasonal Risk Calendar Thresholds (ml_service/main.py)

Previous tight thresholds were producing too many false-positive High (Red) flags due to PHP→USD→PHP currency conversion amplifying small prediction errors.

New thresholds:
- predicted >= budget * 1.05 → High (only fires if mathematically 5%+ over budget)
- upper_bound >= budget * 1.15 → Medium (worst-case volatility breaches +15% buffer)
- else → Low (default Green for normal stable behaviour)
