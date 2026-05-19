# NexaPlan — Subscription Tier Feature Gating — Full Implementation Prompt

## Context

I am working on NexaPlan, a full-stack SaaS budget management platform
(React + .NET + MySQL). Read the full system context before proceeding.

The platform has three paid tiers plus a Trial tier:
- **Starter** — ₱4,950/month
- **Professional** — ₱12,900/month
- **Enterprise** — ₱29,900/month
- **Trial** — 14-day free trial

The subscription tier is already stored on the `Tenant` model as
`SubscriptionTier` (string). The goal of this prompt is to enforce real
feature restrictions per tier across the entire backend and frontend.

---

## Pricing Page Features — Corrected & Accurate

The pricing page must be updated to reflect only features that are actually
implemented in the system. Apply these corrections before doing anything else.

### Starter — ₱4,950/month
- Up to 3 Finance Manager + Dept Head users
- Up to 5 departments
- Basic variance analysis (12-month history)
- Budget proposals and approvals
- Email support

### Professional — ₱12,900/month
- Up to 15 Finance Manager + Dept Head users
- Unlimited departments
- ML budget overrun risk prediction per department
- AI-powered forecasting chart with trend lines
- Multi-scenario planning (up to 5 scenarios)
- Scenario pitching (Dept Head → Finance Manager)
- 24-month history
- Priority support

### Enterprise — ₱29,900/month
- Unlimited users
- Unlimited departments
- Full ML analytics — risk signals, confidence bands, anomaly detection
- Unlimited scenarios
- Unlimited history
- 24/7 phone and chat support

> **Remove entirely from the pricing page:** "Custom model training" —
> this feature does not exist in the system and must not be shown.

---

## Step 1 — Create `TierFeatures.cs` Helper

Create `NexaPlan.API/Helpers/TierFeatures.cs`:

```csharp
namespace NexaPlan.API.Helpers;

public static class TierFeatures
{
    // ── ML & Forecasting ────────────────────────────────────────────────────
    public static bool CanUseMLPrediction(string tier) =>
        tier is "Professional" or "Enterprise";

    public static bool CanUseConfidenceBands(string tier) =>
        tier == "Enterprise";

    public static bool CanUseAnomalyDetection(string tier) =>
        tier == "Enterprise";

    // ── Scenario Planning ───────────────────────────────────────────────────
    public static bool CanUseScenarios(string tier) =>
        tier is "Professional" or "Enterprise";

    public static int MaxScenarios(string tier) => tier switch
    {
        "Professional" => 5,
        "Enterprise"   => int.MaxValue,
        _              => 0
    };

    // ── Departments ─────────────────────────────────────────────────────────
    public static int MaxDepartments(string tier) => tier switch
    {
        "Starter"      => 5,
        "Professional" => int.MaxValue,
        "Enterprise"   => int.MaxValue,
        "Trial"        => 3,
        _              => 3
    };

    // ── Users (Finance Manager + Dept Head seats combined) ──────────────────
    public static int MaxUsers(string tier) => tier switch
    {
        "Starter"      => 3,
        "Professional" => 15,
        "Enterprise"   => int.MaxValue,
        "Trial"        => 10,
        _              => 3
    };

    // ── Historical Data Range ───────────────────────────────────────────────
    public static int HistoryMonths(string tier) => tier switch
    {
        "Starter"      => 12,
        "Professional" => 24,
        "Enterprise"   => 1200,  // effectively unlimited
        "Trial"        => 12,
        _              => 12
    };

    // ── Variance Analysis ───────────────────────────────────────────────────
    public static bool CanSeeMLVarianceColumn(string tier) =>
        tier is "Professional" or "Enterprise";

    // ── Scenario Pitching ───────────────────────────────────────────────────
    public static bool CanSubmitScenarioPitch(string tier) =>
        tier is "Professional" or "Enterprise";

    // ── Helper: build the features object returned to the frontend ──────────
    public static object BuildFeaturesPayload(string tier) => new
    {
        currentTier           = tier,
        canUseMLPrediction    = CanUseMLPrediction(tier),
        canUseConfidenceBands = CanUseConfidenceBands(tier),
        canUseAnomalyDetection= CanUseAnomalyDetection(tier),
        canUseScenarios       = CanUseScenarios(tier),
        canSubmitPitch        = CanSubmitScenarioPitch(tier),
        canSeeMLVarianceCol   = CanSeeMLVarianceColumn(tier),
        maxScenarios          = MaxScenarios(tier),
        maxDepartments        = MaxDepartments(tier),
        maxUsers              = MaxUsers(tier),
        historyMonths         = HistoryMonths(tier),
    };
}
```

---

## Step 2 — Expose Features in the Settings API

In `MainAdminSettingsController.cs`, update `GetSettings` to include the
features payload at the bottom of the response object:

```csharp
var tenant = await _context.Tenants.FindAsync(tenantId);

// add to existing response:
features = TierFeatures.BuildFeaturesPayload(tenant.SubscriptionTier)
```

This lets the frontend load all feature flags in a single existing API call
without adding any new endpoints.

---

## Step 3 — Backend Guards (enforce limits server-side)

Apply these guards in the listed controllers. Every guard follows the same
pattern: fetch the tenant tier, check with `TierFeatures`, return an error
if the limit is exceeded.

---

### 3a. Department creation limit
**File:** `MainAdminDepartmentsController.cs` — POST (create department)

```csharp
var tenant   = await _context.Tenants.FindAsync(tenantId);
var deptCount = await _context.Departments
    .CountAsync(d => d.TenantID == tenantId);
var maxDepts  = TierFeatures.MaxDepartments(tenant.SubscriptionTier);

if (deptCount >= maxDepts)
    return BadRequest(new {
        error = $"Your {tenant.SubscriptionTier} plan allows a maximum of {maxDepts} departments. Upgrade to add more."
    });
```

---

### 3b. User seat limit
**File:** `MainAdminUsersController.cs` — POST (create user)

```csharp
var tenant    = await _context.Tenants.FindAsync(tenantId);
var userCount = await _context.Users
    .CountAsync(u => u.TenantID == tenantId && u.RoleID != 2); // exclude Main Admin
var maxUsers  = TierFeatures.MaxUsers(tenant.SubscriptionTier);

if (userCount >= maxUsers)
    return BadRequest(new {
        error = $"Your {tenant.SubscriptionTier} plan allows a maximum of {maxUsers} users. Upgrade to add more."
    });
```

---

### 3c. ML prediction gate
**File:** `FinanceManagerAnalyticsController.cs` — GET forecast endpoint (top of method)

```csharp
var tenant = await _context.Tenants.FindAsync(tenantId);

if (!TierFeatures.CanUseMLPrediction(tenant.SubscriptionTier))
    return StatusCode(402, new {
        error = "ML budget risk prediction requires the Professional or Enterprise plan.",
        upgradeRequired = true
    });
```

**File:** `FinanceManagerVarianceController.cs` — anywhere that calls `/predict`

Apply the same guard. If the tier is Starter/Trial, skip the ML call entirely
and return `mlExpectedSpending = null` and `isAnomaly = false` for all rows.

---

### 3d. Scenario creation limit
**File:** `FinanceManagerScenariosController.cs` — POST (create scenario)

```csharp
var tenant        = await _context.Tenants.FindAsync(tenantId);

if (!TierFeatures.CanUseScenarios(tenant.SubscriptionTier))
    return StatusCode(402, new {
        error = "Scenario planning requires the Professional or Enterprise plan.",
        upgradeRequired = true
    });

var scenarioCount = await _context.BudgetScenarios
    .CountAsync(s => s.TenantID == tenantId && !s.IsArchived);
var maxScenarios  = TierFeatures.MaxScenarios(tenant.SubscriptionTier);

if (maxScenarios != int.MaxValue && scenarioCount >= maxScenarios)
    return BadRequest(new {
        error = $"Your Professional plan allows a maximum of {maxScenarios} active scenarios. Archive one to create a new one."
    });
```

---

### 3e. Scenario pitch gate
**File:** `DeptHeadScenariosController.cs` — POST pitch endpoint

```csharp
var tenant = await _context.Tenants.FindAsync(tenantId);

if (!TierFeatures.CanSubmitScenarioPitch(tenant.SubscriptionTier))
    return StatusCode(402, new {
        error = "Scenario pitching requires the Professional or Enterprise plan.",
        upgradeRequired = true
    });
```

---

### 3f. Historical data range filter
**File:** `FinanceManagerVarianceController.cs` and
`FinanceManagerAnalyticsController.cs` — anywhere that filters by date

```csharp
var tenant       = await _context.Tenants.FindAsync(tenantId);
var historyMonths = TierFeatures.HistoryMonths(tenant.SubscriptionTier);
var cutoffDate   = DateTime.UtcNow.AddMonths(-historyMonths);

// Apply to expense queries:
.Where(e => e.ExpenseDate >= cutoffDate)

// Apply to proposal queries:
.Where(p => p.SubmittedAt >= cutoffDate)
```

---

## Step 4 — Frontend Feature Flag Store

### 4a. Load features from the settings API

In the Finance Manager and Main Admin system entry points, fetch the settings
on mount and store the features object in state. Pass it down as a prop or
store it in a shared context.

```typescript
// src/context/FeaturesContext.tsx
import { createContext, useContext } from 'react';

export interface TierFeatures {
  currentTier:            string;
  canUseMLPrediction:     boolean;
  canUseConfidenceBands:  boolean;
  canUseAnomalyDetection: boolean;
  canUseScenarios:        boolean;
  canSubmitPitch:         boolean;
  canSeeMLVarianceCol:    boolean;
  maxScenarios:           number;
  maxDepartments:         number;
  maxUsers:               number;
  historyMonths:          number;
}

export const FeaturesContext = createContext<TierFeatures | null>(null);
export const useFeatures = () => useContext(FeaturesContext)!;
```

Load once in the main orchestrator (`MainAdminSystem.tsx`,
`FinanceManagerSystem.tsx`, `DeptHeadSystem.tsx`):

```typescript
const [features, setFeatures] = useState<TierFeatures | null>(null);

useEffect(() => {
  getSettings().then(data => setFeatures(data.features));
}, []);
```

Wrap the router/tab system:

```tsx
<FeaturesContext.Provider value={features}>
  {/* all tabs render here */}
</FeaturesContext.Provider>
```

---

### 4b. Upgrade Banner component

Create `src/components/UpgradeBanner.tsx`:

```tsx
interface UpgradeBannerProps {
  feature:     string;
  requiredTier: 'Professional' | 'Enterprise';
}

export default function UpgradeBanner({ feature, requiredTier }: UpgradeBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 
                    border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
      <div className="text-4xl">🔒</div>
      <h3 className="text-lg font-semibold text-gray-700">{feature}</h3>
      <p className="text-sm text-gray-500">
        This feature requires the{' '}
        <span className="font-bold text-blue-600">{requiredTier}</span> plan or higher.
      </p>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold 
                   hover:bg-blue-700 transition"
        onClick={() => {/* navigate to billing tab */}}
      >
        Upgrade Plan
      </button>
    </div>
  );
}
```

---

### 4c. Gate each feature in the UI

Apply these gates in the listed view files using `useFeatures()`:

**`ForecastingView.tsx`** — wrap the entire ML forecasting section:

```tsx
const features = useFeatures();

{features.canUseMLPrediction ? (
  <ForecastChart data={forecastData} />
) : (
  <UpgradeBanner
    feature="ML Budget Risk Prediction"
    requiredTier="Professional"
  />
)}
```

**`VarianceView.tsx`** — hide the ML Expected column for Starter/Trial:

```tsx
{features.canSeeMLVarianceCol && (
  <th className="text-purple-600">ML Expected</th>
)}

// and in the row:
{features.canSeeMLVarianceCol && (
  <td>
    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
      {row.mlExpectedSpending?.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
    </span>
    {row.isAnomaly && <span className="ml-1">⚠</span>}
  </td>
)}
```

**`ScenarioView.tsx` (Finance Manager)** — gate Create New Scenario button:

```tsx
const features = useFeatures();

{features.canUseScenarios ? (
  <button onClick={openCreateModal}>+ Create New Scenario</button>
) : (
  <button
    disabled
    title="Upgrade to Professional to unlock scenario planning"
    className="opacity-50 cursor-not-allowed"
  >
    🔒 Scenario Planning — Professional+
  </button>
)}
```

**`ScenarioView.tsx` (Dept Head)** — gate Submit Scenario Pitch button:

```tsx
{features.canSubmitPitch ? (
  <button onClick={openPitchModal}>Submit Scenario Pitch</button>
) : (
  <UpgradeBanner
    feature="Scenario Pitching"
    requiredTier="Professional"
  />
)}
```

**`MainAdminDepartmentsController` — show limit warning in Departments tab:**

```tsx
const features = useFeatures();

{deptCount >= features.maxDepartments && (
  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
    ⚠ You have reached the {features.maxDepartments}-department limit for your{' '}
    {features.currentTier} plan.{' '}
    <span className="font-semibold underline cursor-pointer">Upgrade to add more.</span>
  </div>
)}
```

---

## Step 5 — Update the Pricing Page

In the Landing Page `PricingTable` component (already fetches plans
dynamically from `/api/pricing`), update the benefit text per plan to
match the corrected feature list from the top of this document.

Specifically:
- **Remove** any benefit that says "Custom model training"
- **Update** "AI forecasting" to say "ML budget overrun risk prediction"
- **Update** "Advanced ML forecasting" to say
  "Full ML analytics with confidence bands and anomaly detection"

If plans are stored in the database via the `PricingBenefit` model
(added in Session 20), update the benefit records directly in MySQL:

```sql
-- Remove custom model training
DELETE FROM PricingBenefits
WHERE BenefitText LIKE '%Custom model training%';

-- Update AI forecasting wording
UPDATE PricingBenefits
SET BenefitText = 'ML budget overrun risk prediction'
WHERE BenefitText LIKE '%AI forecasting%'
  AND PlanName = 'Professional';

UPDATE PricingBenefits
SET BenefitText = 'Full ML analytics — confidence bands and anomaly detection'
WHERE BenefitText LIKE '%Advanced ML%';
```

---

## Step 6 — Super Admin Visibility

In the Super Admin's Tenants list, show each tenant's current tier as a
badge. This already exists but ensure the tier badge accurately reflects
`SubscriptionTier` from the DB — not a hardcoded label.

When the Super Admin provisions a new tenant manually (Enterprise/Government
onboarding), the tier they select in the provisioning modal must correctly
set `SubscriptionTier` on the `Tenant` record so all feature gates work
from day one.

---

## Critical Implementation Notes

| Rule | Detail |
|---|---|
| Always gate on the backend | Frontend gates are UX only. Backend must always enforce limits independently |
| Tenant fetch cost | Cache `tenant.SubscriptionTier` within a request — don't query `Tenants` table multiple times per controller method |
| Trial tier | Treat Trial as Starter for all feature limits |
| `int.MaxValue` check | When checking `maxDepartments == int.MaxValue`, skip the count check entirely — don't compare DB counts against int.MaxValue |
| Zero-Alert Policy | All upgrade prompts must be inline banners or modals — never `window.alert()` |
| Toast on 402 | When the frontend receives a 402 response from any endpoint, show an error toast: "This feature requires an upgraded plan" with a link to the Billing tab |
| Build check | `dotnet build` → 0 errors before testing any gate |

---

## Test Checklist After Implementation

- [ ] Starter tenant: cannot create more than 5 departments (backend returns error, frontend shows warning)
- [ ] Starter tenant: cannot create more than 3 users
- [ ] Starter tenant: Forecasting tab shows UpgradeBanner instead of ML chart
- [ ] Starter tenant: Scenarios tab shows disabled/locked Create button
- [ ] Professional tenant: ML forecasting works, confidence bands hidden
- [ ] Professional tenant: Scenarios work, capped at 5
- [ ] Enterprise tenant: all features unlocked, no caps enforced
- [ ] Pricing page: "Custom model training" no longer appears
- [ ] Pricing page: AI feature descriptions match what the system actually does
