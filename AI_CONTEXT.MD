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

## Recent Automation Log

- **Date:** 2026-05-14
- **Actions performed by automation:**
  - Centralized backend external service base URLs in `appsettings.json` (`ExternalServices: MlService`, `PayMongo`).
  - Introduced named `HttpClient` usage across backend: `MlService`, `PayMongo`.
  - Centralized frontend API base via Vite env `VITE_API_BASE_URL` and refactored client call sites to use `src/config/api.ts`.
  - Fixed syntax corruption in `NexaPlan.API/Controllers/FinanceManager/FinanceManagerApprovalsController.cs` (removed stray statements and consolidated `MlService` client usage).
  - Built frontend successfully (`nexaplan-client` production build) and validated no runtime hard-coded `nexaplan.runasp.net` calls remain.
  - Sanitized plaintext secrets in `NexaPlan.API/appsettings.json` and added `NexaPlan.API/appsettings.example.json` with placeholders.
  - Added `NexaPlan.API/appsettings.json` to `.gitignore` and removed it from tracking in the next commit (so secrets should be stored via user-secrets or environment variables).

- **Important security note:** The repository previously contained plaintext secrets in history (appsettings). The automation removed them from the current HEAD by replacing values with placeholders, but the secrets still exist in the git history. If you want those secrets purged from the repository history, I can help run a history rewrite (BFG or git filter-repo) — note that rewriting history requires coordination for any collaborators and force-pushing the branch.

## Session 36: Dashboard Layout & Data Integrity Fixes

**Overview:** Fixed Main Admin dashboard layout issues, resolved case-sensitivity bugs in plan/tier comparisons, and corrected the Audit Log CSV export.

### UI & Layout Refactoring
- **Main Admin Settings:** Completely refactored the Settings tab into a balanced 2-column grid (grid-cols-1 xl:grid-cols-2). Eliminated the "left-heavy" layout and excessive whitespace on the right. Grouped "Company Information" and "Fiscal Year" on the left, and "Security Policy" and "Email Notifications" on the right.
- **Subscription Metadata:** Added a dedicated wide-panel footer for "Subscription & Infrastructure" identifiers.
- **Save Bar:** Implemented a persistent, floating "Save Changes" bar at the bottom of the Settings tab for better accessibility.

### Data Integrity & Tier Gating
- **Plan Case-Insensitivity:** Fixed bugs where feature gating or UI highlights failed because plan names were stored in lowercase in the database.
  - **Frontend:** Updated `PricingTable.tsx`, `BillingTab.tsx`, and `SettingsTab.tsx` to use `.toLowerCase()` when comparing tiers (e.g., `plan.toLowerCase() === 'starter'`).
  - **Display:** Ensured the UI always shows tiers in Title Case (e.g., "Professional") regardless of database casing.
- **Pricing Table Alignment:** Removed manual `toLowerCase()` transformations in `onSelectPlan` calls to ensure the canonical plan name is passed throughout the system.

### Audit Log & API Corrections
- **CSV Export Fix:** Corrected the Audit Log export in `LogsTab.tsx` to use the `apiUrl` helper. Previously, the relative path caused the fetch to hit the Vite dev server (returning HTML) instead of the .NET backend. The export now correctly streams the CSV file from the `MainAdminLogsController`.

**Next recommended steps:**
-   Ensure all future tier-based checks continue to use the `TierFeatures.cs` backend helper or case-insensitive frontend comparisons.

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

## Session 26: Hybrid Model Revamp & Proportional Scaling

- **Hybrid Model Logic:**
  - Revamped `ml_service/main.py` to correctly route budgets based on a $19,985.0 USD threshold.
  - Budgets <= $19,985 USD route to `RandomForest`; budgets > $19,985 USD route to `Ridge`.
  - **Transformation Fix:** Corrected an earlier assumption. `nexaplan_rf_model (2).pkl` is log-space trained (requires `np.expm1()`), while `nexaplan_ridge_model (1).pkl` was explicitly retrained on raw dollars (requires NO `expm1()`). Applied the correct transformations to each model respectively.
- **Proportional Scaling (RF Floor):**
  - Discovered that the RF model clamps its output identically for any budget beneath its minimum training sample (~$5,000 USD). This caused massive inflation for small PHP budgets converted to USD.
  - Implemented a **Proportional Scaling** fallback: For USD budgets < $5,000, the budget is temporarily scaled up to $5,000 to get a prediction, then the resulting prediction is scaled back down proportionately. This guarantees realistic, linear scaling for micro-budgets without breaking the RF model.
- **C# Controller Integration Fix:**
  - Fixed an issue in `FinanceManagerVarianceController.cs` where the full-year YTD loop was using `annualCap / 12` as the budget probe instead of the actual `plannedBudget / months`. This ensures ML expected spending aligns with the department's actual monthly run rate, preventing artificially inflated variances for departments with small proposals.
- **Risk & Thresholds:**
  - Re-calibrated risk levels to utilization-based: High (>=110%), Medium (>=90%), Low (else).
- **Metadata:**
  - Updated `/health` endpoint and `/predict` response (`confidence_note`) to accurately describe the hybrid architecture.

## Session 27: Scenario Planning Engine — Department Head (Full Implementation)

**Overview:** Built the full Scenario Planning feature for Department Heads — connecting real DB proposals to Finance Manager scenarios, enabling formal Scenario Pitches, and integrating an active-scenario alert into the Overview tab.

### Backend — `DeptHeadScenariosController.cs` (Rewritten)

Three new endpoints added; two legacy endpoints (`/scenarios`, `/scenarios/preview`) kept intact:

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/dept-head/scenarios` | Existing | Returns non-archived tenant scenarios. Fixed to use `title` field and filter `IsArchived=false`, ordered active-first |
| `GET /api/dept-head/scenarios/active` | Existing | Returns active scenario or Base Case default |
| `GET /api/dept-head/scenarios/impact?multiplier=&fiscalYear=` | **NEW** | Core calculation: resolves dept budget cap (DepartmentAllocations → AnnualBudgetCap fallback), walks proposals in PriorityRank order (null=4), assigns Survives/AtRisk |
| `POST /api/dept-head/scenarios/pitch` | **NEW** | Saves dept head's formal pitch. Creates a new `BudgetScenario` row scoped to dept (IsActive=false). Decisions stored as JSON prefix in Description. Writes AuditLog entry |
| `GET /api/dept-head/scenarios/pitches` | **NEW** | Returns all pitch records for this dept (identified by `[PITCH_DECISIONS]` marker in Description) |

**DTOs added (in same file):** `PitchDecisionDto`, `ScenarioPitchDto`

**Pitch storage strategy:** No migration needed — pitches reuse `BudgetScenario` with `DepartmentID` scoped, `IsActive=false`, decisions JSON embedded in `Description` as `[PITCH_DECISIONS]{json}[/PITCH_DECISIONS]{justification}`, and linked scenario ID stored in `TargetYear`.

**Build status:** Zero C# compilation errors. MSB3026/3027 file-lock warnings only (API exe in use by running server — hot-reload picks up changes).

### Frontend — `deptHeadApi.ts` (Updated)

Added full TypeScript interfaces: `ScenarioSummary`, `ProposalImpact`, `ScenarioImpactResult`, `PitchDecision`, `ScenarioPitchRequest`, `SubmittedPitch`.

New API functions:
- `getScenarios()` — now typed as `ScenarioSummary[]`
- `getActiveScenario()` — returns `ScenarioSummary`
- `getScenarioImpact(multiplier, fiscalYear)` — `GET /scenarios/impact`
- `submitScenarioPitch(payload)` — `POST /scenarios/pitch`
- `getMyPitches()` — `GET /scenarios/pitches`

### Frontend — `ScenariosView.tsx` (Full Rebuild)

**Two-panel layout:**
- **Left panel:** Finance Manager scenario cards (clickable, color-coded: orange=cut, green=growth, indigo=base) + custom slider (±50%) with 400ms debounce before `/impact` call
- **Right panel:** Proposal impact table showing Priority, Title, Amount, Status, Scenario Status (✅ Survives / ⚠ At Risk), and Your Decision dropdown (AtRisk rows only)

**Key behaviors:**
- Clicking a scenario card immediately fetches impact at that multiplier
- Slider debounce: 400ms after stop before API call
- Submit Pitch button enabled only when ≥1 AtRisk proposal has a decision selected
- Pitch modal: PitchTitle input + Justification textarea (min 50 chars validation) + read-only Decision Summary list
- On success: toast notification + button changes to "📋 Pitch Submitted — View Response"
- Past Pitches accordion at bottom (collapsible) showing all submitted pitches with status badges
- Zero `window.alert()` / `window.confirm()` — all feedback via toast + modal

### Frontend — `OverviewView.tsx` (Extended)

Added dept-specific restrictive scenario banner:
- Fetches active scenario on mount alongside existing overview/risk data
- If `adjustmentMultiplier < 1.0`: renders an orange warning banner showing scenario name, reduction %, and at-risk proposal count
- "Review in Scenario Planning →" link calls `onNavigateToScenarios` prop (passed from orchestrator)
- Banner does NOT render for base-case or growth scenarios

### Frontend — `DepartmentHeadSystem.tsx` (Fixed)

- Fixed global banner field names: `multiplier` → `adjustmentMultiplier`, `name` → `title` (aligned with new API response shape)
- Passes `onNavigateToScenarios={() => setActiveModule('scenarios')}` to `OverviewView`

## Session 28: Scenario Pitch Data Architecture Fix

**Overview:** Fixed a critical bug where Department Head scenario pitches were being saved into the Finance Manager's `BudgetScenarios` table, cluttering the global dashboard and leaking raw JSON.

### Database Updates
- **New Model:** Created `ScenarioPitch` to isolate Dept Head pitches from FM scenarios.
- **Migration:** Added `AddScenarioPitches` EF Core migration.
- **Data Cleanup:** Inserted a startup `ExecuteSqlRaw` task in `Program.cs` to automatically delete any garbage `BudgetScenario` rows containing `[PITCH_DECISIONS]` or `ProposalId`.

### API Updates (`DeptHeadScenariosController.cs`)
- **`SubmitPitch`:** Rewritten to use `_context.ScenarioPitches.Add(...)` instead of writing to `BudgetScenarios`. Saves decisions directly to `PitchDecisions` as a JSON string.
- **`GetMyPitches`:** Refactored to query `ScenarioPitches`. Includes a Left Join equivalent using `_context.BudgetScenarios` to resolve the `ScenarioTitle` if the pitch is linked to a specific FM scenario.

**Mental Model Enforced:**
- `BudgetScenario`: Finance Manager's global scenario tool. Dept Heads never write here.
- `ScenarioPitch`: Dept Head's response/submission. Linked via `ScenarioId` but stored separately.

### Finance Manager UI & API (Pitches Inbox)
- **API Endpoints:**
  - `GET /api/finance-manager/scenarios/{scenarioId}/pitches`: Retrieves all Dept Head pitches for a given scenario.
  - `POST /api/finance-manager/scenarios/pitches/{pitchId}/acknowledge`: Updates a pitch's status to "Acknowledged" and logs an audit event.
- **UI Enhancements:**
  - Added `pitchCount` property to the base `GET /api/finance-manager/scenarios` payload.
  - The Finance Manager's `ScenariosView` now renders a "Review Dept Pitches (N)" button on scenario cards that have pending pitches.
  - Clicking the button opens a modal displaying each department's justification and granular proposal keep/cut/defer decisions.
  - Fixed a UI crash during Scenario Archiving caused by a missing lucide-react icon import.

## Session 29: Subscription Tier Feature Gating & Pricing Revamp

**Overview:** Implemented platform-wide feature gating based on subscription tiers (Starter, Professional, Enterprise, Trial), updated pricing descriptions to match actual system capabilities, and streamlined the Super Admin dashboard.

### Feature Gating Architecture

- **Backend Logic (`TierFeatures.cs`):** Centralized all tier-based logic in a new helper class.
  - **ML & Forecasting:** Restricted to Professional and Enterprise. Enterprise-only features: Confidence Bands and Anomaly Detection.
  - **Scenario Planning:** Restricted to Professional and Enterprise.
  - **Resource Caps:** Starter=5 depts/3 users, Professional=unlimited depts/15 users, Enterprise=unlimited, Trial=3 depts/10 users.
  - **Data Retention:** History months restricted by tier (Starter=12, Pro=24, Enterprise=unlimited).
- **Frontend Integration (`FeaturesContext.tsx`):** Created a global context to store active feature flags, loaded once per session in the main role orchestrators.
- **UI Gating:**
  - **Upgrade Banners:** Integrated a standardized `UpgradeBanner` component that blocks restricted modules (Forecasting, Scenarios) with a "locked" state and a call-to-action to upgrade.
  - **Surgical Gating:** Dynamically hid specific UI elements like the "ML Expected" column in the Variance view and Confidence Bands in charts based on the organization's tier.

### API Guardrails & Security

- **Main Admin Guard:** `MainAdminSettingsController` now returns a `features` payload containing all active flags.
- **Resource Limits:** `POST` endpoints for creating Departments, Users, and Scenarios now enforce tier-specific maximums and return user-friendly 400/402 error messages.
- **Data Filtering:** Historical charts and variance tables now apply a `cutoffDate` filter in the SQL query based on the tier's data retention limit (e.g., Starter only sees the last 12 months).
- **PayMongo Security:** Moved all payment gateway credentials (Secret Key, Webhook Secret) out of the database and into the server-side `appsettings.json`. The `PaymentsController` now strictly uses server-side configuration to prevent exposure of sensitive keys through the management dashboard.

### Pricing & Admin UX

- **Pricing Table Revamp:** Updated `DemoDataSeeder.cs` and the default `PricingController` fallback to reflect the new feature set. Removed "Custom model training" and updated AI feature descriptions to match the actual system implementation.
- **Super Admin Cleanup:** Removed the redundant "SaaS Pricing Configuration" panel from the Super Admin's Billing tab, consolidating all pricing management into the dedicated "Pricing" tab.

### Business Rules (Updated)

| Feature | Starter | Professional | Enterprise | Trial |
| :--- | :--- | :--- | :--- | :--- |
| Max Departments | 5 | Unlimited | Unlimited | 3 |
| Max Users | 3 | 15 | Unlimited | 10 |
| AI Risk Forecasting | ❌ | ✅ | ✅ | ❌ |
| Confidence Bands | ❌ | ❌ | ✅ | ❌ |
| Anomaly Detection | ❌ | ❌ | ✅ | ❌ |
| Scenario Planning | ❌ | ✅ | ✅ | ❌ |
| Historical Data Range | 12 Mo | 24 Mo | Unlimited | 12 Mo |
| Scenario Pitching | ❌ | ✅ | ✅ | ❌ |

## Session 30: Core Stability & UX Bug Fixes

**Overview:** Addressed several critical bugs related to the default landing experience, registration state management, and Super Admin governance tools.

### Stability & Routing

- **Default Home Policy:** Modified `App.jsx` to force the Landing Page as the default entry point, even if a user session exists. This prevents the system from "trapping" users in a dashboard and allows them to view the marketing site first.
- **Session Persistence UI:** Integrated `isLoggedIn` detection into `LandingPage.tsx`, adding a "Return to Dashboard" shortcut that appears only for authenticated users.
- **Back-Loop Prevention:** Implemented `window.history.replaceState` in the Registration Success flow. This wipes the PayMongo redirect from the browser's history stack, ensuring that hitting the "Back" button doesn't force a re-checkout or loop the user.

### Registration & Data Integrity

- **Stale Record Cleanup:** Updated `PaymentsController.cs` to automatically detect and purge "orphaned" tenants/users with `PendingPayment` status if the same email attempts a fresh registration. This fixes the "Account already exists" error for users whose first checkout attempt failed.
- **Credential Sync:** Fixed a critical bug in the Checkout flow where the `User.Email` field was left null, causing subsequent login attempts to fail with "Email not found".
- **Robust Login:** Hardened `AuthController.cs` with null-safe string comparisons and fallback searches (checking both `Email` and `Name` fields) to guarantee successful login for all account types.

### Super Admin Improvements

- **Tenant Governance:** Fixed the "Edit" button in the Tenants list by correcting prop interfaces and state management. Super Admins can now reliably open the Advanced Tenant Editor.
- **Security Hardening (Finalized):** Verified that all gateway secrets are strictly server-side (`appsettings.json`) and removed all remaining UI entry points for sensitive credentials.

## Session 31: Session Security & Centralized Logout

**Overview:** Fixed a critical session persistence bug where users were "trapped" in a role (specifically Finance Manager) even after logout.

### Architectural Correction

- **Centralized Logout Handler:** Refactored `App.jsx` to own the definitive `handleLogout` logic. This function now explicitly:
  - Wipes `localStorage.user` and `localStorage.token`.
  - Resets the `currentUser` global state.
  - Forces a full page reload (`window.location.href = '/'`) to purge any remaining in-memory state or context providers.
- **Prop-Based Delegation:** Replaced the loosely-named `onBack` prop with a strict `onLogout` prop across all role-based system orchestrators.
- **TopNav Synchronization:** Updated every role-specific navigation component (Super Admin, Main Admin, Finance Manager, Dept Head, Auditor) to consume the `onLogout` prop. This ensures that clicking "Logout" in any dashboard triggers a platform-wide session clearance.
- **Removed Debug Shortcuts:** Purged the insecure role-switching buttons from the Landing Page footer that were allowing unauthenticated access to dashboards.

## Session 32: Instant State-Based Logout Fix

**Overview:** Resolved persistent session issues where users (specifically Finance Managers) were trapped in their dashboards after logging out.

### Architectural Correction

- **React State vs. Hard Reload:** Replaced `window.location.href = '/'` with a pure React state update in `handleLogout`. By explicitly relying on `setCurrentView('landing')` and `setCurrentUser(null)` rather than forcing a browser-level reload, the logout process is now instantaneous, avoiding browser cache traps and Service Worker conflicts that could accidentally resurrect the previous session. Guaranteed to fully wipe the UI without relying on browser navigation.

## Session 34: Enhanced Governance & Analytics Expansion

**Overview:** Improved budget proposal workflows for Dept Heads, added flexible allocation tools for Finance Managers, fixed tier-gating bugs, and ported AI analytics to the Main Admin dashboard.

### Dept Head Governance

- **Proposal Editing:** Implemented the "Edit" function for budget proposals. Dept Heads can now modify proposals with `Draft` or `ChangesRequested` status. The system transitions them to the `NewRequestView` in edit mode, fetches existing data/line-items, and allows resubmission.
- **Backend Guard (hardened):** The `UpdateProposal` endpoint now correctly validates the new requested amount against the departmental ceiling, excluding the original proposal's value from the "committed" check to prevent false-positive over-budget errors during edits.

### Finance Manager & Tier Stability

- **Case-Insensitive Tier Gating:** Fixed a bug where ML features were missing for "Enterprise" plans because the database stored the tier in lowercase. Updated `TierFeatures.cs` to use case-insensitive string comparisons for all feature access checks.
- **Flexible Budget Allocation:** Added a new "Adjust Allocation" tool. Finance Managers can now choose to **Add to**, **Subtract from**, or **Set** a department's budget cap directly. This is safer and more intuitive than the previous "set total only" method.
- **Audit Logging (Adjustments):** Every budget adjustment now records a detailed audit log entry including the mode (Add/Sub) and the exact peso amount shifted.

### Main Admin & Billing UX

- **Ported AI Forecasting:** Brought the full "AI Forecasting & Spending Projections" engine to the Main Admin dashboard. Main Admins now see organization-wide burn rates, AI confidence bands, and per-department risk heatmaps.
- **Billing Intelligence:** Fixed the "Next Due Date: N/A" bug. The system now intelligently calculates the renewal date based on the latest paid invoice or organization creation date if no pending invoice is currently active.
- **Stability Fixes:** Resolved backend compilation errors in `TierFeatures.cs` and `FinanceManagerAllocationController.cs` caused by syntax remnants. Standardized data structures across FM and Main Admin analytics for 100% UI consistency.


## Session 35: Multi-Currency, Hybrid ML & Settings Completion

**Overview:** Implemented a platform-wide multi-currency system, revamped the ML microservice with a hybrid model, and finalized the Main Admin settings and audit governance tools.

### ML Microservice Hybrid Revamp
- **Hybrid Routing:** Revamped `ml_service/main.py` to route budgets based on a $19,985.0 USD threshold.
  - **Random Forest:** Used for budgets ≤ $19,985 USD (trained on log-space, uses `np.expm1()`).
  - **Ridge Regression:** Used for budgets > $19,985 USD (trained on raw dollars, no inversion).
- **Live Exchange Rates:** Added `/currency/rates` endpoint to fetch real-time USD/PHP rates from `open.er-api.com` with a 1-hour cache and hardcoded fallbacks.
- **Enhanced Diagnostics:** `/predict` now returns `model_used` and `confidence_note` explaining the routing decision.
- **Risk Thresholds:** Calibrated to utilization-based: High (≥110%), Medium (≥90%), Low (else).

### Multi-Currency System (Frontend)
- **Currency Context:** Created `src/context/CurrencyContext.tsx` providing a global `fmt()` function and `symbol` state.
- **App Integration:** Wrapped all role-based dashboards in `App.jsx` with `CurrencyProvider`. Dashboard orchestrators (like `MainAdminSystem`) now call `setCurrency()` based on tenant settings.
- **Dynamic UI:** Systematically replaced hardcoded "₱" symbols and manual `.toLocaleString()` calls with dynamic `fmt()` formatting across Overview, New Request, Forecasting, Reconciliation, Billing, and Variance views.

### Settings & Governance
- **Main Admin Settings Completion:**
  - **Security Policy:** Added configurable Session Timeout, Minimum Password Length, and Failed Login Lockout Threshold.
  - **Notification Preferences:** Implemented JSON-stored email alert toggles (Budget Overrun, Scenario Activation, etc.) on the `Tenant` model.
  - **Subscription & Data:** Added a read-only section for Plan Tier, Data Retention limits, and Organization ID.
- **Organization Type Consolidation:** Removed the "Government" organization type from Super Admin and registration flows. All new tenants are hardcoded as "Corporate" using the "Department" label. Added `OrgLabel` and security fields to the `Tenant` model.
- **Professional Audit Export:**
  - **Backend Engine:** Created `MainAdminLogsController.ExportCsv` which generates a professional, categorized Audit Trail CSV with Action Codes, Entity Types, and IP tracking.
  - **Frontend Wiring:** Replaced the local JSON-to-CSV logic in `LogsTab.tsx` with a direct call to the new professional export endpoint.

### Critical Implementation Reference
- **Model Files:** `nexaplan_rf_model (2).pkl` (log-space) and `nexaplan_ridge_model (1).pkl` (raw-dollar).
- **Tenant Model Additions:** `SessionTimeoutMinutes`, `MinPasswordLength`, `MaxFailedLoginAttempts`, `NotificationPreferences`, `OrgLabel`.
- **Role IDs:** Finance Manager (3), Department Head (4) — verified in DB seeding.
- **Base Currency:** PHP is the authoritative system currency; all DB values are stored in PHP.

## Session 37: Security Policy & Notification System Implementation

**Overview:** Finalized the implementation of the global security policy parameters (MaxFailedLoginAttempts, MinPasswordLength, SessionTimeoutMinutes) and the tenant-wide Notification System.

### Security Policy
- **Failed Login Lockout:** Implemented in AuthController. If a user fails to log in according to their tenant's MaxFailedLoginAttempts (default 5), their account IsLocked flag is set to true.
- **Password Length Validation:** Implemented in AuthController (Registration) and MainAdminUsersController (Temp Password Resets). The MinPasswordLength setting is evaluated before hashing new passwords.
- **Session Timeouts:** Enforced via App.jsx in the frontend using the sessionTimeoutMinutes payload returned by /api/Auth/login. An inactivity timer resets on mouse/keyboard events and logs the user out automatically when expired.

### Global Notification System
- **Dispatcher Helper:** Created NexaPlan.API/Helpers/NotificationDispatcher.cs which evaluates the NotificationPreferences JSON string stored in the Tenant database.
- **Trigger Hooks:** IConfiguration injected into multiple controllers to trigger SMTP emails based on user toggles:
  - emailOnUserInvited -> Triggered in MainAdminUsersController.
  - emailOnProposalSubmitted -> Triggered in DeptHeadProposalsController.
  - emailOnReconciliationCleared -> Triggered in FinanceManagerExpensesController.
  - emailOnBudgetOverrun -> Triggered in FinanceManagerExpensesController when an expense pushes the department ActualSpend above its allocated Cap.
  - emailOnScenarioActivated -> Triggered in FinanceManagerScenariosController.


## Session 38: ML Prediction Fix (Gemini CLI Regression)

**Overview:** Reverted a regression introduced by Gemini CLI auto-acceptance that broke the hybrid ML model predictions.

### Root Cause
The Gemini CLI modified ml_service/main.py and incorrectly applied 
p.expm1() to BOTH model branches in the hybrid /predict endpoint. The Ridge model (
exaplan_ridge_model (1).pkl) was retrained on raw-dollar values in Session 24 and does NOT require the log-inverse transform. Applying expm1() to its already-raw output produced astronomically inflated predictions (e.g., returning billions of PHP for a ?2M budget).

### Fix Applied
- **RF branch (budget_usd <= 19985):** Kept 
p.expm1(log_pred) � correct, RF is log1p-space trained.
- **Ridge branch (budget_usd > 19985):** Removed 
p.expm1() � Ridge outputs raw USD directly.
- **Proportional scaling restored:** For RF when udget_usd < 5000, prediction is made at the ,000 floor then scaled back by udget_usd / 5000 to prevent RF floor saturation on micro-budgets.
- **Console logging added:** Each /predict call now prints [PREDICT] model= | dept= | month= | budget_php= | budget_usd= | predicted_usd= | predicted_php= to the uvicorn terminal for diagnostics.

### Verified Results (live tests)
- ?500,000 / IT / MAY ? ?461,883 (RandomForest, Medium risk) ?
- ?2,000,000 / SALES / JAN ? ?1,990,986 (Ridge, Medium risk) ?
- ?10,000 / HR / MAR ? ?11,111 (RandomForest + proportional scale, High risk) ?

### IMPORTANT: DO NOT MODIFY THIS FILE WITH GEMINI CLI
The Gemini CLI has a known issue of accepting auto-rewrites of main.py that break the model transform logic. Always verify the Ridge branch does NOT use 
p.expm1() after any automated edits.


## Session 39: UI Polish & Core Mechanics

**Overview:** Addressed several UX regressions and missing functionalities in the Finance Manager dashboard to improve usability and data accuracy.

### Changes Implemented
1. **Seasonal Risk Calendar Normalization (ml_service/main.py):**
   - Increased the utilization thresholds for risk classification to High (>=115%) and Medium (>=105%). This prevents the calendar from being saturated with Red/Orange warnings and correctly displays Low risk (Green) for departments operating near a healthy 100% of their budgeted pace.
2. **Variance Cap Fix (FinanceManagerVarianceController.cs):**
   - Fixed a bug where the BudgetedAmount column was dynamically defaulting to the sum of approved proposals rather than the fixed AnnualBudgetCap. Departments (like Marketing) will now correctly display their full allocated budget (e.g., ?200,000) rather than artificially constrained values.
3. **PDF Audit Generation (VarianceView.tsx):**
   - Replaced the mock toast notification on the 1-Click Audit button with a real implementation that opens a formatted, printable HTML report and triggers window.print(), allowing Finance Managers to easily save department audits as PDFs.
4. **Master CSV Export (VarianceView.tsx):**
   - Activated the Export Master CSV button. It now serializes the current variance table data and triggers a direct browser download of Variance_Report.csv.
5. **Notification Dropdown (FinanceManagerTopNav.tsx):**
   - Wired up the previously unresponsive Bell icon. It now toggles a dropdown displaying system notifications (e.g., Pending Proposals, High Pacing Alerts) that feature clickable routing to navigate the user directly to the relevant dashboard modules.
6. **ML API Caching (inanceManagerApi.ts):**
   - Implemented an in-memory caching layer (5-minute TTL) for getForecastSummary and getVarianceData. Navigating between tabs no longer triggers redundant ML calculations. Added a cache-busting orce flag that is triggered only when the user explicitly clicks the manual 'Refresh' button on the dashboard.


## Session 40: Auditor Dashboard � Comprehensive Fix & Completion

**Overview:** Implemented a full auditor dashboard overhaul including bug fixes, missing features, and UX polish.

### Bug Fixes Applied

**Bug Fix 1 � IP Address Resolution:**
- Added GetClientIp() helper to ALL 5 base controllers (AuditorBaseController, MainAdminBaseController, FinanceManagerBaseController, DeptHeadBaseController, SuperAdminBaseController).
- Helper reads X-Forwarded-For ? X-Real-IP ? RemoteIpAddress in priority order.
- Bulk-replaced all HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown" occurrences across 10 controller files with GetClientIp().

**Bug Fix 2 � Compliance Threshold Decimals:**
- AuditorComplianceController.cs now rounds all threshold values with Math.Round(rule.Threshold, 2) before returning them in scan results.
- Frontend ComplianceScansView.tsx uses {(check.threshold ?? 0).toFixed(2)}% for all threshold displays.
- Threshold input modal uses step="0.01" and shows 	oFixed(2) preview.

**Bug Fix 3 � TaxAmount Propagation:**
- Added TaxAmount decimal? column to FinancialStatement model.
- Migration: 20260519083000_AddFinancialStatementTaxAmount.cs � auto-applies on next API restart.
- FinanceManagerExpensesController.ReconcileExpense now aggregates all reconciled TaxPaid and updates every FinancialStatement for the tenant after each reconciliation.
- AuditorStatementsController now includes 	axAmount in the GET /statements response.
- FinancialStatementsView.tsx displays real ? value or 'N/A � no reconciled expenses yet'.

**Bug Fix 4 � Global Date/Department Filter:**
- ComplianceAuditSystem.tsx now exposes a FilterContext with getDateRange() function.
- AuditTrailsView.tsx calls getDateRange() on each fetch.
- Backend GET /api/auditor/logs accepts rom, 	o, departmentId query params and applies them.
- GET /api/auditor/logs/flagged also accepts rom, 	o params.

### Missing Features Added

**Section 2 � Log Detail Side Panel:**
- Clicking any row in Audit Trails opens a slide-in right panel (440px wide).
- Shows all log fields: Log ID, Timestamp, Actor, Role, Action, Target Resource, IP Address, Status, Flagged By, Flagged At.
- Panel has Flag/Unflag action buttons. Flag opens the React modal (no window.prompt()).

**Section 3 � Flagged Entries Management:**
- New backend endpoint: GET /api/auditor/logs/flagged � returns all IsFlagged=true logs ordered by FlaggedAt DESC.
- Summary endpoint now counts real flagged entries.
- Audit Trails "Flagged Only" checkbox routes to /logs/flagged endpoint.
- Overview "Flagged for Review" KPI card is clickable � navigates to Audit Trails with flaggedOnly=true pre-filter.

**Section 4 � Compliance Deep-Link to Logs:**
- Each failing compliance rule in the scan now returns a iolationFilter object with { action, from, to, departmentId }.
- Frontend shows "View violations in Audit Trail ?" button that navigates to Audit Trails with those pre-filters.

**Section 5 � Generate Report Dropdown:**
- "Generate Report" button in nav bar now shows a dropdown with: Export Audit Trail (CSV), Export Compliance Scan (CSV), Print current view (PDF).
- Downloads trigger real file downloads via GET /api/auditor/reports/audit-trail and GET /api/auditor/reports/compliance.
- New AuditorReportController.cs at /api/auditor/reports handles all exports.

**Section 6 � Audit Trail CSV Export:**
- "Export CSV" button in Audit Trails tab exports the currently filtered/searched set.
- Uses same /api/auditor/reports/audit-trail endpoint with current filter params.

**Section 7 � Variance Summary Tab (NEW):**
- 5th tab "Variance Summary" added to the top nav.
- New backend endpoint: GET /api/auditor/variance?fiscalYear=2026 in AuditorAuditTrailController.
- Returns: departmentId, departmentName, allocatedCap, committedFunds, actualSpent, variance, utilizationPct per department.
- Also returns: totalAllocated, totalActualSpent, totalVariance.
- Frontend: VarianceSummaryView.tsx with fiscal year selector, KPI cards, color-coded table (green <75%, amber 75-90%, red >90%), and "Departments at Risk" counter.
- Read-only badge displayed in header.

**Section 8 � UX Polish:**
- 8a: Color-coded action type badges (ACTION_COLORS map with 25+ action types).
- 8b: Amber left border + background tint for flagged rows (orderLeft: '3px solid #F59E0B').
- 8c: Pagination uses real 	otal count from backend response.

### New/Modified Files

**Backend:**
- Controllers/Auditor/AuditorBaseController.cs � added GetClientIp()
- Controllers/Auditor/AuditorAuditTrailController.cs � full rewrite: date filters, flagged endpoint, variance endpoint
- Controllers/Auditor/AuditorComplianceController.cs � full rewrite: rounded thresholds, violationFilter
- Controllers/Auditor/AuditorStatementsController.cs � added taxAmount to response
- Controllers/Auditor/AuditorReportController.cs � NEW: CSV export endpoints
- Controllers/FinanceManager/FinanceManagerExpensesController.cs � TaxAmount update on reconcile
- Models/FinancialStatement.cs � added TaxAmount decimal? field
- Migrations/20260519083000_AddFinancialStatementTaxAmount.cs � NEW migration

**Frontend:**
- src/api/auditorApi.ts � extended with date/dept filters, getFlaggedLogs, getVariance, downloadReport
- ComplianceAuditSystem.tsx � full rewrite: FilterContext, export dropdown, 5th tab, preFilter navigation state
- iews/AuditTrailsView.tsx � full rewrite: side panel, action badge colors, flagged highlights, CSV export, pre-filters
- iews/OverviewView.tsx � clickable flagged card, real count
- iews/ComplianceScansView.tsx � threshold fix, violationFilter deep-link
- iews/FinancialStatementsView.tsx � taxAmount display fix
- iews/VarianceSummaryView.tsx � NEW component

### Architecture Notes
- FilterContext is a new React context exported from ComplianceAuditSystem.tsx alongside ModalContext.
- AuditorTopNav.tsx navigation is now inline in ComplianceAuditSystem.tsx (simplified).
- Zero window.alert() or window.confirm() in any auditor view.
- All CSV downloads use uditorApi.downloadReport() helper that creates a hidden <a> tag.
---

## Session: Super Admin Config & Maintenance Tabs � Full Implementation (2026-05-19)

### What Was Built
Complete implementation of the Super Admin **Config** and **Maintenance** tabs with full backend, frontend, and database wiring.

### Backend Changes

**New Model:**
- Models/MaintenanceLog.cs � NEW: LogId, Type (Success/Warning/Info/Error), Message, Detail, CreatedAt, TriggeredBy

**Database:**
- Data/AppDbContext.cs � Added DbSet<MaintenanceLog> MaintenanceLogs
- Migration: 20260519115402_AddMaintenanceLogs � Creates MaintenanceLogs table in MySQL
- Migration: 20260519101523_AddTaxAmountToFinancialStatements � Fixed TaxAmount column (fixed from AlterColumn to AddColumn)

**Controllers:**
- Controllers/SuperAdmin/SuperAdminConfigController.cs � Enhanced with:
  - Auto-seeding of 10 default config keys on GET
  - Maintenance mode special case: writes jwt_invalidate_before, creates AuditLog entry
  - Correct config keys: global_mfa_enforced, global_ssl_enforced, ml_engine_enabled, maintenance_mode, api_request_timeout_ms, max_export_rows, api_rate_limit_per_min, jwt_expiration_hours, max_failed_login_attempts, session_timeout_minutes
- Controllers/SuperAdmin/SuperAdminMaintenanceController.cs � NEW with 5 endpoints:
  - GET /maintenance/status: DB ping + latency, DB size via INFORMATION_SCHEMA, ML /health probe, simulated RAM/CPU
  - POST /maintenance/backup: upserts last_backup_time config, creates MaintenanceLog
  - POST /maintenance/clear-cache: creates MaintenanceLog
  - POST /maintenance/restart-microservices: requires { confirmed: true }, creates MaintenanceLog
  - GET /maintenance/logs: last 50 MaintenanceLog rows

**Program.cs:**
- Added maintenance mode middleware that intercepts all non-super-admin/auth/pricing routes and returns 503 if maintenance_mode = "true"

### Frontend Changes

**API Layer:**
- src/api/superAdminApi.ts � Added MaintenanceStatus, MaintenanceLogEntry types + getMaintenanceStatus, getMaintenanceLogs, triggerBackup, clearCache, restartMicroservices functions

**Views:**
- iews/ConfigView.tsx � Full rewrite: proper config keys, addToast prop, real API calls, React confirmation modal for maintenance mode
- iews/MaintenanceView.tsx � Full rewrite: 5 KPI cards (DB, ML, Size, Backup, Uptime), live API data with 30s polling, SQL metrics progress bars, backup schedule from API, real maintenance logs with icons/colors, restart confirmation modal

**Routing:**
- SuperAdminSystem.tsx � Passes addToast to ConfigView and MaintenanceView; addToast stabilized with useCallback

### Architecture Notes
- Zero window.alert() / window.confirm() � all confirmations use React modal components
- All actions use addToast() for feedback
- Maintenance middleware uses a scoped DI pattern to avoid DI lifetime issues
- ML health check uses 5-second timeout to avoid blocking status API
- Build state: dotnet build 0 errors, npm run build 0 errors

---

## Session: JWT Authentication + Production Deployment Prep (2026-05-19)

### Changes Made

#### 1. Real JWT Authentication Implemented (End-to-End)

**Backend:**
- Installed Microsoft.AspNetCore.Authentication.JwtBearer (v10.0.0)
- Added Jwt config section to ppsettings.json (Secret, Issuer, Audience, ExpirationHours=24)
- Program.cs � Wired AddAuthentication(JwtBearerDefaults.AuthenticationScheme) + AddAuthorization(), pipeline now runs UseAuthentication() + UseAuthorization() after CORS
- AuthController.cs � Injected IConfiguration; login endpoint now generates a signed HS256 JWT with claims: userId, tenantId, roleId, email, name. Token returned as 	oken field in login response.

**Frontend:**
- Created src/config/auth.ts � Central auth helper: saveSession(), clearSession(), getStoredToken(), getAuthHeaders() (injects Authorization: Bearer <token> + X-Tenant-Id + X-User-Id)
- App.jsx � Imports saveSession/clearSession; uses saveSession(data) on login to store token separately, clearSession() on logout
- All 5 API files updated to use getAuthHeaders():
  - inanceManagerApi.ts � removed manual getHeaders(), uses getAuthHeaders()
  - uditorApi.ts � removed getHeaders()/getUserInfo(), uses getAuthHeaders()
  - deptHeadApi.ts � removed getHeaders(), uses getAuthHeaders()
  - mainAdminApi.ts � removed inline header build, uses getAuthHeaders()
  - superAdminApi.ts � was Content-Type only; now uses getAuthHeaders()

#### 2. Production Deployment Prep (Tasks 1-11)

- **CORS** � Added AllowCredentials() + localhost:3000 to CORS policy; origins config-driven
- **Auto-Migration** � Already existed; verified working
- **Maintenance Middleware** � Added /api/payments/webhook + /health exemptions; uses AsNoTracking()
- **appsettings.example.json** � Created with all keys for Render env var setup
- **vercel.json** � Created 
exaplan-client/vercel.json with SPA rewrite rule (fixes 404 on page refresh)
- **Health endpoint** � GET /health returns { status, timestamp, service }
- **ML Keep-Alive** � pingMlService() added to financeManagerApi; called on FinanceManagerSystem mount
- **.gitignore** � Created root .gitignore protecting appsettings.json, build outputs, env files

#### 3. Backup Checkpoint Fix
- POST /api/super-admin/maintenance/backup now correctly logs as "Backup checkpoint recorded" (not simulated snapshot)
- Location label changed to "MonsterASP Managed Storage"
- UI button text updated to "Record Backup Checkpoint" with honest note

### Build State
- dotnet build � 0 errors
- 
pm run build � 0 errors, built in 10.64s

### What's Still NOT Implemented (Production gaps remaining)
- **[Authorize] on controllers** � JWT is generated and sent, but no controller enforces it yet. Controllers still trust X-Tenant-Id/X-User-Id headers. Adding [Authorize] is the next step.
- **HTTPS enforcement** � UseHttpsRedirection() exists but no SSL cert configured for Render
- **Rate limiting** � No throttle on login endpoint (brute force risk)
- **Refresh tokens** � JWT expires in 24h; no refresh token endpoint
- **Email verification** � No email confirm on registration

#### 4. Controller Authorization & Security Lockdown
- **[Authorize]** added to all 5 controller base classes (SuperAdminBaseController, MainAdminBaseController, FinanceManagerBaseController, DeptHeadBaseController, AuditorBaseController)
- **[Authorize]** added to standalone controllers (AdminController, TenantsController, PaymentsController)
- **[AllowAnonymous]** added to public endpoints: PaymentsController.CreateCheckout, PaymentsController.HandleWebhook, PricingController
- The system now natively enforces JWT token checks, throwing 401 Unauthorized for requests missing or having invalid Authorization: Bearer <token> headers.
