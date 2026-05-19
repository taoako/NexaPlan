# NexaPlan — Settings Improvements, Currency System & Audit CSV Prompt

You are implementing four connected features:
1. Removing Government org type — NexaPlan is corporate-only
2. Completing the Main Admin Settings page with all missing sections
3. Building a working multi-currency system that actually converts amounts
4. Upgrading the Audit Log CSV export to a professional, comprehensive format

Read every section before writing a single line of code.

---

## ABSOLUTE RULES

- NEVER use `window.alert()` or `window.confirm()` — use `addToast()` and React modals
- NEVER create new migrations for fields that already exist in the DB
- NEVER break existing controller endpoints — only extend them
- AppDbContext is the correct DB context name (NOT NexaPlanDbContext)
- Role IDs: Super Admin=1, Main Admin=2, Finance Manager=3, Dept Head=4, Auditor=5
- Department PK = `DepartmentID`, Tenant FK = `TenantID`, name = `DepartmentName`
- `Department` model has NO `IsArchived` field — never filter on it
- All monetary amounts are stored in the DB as PHP (Philippine Peso) — currency
  conversion is a DISPLAY-ONLY layer, never stored in foreign currency

---

## PART 1 — Remove Government Org Type

### Why
NexaPlan's ML model was trained on corporate department spending patterns
(Sales, IT, HR, Finance, Marketing, Operations). Government bureau/office
structures have incompatible budget cycles and spending behaviors.
The system will be corporate-only going forward.

### What to change

#### Backend — `SuperAdminTenantsController.cs`
In the Provision New Tenant endpoint, remove the `OrgType` field from
the request DTO. Hard-code `OrgType = "Corporate"` and `OrgLabel = "Department"`
for all new tenants. Do not delete the DB columns — just stop exposing them.

#### Backend — `Tenant` model
The `OrgType` and `OrgLabel` fields stay in the DB (no migration needed).
All existing government tenants remain functional. Only new provisioning
is affected.

#### Frontend — Super Admin Provision Modal
Remove the "Organizational Structure Type" dropdown entirely from the
Provision New Tenant wizard. The step that had it should either be
removed or collapsed into another step if it contained other fields.

#### Frontend — Main Admin Settings
Remove any display of OrgType/OrgLabel from the Settings page. The
"Company Information" section should not show or allow editing of org type.

#### Frontend — Dynamic labels
Everywhere the system uses `orgLabel` to dynamically say "Department" vs
"Bureau", replace with the hardcoded string "Department". This affects:
- Main Admin → Departments tab header
- Dept Head navigation label
- Any tooltip or placeholder that references the org label variable

---

## PART 2 — Complete the Main Admin Settings Page

### Current state (from screenshot)
The Settings page has:
- Company Information (Name, Contact Person, Phone, Email)
- Security Policy (MFA toggle only)
- Fiscal & Reporting (Annual Company Budget, Fiscal Year Start Month, Currency)

### What is missing — add all of these

---

### 2.1 Security Policy — add three new fields

Find the Security Policy section in `MainAdminSettingsController.cs`
(`GET/PUT /api/main-admin/settings`) and add these fields to the
settings DTO and the `Tenant` model (check if columns exist first;
add a migration only if they don't):

```csharp
// Add to UpdateSettingsDto in MainAdminDtos.cs:
public int  SessionTimeoutMinutes    { get; set; } = 30;   // 15/30/60/120/240
public int  MinPasswordLength        { get; set; } = 8;    // 6-24
public int  MaxFailedLoginAttempts   { get; set; } = 5;    // 3/5/10
```

Frontend — in the Security Policy card, add below the MFA toggle:

```
SESSION TIMEOUT
[Dropdown: 15 min / 30 min / 1 hour / 2 hours / 4 hours]
Users are automatically logged out after this period of inactivity.

PASSWORD MINIMUM LENGTH
[Dropdown: 6 / 8 / 10 / 12 / 16 / 24 characters]
Minimum character requirement for all user passwords in this organization.

FAILED LOGIN LOCKOUT THRESHOLD
[Dropdown: 3 attempts / 5 attempts / 10 attempts]
Number of failed login attempts before an account is automatically locked.
```

These values must be returned in the settings GET and saved in the settings PUT.
The `AuthController.cs` must read `MaxFailedLoginAttempts` from the Tenant
settings when evaluating login failures — look for where `IsLocked` is set
and replace any hardcoded attempt limit with the tenant's configured value.

---

### 2.2 Notification Preferences — new section

Add a new "Notification Preferences" card to the Settings page.
These are boolean toggles stored as a JSON string in a single
`NotificationPreferences` column on the Tenant table
(add migration if column does not exist):

```json
{
  "emailOnBudgetOverrun": true,
  "emailOnScenarioActivated": true,
  "emailOnProposalSubmitted": false,
  "emailOnReconciliationCleared": false,
  "emailOnUserInvited": true
}
```

Frontend card:
```
NOTIFICATION PREFERENCES
Send email alerts for the following events:

[Toggle] Budget overrun risk detected (ML anomaly flag)
[Toggle] Scenario activated or deactivated by Finance Manager
[Toggle] New budget proposal submitted by a Dept Head
[Toggle] Expense reconciliation cleared by Finance Manager
[Toggle] New user invited to the organization
```

Backend: parse/serialize this JSON in the settings GET/PUT.
Do not wire up actual email sending in this session — just save the
preferences. Add a TODO comment where SMTP calls should be conditional.

---

### 2.3 Subscription & Data section — read-only display

Add a read-only "Subscription & Data" card at the bottom of Settings.
Pull these values from the tenant record — do not add new endpoints:

```
CURRENT PLAN
[Badge: Starter / Professional / Enterprise / Trial]
Based on RegistrationStatus or SubscriptionTier field on Tenant.

DATA RETENTION
Starter: Last 12 months | Professional: Last 24 months | Enterprise: Unlimited
[Display only — matches Session 29 TierFeatures rules]

ORGANIZATION TYPE
Corporate — Department Structure
[Read-only text — always "Corporate" after Part 1 changes]

ORGANIZATION ID
[Tenant ID — shown in monospace font for support reference]
```

---

### 2.4 Save Settings UX

The existing "Save Settings" button must:
1. Call `PUT /api/main-admin/settings` with ALL settings fields in one payload
2. Show a loading spinner on the button during the request
3. On success: `addToast({ type: 'success', message: 'Settings saved successfully' })`
4. On error: `addToast({ type: 'error', message: 'Failed to save settings' })`
5. Show an "Unsaved changes" warning banner if the user tries to navigate
   away after editing without saving (this banner is already implemented —
   make sure it covers the new fields)

---

## PART 3 — Working Multi-Currency System

### Architecture — display-only conversion layer

ALL monetary values are stored in PHP (Philippine Peso) in the database.
Currency conversion happens ONLY at the display layer — never in storage.
When a user changes their default currency to USD, the system:
1. Fetches the live PHP → target currency exchange rate
2. Multiplies every displayed peso amount by that rate
3. Shows the converted amount with the correct currency symbol
4. NEVER saves the converted amount back to the database

This is the correct approach for a multi-tenant SaaS — each tenant sees
their numbers in their preferred currency, but the DB stays in one currency.

---

### 3.1 Currency rate fetching — Python ML service

The Python ML service already uses open.er-api.com (Session 24).
Add a new endpoint to expose rates to the .NET backend:

```python
# Add to ml_service/main.py

import requests as http_requests
from functools import lru_cache
from datetime import datetime, timedelta

RATE_CACHE = {}
RATE_CACHE_EXPIRY = {}

@app.get("/currency/rates")
def get_currency_rates():
    """
    Returns live exchange rates with PHP as base.
    Cached for 1 hour to avoid API hammering.
    Falls back to hardcoded rates if API is unavailable.
    """
    cache_key = "php_rates"
    now = datetime.utcnow()

    if cache_key in RATE_CACHE and RATE_CACHE_EXPIRY.get(cache_key, now) > now:
        return RATE_CACHE[cache_key]

    FALLBACK_RATES = {
        "PHP": 1.0,
        "USD": 0.0172,   # 1 PHP = 0.0172 USD (approx)
        "EUR": 0.0159,
        "GBP": 0.0136,
        "JPY": 2.63,
        "SGD": 0.0233,
        "AUD": 0.0267,
        "CAD": 0.0237,
        "CNY": 0.1249,
        "KRW": 23.54,
        "THB": 0.623,
        "MYR": 0.0804,
        "IDR": 280.5,
        "INR": 1.438,
        "HKD": 0.134,
    }

    try:
        response = http_requests.get(
            "https://open.er-api.com/v6/latest/PHP",
            timeout=5
        )
        data = response.json()
        if data.get("result") == "success":
            rates = {k: v for k, v in data["rates"].items()
                     if k in FALLBACK_RATES}
            rates["PHP"] = 1.0
            result = {"rates": rates, "source": "live", "base": "PHP"}
        else:
            result = {"rates": FALLBACK_RATES, "source": "fallback", "base": "PHP"}
    except Exception:
        result = {"rates": FALLBACK_RATES, "source": "fallback", "base": "PHP"}

    RATE_CACHE[cache_key] = result
    RATE_CACHE_EXPIRY[cache_key] = now + timedelta(hours=1)
    return result
```

---

### 3.2 Currency controller — .NET backend

Create `Controllers/MainAdmin/MainAdminCurrencyController.cs`:

```csharp
[ApiController]
[Route("api/currency")]
public class MainAdminCurrencyController : ControllerBase
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    // Static cache — rates valid for 1 hour across all requests
    private static Dictionary<string, decimal> _rateCache = new();
    private static DateTime _cacheExpiry = DateTime.MinValue;

    public MainAdminCurrencyController(
        IHttpClientFactory http, IConfiguration config)
    { _http = http; _config = config; }

    // GET /api/currency/rates
    // Public endpoint — no auth required (rates are not sensitive)
    [HttpGet("rates")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRates()
    {
        if (_rateCache.Any() && DateTime.UtcNow < _cacheExpiry)
            return Ok(new { rates = _rateCache, source = "cached", base_ = "PHP" });

        try
        {
            var client = _http.CreateClient("MlService");
            var resp   = await client.GetAsync("/currency/rates");
            if (resp.IsSuccessStatusCode)
            {
                var json  = await resp.Content.ReadFromJsonAsync<CurrencyRatesDto>();
                _rateCache   = json?.Rates ?? FallbackRates();
                _cacheExpiry = DateTime.UtcNow.AddHours(1);
                return Ok(new { rates = _rateCache, source = json?.Source, base_ = "PHP" });
            }
        }
        catch { /* fall through to fallback */ }

        _rateCache   = FallbackRates();
        _cacheExpiry = DateTime.UtcNow.AddMinutes(15);
        return Ok(new { rates = _rateCache, source = "fallback", base_ = "PHP" });
    }

    private static Dictionary<string, decimal> FallbackRates() => new()
    {
        ["PHP"] = 1.0m,    ["USD"] = 0.0172m,  ["EUR"] = 0.0159m,
        ["GBP"] = 0.0136m, ["JPY"] = 2.63m,    ["SGD"] = 0.0233m,
        ["AUD"] = 0.0267m, ["CAD"] = 0.0237m,  ["CNY"] = 0.1249m,
        ["KRW"] = 23.54m,  ["THB"] = 0.623m,   ["MYR"] = 0.0804m,
        ["IDR"] = 280.5m,  ["INR"] = 1.438m,   ["HKD"] = 0.134m,
    };
}

public record CurrencyRatesDto(
    Dictionary<string, decimal> Rates,
    string Source,
    string Base);
```

---

### 3.3 Currency context — React frontend

Create `src/context/CurrencyContext.tsx`:

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const SUPPORTED_CURRENCIES: Record<string, { symbol: string; name: string; decimals: number }> = {
  PHP: { symbol: '₱',  name: 'Philippine Peso',   decimals: 2 },
  USD: { symbol: '$',  name: 'US Dollar',          decimals: 2 },
  EUR: { symbol: '€',  name: 'Euro',               decimals: 2 },
  GBP: { symbol: '£',  name: 'British Pound',      decimals: 2 },
  JPY: { symbol: '¥',  name: 'Japanese Yen',       decimals: 0 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar',   decimals: 2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar',  decimals: 2 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar',    decimals: 2 },
  CNY: { symbol: '¥',  name: 'Chinese Yuan',       decimals: 2 },
  KRW: { symbol: '₩',  name: 'Korean Won',         decimals: 0 },
  THB: { symbol: '฿',  name: 'Thai Baht',          decimals: 2 },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit',  decimals: 2 },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah',  decimals: 0 },
  INR: { symbol: '₹',  name: 'Indian Rupee',       decimals: 2 },
  HKD: { symbol: 'HK$',name: 'Hong Kong Dollar',  decimals: 2 },
};

interface CurrencyContextType {
  currency:    string;                           // e.g. "USD"
  symbol:      string;                           // e.g. "$"
  rate:        number;                           // PHP → target rate
  rates:       Record<string, number>;           // all rates
  ratesLoaded: boolean;
  setCurrency: (code: string) => void;
  fmt:         (phpAmount: number | null | undefined) => string;
  convert:     (phpAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({
  children,
  initialCurrency = 'PHP',
}: {
  children: ReactNode;
  initialCurrency?: string;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);
  const [rates, setRates]           = useState<Record<string, number>>({ PHP: 1 });
  const [ratesLoaded, setLoaded]    = useState(false);

  // Fetch live rates once on mount
  useEffect(() => {
    fetch('/api/currency/rates')
      .then(r => r.json())
      .then(data => {
        setRates(data.rates ?? { PHP: 1 });
        setLoaded(true);
      })
      .catch(() => setLoaded(true)); // fail silently — PHP = 1 fallback
  }, []);

  const setCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) setCurrencyState(code);
  };

  const rate   = rates[currency] ?? 1;
  const meta   = SUPPORTED_CURRENCIES[currency] ?? SUPPORTED_CURRENCIES['PHP'];
  const symbol = meta.symbol;

  const convert = (phpAmount: number) =>
    currency === 'PHP' ? phpAmount : phpAmount * rate;

  const fmt = (phpAmount: number | null | undefined): string => {
    if (phpAmount == null || isNaN(phpAmount)) return `${symbol}0`;
    const converted = convert(phpAmount);
    return `${symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency, symbol, rate, rates, ratesLoaded, setCurrency, fmt, convert
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
};
```

---

### 3.4 Wire CurrencyProvider into App

In `App.jsx` (or wherever the root component renders role dashboards),
wrap the entire application in `<CurrencyProvider initialCurrency={tenantCurrency}>`.

The `tenantCurrency` value comes from the settings API. When a user logs in,
the dashboard loads settings which includes `defaultCurrency: "USD"` (or
whatever was saved). Pass this to the provider.

```tsx
// In App.jsx — after user logs in and settings are loaded:
<CurrencyProvider initialCurrency={settings?.defaultCurrency ?? 'PHP'}>
  {/* all role dashboards here */}
</CurrencyProvider>
```

---

### 3.5 Use currency throughout the system

Replace ALL hardcoded `₱` symbols and `.toLocaleString()` calls with `fmt()`.

The pattern is:

```tsx
// BEFORE (hardcoded peso):
<span>₱{amount.toLocaleString()}</span>

// AFTER (currency-aware):
const { fmt } = useCurrency();
<span>{fmt(amount)}</span>
```

Apply this replacement in ALL of these files:
- `ForecastingView.tsx` — all chart tooltips and KPI card values
- `VarianceView.tsx` — all variance amounts and budget columns
- `AllocationView.tsx` — all cap amounts and remaining budget values
- `ApprovalsView.tsx` — proposal amounts and line item totals
- `ScenariosView.tsx` — all projected budget calculations
- `DeptHeadSystem.tsx` / `OverviewView.tsx` — any budget display
- `MainAdminSystem.tsx` — department caps and company budget
- `BillingView.tsx` — subscription amounts (keep in original USD for PayMongo)

IMPORTANT — Billing exception: PayMongo charges are always in PHP regardless
of display currency. The BillingView can show converted amounts in a
"≈ USD X.XX" secondary label, but the actual charge shown and sent to
PayMongo must always be in PHP.

---

### 3.6 Currency selector in Settings

The existing `DEFAULT CURRENCY` dropdown in Settings currently does nothing.
Wire it up properly:

```tsx
// In Settings page — DEFAULT CURRENCY dropdown:
const { setCurrency, rates, ratesLoaded } = useCurrency();

const handleCurrencyChange = async (newCurrency: string) => {
  // 1. Save to backend immediately
  await saveSettings({ ...currentSettings, defaultCurrency: newCurrency });
  // 2. Update the live context — all amounts on screen update instantly
  setCurrency(newCurrency);
  addToast({ type: 'success', message: `Currency changed to ${newCurrency}` });
};

// The dropdown options:
<select onChange={e => handleCurrencyChange(e.target.value)}>
  {Object.entries(SUPPORTED_CURRENCIES).map(([code, { name, symbol }]) => (
    <option key={code} value={code}>{symbol} {code} — {name}</option>
  ))}
</select>
```

Also add a small "live rate" note below the dropdown:
```
Current rate: 1 PHP = [rate] [selected currency]
Rates updated hourly via open.er-api.com
```

---

## PART 4 — Professional Audit Log CSV Export

### 4.1 Backend — enhanced CSV endpoint

Find the existing `GET /api/main-admin/logs` or CSV export endpoint in
`MainAdminLogsController.cs` and replace the CSV generation with this:

```csharp
[HttpGet("export")]
public async Task<IActionResult> ExportCsv(
    [FromQuery] string? search    = null,
    [FromQuery] string? type      = null,
    [FromQuery] string? dateFrom  = null,
    [FromQuery] string? dateTo    = null)
{
    var tenantId = GetTenantId();

    var query = _db.AuditLogs
        .Where(l => l.TenantID == tenantId);

    if (!string.IsNullOrEmpty(search))
        query = query.Where(l => l.Action.Contains(search)
                              || l.Details.Contains(search));
    if (!string.IsNullOrEmpty(type))
        query = query.Where(l => l.Action == type);
    if (DateTime.TryParse(dateFrom, out var from))
        query = query.Where(l => l.Timestamp >= from);
    if (DateTime.TryParse(dateTo, out var to))
        query = query.Where(l => l.Timestamp <= to.AddDays(1));

    var logs = await query
        .OrderByDescending(l => l.Timestamp)
        .Include(l => l.User)
        .ToListAsync();

    // Resolve department from Details field (best-effort parsing)
    static string ParseDept(string details) {
        var match = System.Text.RegularExpressions.Regex
            .Match(details, @"Dept:(\w+)");
        return match.Success ? match.Groups[1].Value : "";
    }

    static string ParseEntityType(string action) => action switch {
        var a when a.Contains("Alloc")     => "Department",
        var a when a.Contains("User")      => "User",
        var a when a.Contains("Proposal")  => "Budget Proposal",
        var a when a.Contains("Scenario")  => "Scenario",
        var a when a.Contains("Expense")   => "Expense",
        var a when a.Contains("Statement") => "Financial Statement",
        var a when a.Contains("Login")     => "Auth Session",
        _ => "System"
    };

    static string ParseCategory(string action) => action switch {
        var a when a.Contains("Alloc") || a.Contains("Proposal")
                || a.Contains("Expense") || a.Contains("Scenario") => "Budget",
        var a when a.Contains("User") || a.Contains("Login")
                || a.Contains("Lock") || a.Contains("Password") => "User Management",
        var a when a.Contains("Statement") || a.Contains("Compliance") => "Compliance",
        var a when a.Contains("Billing") || a.Contains("Invoice") => "Billing",
        var a when a.Contains("Settings") => "Configuration",
        _ => "General"
    };

    static string ParseActionCode(string action) => action switch {
        "AllocationSet"            => "ALLOC_SET",
        "AllocationAdjusted"       => "ALLOC_ADJUST",
        "ProposalSubmitted"        => "PROP_SUBMIT",
        "ProposalApproved"         => "PROP_APPROVE",
        "ProposalRejected"         => "PROP_REJECT",
        "ScenarioActivated"        => "SCEN_ACTIVATE",
        "ScenarioDeactivated"      => "SCEN_DEACTIVATE",
        "ScenarioPitchSubmitted"   => "SCEN_PITCH_SUBMIT",
        "ScenarioPitchAcknowledged"=> "SCEN_PITCH_ACK",
        "UserInvited"              => "USER_INVITE",
        "UserUpdated"              => "USER_UPDATE",
        "UserLocked"               => "USER_LOCK",
        "UserUnlocked"             => "USER_UNLOCK",
        "StatementDownloaded"      => "STMT_DOWNLOAD",
        "ExpenseReconciled"        => "EXP_RECONCILE",
        "ExpenseRejected"          => "EXP_REJECT",
        "LoginSuccess"             => "AUTH_LOGIN_OK",
        "LoginFailed"              => "AUTH_LOGIN_FAIL",
        "SettingsUpdated"          => "CFG_SETTINGS",
        _ => action.ToUpper().Replace(" ", "_")
    };

    var sb = new System.Text.StringBuilder();

    // Header row
    sb.AppendLine(string.Join(",", new[] {
        "Event ID",
        "Timestamp (UTC ISO 8601)",
        "Date",
        "Time (24h)",
        "Day of Week",
        "Action Code",
        "Action Category",
        "Action Description",
        "Entity Type",
        "Department",
        "User ID",
        "User Full Name",
        "User Role",
        "IP Address",
        "Details / Notes",
        "Fiscal Year",
        "Status"
    }));

    int eventId = logs.Count;
    foreach (var log in logs)
    {
        var ts       = log.Timestamp.ToUniversalTime();
        var roleName = log.User?.RoleID switch {
            1 => "Super Admin", 2 => "Main Admin", 3 => "Finance Manager",
            4 => "Department Head", 5 => "Auditor", 6 => "Viewer",
            _ => "Unknown"
        };
        var fullName = log.User != null
            ? $"{log.User.FirstName} {log.User.LastName}".Trim()
            : "System";

        string Esc(string? s) =>
            s == null ? "" : $"\"{s.Replace("\"", "\"\"")}\"";

        sb.AppendLine(string.Join(",", new[] {
            eventId--.ToString(),
            ts.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            ts.ToString("yyyy-MM-dd"),
            ts.ToString("HH:mm:ss"),
            ts.DayOfWeek.ToString(),
            ParseActionCode(log.Action),
            ParseCategory(log.Action),
            Esc(log.Action),
            ParseEntityType(log.Action),
            Esc(ParseDept(log.Details ?? "")),
            log.UserID?.ToString() ?? "",
            Esc(fullName),
            Esc(roleName),
            Esc(log.IPAddress ?? ""),
            Esc(log.Details ?? ""),
            ts.Year.ToString(),
            "Success"
        }));
    }

    var fileName = $"NexaPlan_AuditLog_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
    var bytes    = System.Text.Encoding.UTF8.GetPreamble()
                   .Concat(System.Text.Encoding.UTF8.GetBytes(sb.ToString()))
                   .ToArray();

    return File(bytes, "text/csv; charset=utf-8", fileName);
}
```

---

### 4.2 Frontend — Export CSV button wiring

Find the "Export CSV" button in the Main Admin Audit Logs view
(`MainAdminLogsController` / `AuditLogsView.tsx`) and update it
to call the new endpoint with the current filter parameters:

```tsx
const handleExportCsv = async () => {
  const params = new URLSearchParams();
  if (searchTerm)  params.append('search',   searchTerm);
  if (filterType && filterType !== 'All Types')
                   params.append('type',     filterType);
  if (dateFrom)    params.append('dateFrom', dateFrom);
  if (dateTo)      params.append('dateTo',   dateTo);

  const res = await fetch(
    `${API_BASE}/api/main-admin/logs/export?${params.toString()}`,
    { headers: { 'X-Tenant-Id': tenantId, 'X-User-Id': userId } }
  );

  if (!res.ok) {
    addToast({ type: 'error', message: 'Failed to export audit log' });
    return;
  }

  // Trigger browser download
  const blob     = await res.blob();
  const url      = URL.createObjectURL(blob);
  const link     = document.createElement('a');
  link.href      = url;
  link.download  = `NexaPlan_AuditLog_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  addToast({ type: 'success', message: 'Audit log exported successfully' });
};
```

The exported CSV must respect the current search, type filter, and date
range — not dump all logs unfiltered.

---

## 5. Migrations needed — check before running

Run `dotnet ef migrations list` first. Only add migrations for columns
that don't already exist:

```bash
# Only if SessionTimeoutMinutes, MinPasswordLength, MaxFailedLoginAttempts
# are not already on the Tenants table:
dotnet ef migrations add AddSecurityPolicySettings
dotnet ef database update

# Only if NotificationPreferences column doesn't exist:
dotnet ef migrations add AddNotificationPreferences
dotnet ef database update
```

Do NOT create migrations for columns already confirmed to exist.

---

## 6. Verification checklist

### Government org type removal
- [ ] Provision New Tenant wizard has no Organizational Structure Type field
- [ ] All existing tenants still work correctly
- [ ] "Department" label appears everywhere — no "Bureau" or "Office" strings remain
- [ ] Main Admin Settings has no OrgType display

### Settings page
- [ ] Security Policy section shows Session Timeout, Password Length, Lockout Threshold
- [ ] All three security fields save and reload correctly
- [ ] Notification Preferences section shows 5 toggles, saves as JSON
- [ ] Subscription & Data section shows correct tier, retention, org ID
- [ ] Unsaved changes banner appears when navigating away without saving
- [ ] Save Settings shows loading spinner during request

### Currency system
- [ ] `GET /api/currency/rates` returns rates with PHP as base
- [ ] Default currency dropdown in Settings shows all 15 currencies
- [ ] Changing currency updates ALL monetary amounts on screen instantly
- [ ] Live rate note shows below dropdown ("1 PHP = X USD")
- [ ] Billing amounts remain in PHP regardless of display currency
- [ ] `fmt()` helper correctly formats amounts for currencies with 0 decimals (JPY, KRW, IDR)
- [ ] Rates are cached — second page load does not re-fetch rates

### Audit log CSV
- [ ] CSV has all 17 columns as specified
- [ ] Filename format: `NexaPlan_AuditLog_YYYYMMDD_HHMMSS.csv`
- [ ] CSV opens correctly in Excel without encoding errors (UTF-8 BOM included)
- [ ] Export respects active search and filter parameters
- [ ] Action Code column shows short codes (ALLOC_SET, USER_INVITE, etc.)
- [ ] Action Category groups events correctly (Budget, User Management, etc.)
- [ ] Department column correctly parses dept name from Details text
- [ ] Timestamps are in ISO 8601 UTC format

---

## 7. Common errors and fixes

**"useCurrency must be used inside CurrencyProvider"**
→ A component is calling `useCurrency()` outside the provider tree.
  Make sure `CurrencyProvider` wraps ALL role dashboard components in App.jsx.

**CSV opens with garbled characters (£ ₱ ¥ showing as ???)**
→ UTF-8 BOM is missing. Ensure `GetPreamble()` bytes are prepended to the
  CSV content in the File() return statement.

**Currency rates always return fallback**
→ The ML service `/currency/rates` endpoint is not running or not reachable.
  Check that uvicorn is running on port 8001 and the MlService named HttpClient
  base URL in appsettings.json points to the correct host.

**Settings save succeeds but currency doesn't change on screen**
→ `setCurrency()` is being called but the `CurrencyProvider` state is not
  connected. Verify `CurrencyContext` is exported and `useCurrency()` is
  called inside a component that is a child of `CurrencyProvider`.

**"Department" column empty in CSV for non-budget events**
→ This is expected — User Management and Auth events don't have a dept.
  The regex parser returns empty string, which is correct.

**JPY/KRW/IDR amounts showing decimal places**
→ The `decimals` field in `SUPPORTED_CURRENCIES` for JPY, KRW, IDR is 0.
  Check that `fmt()` uses `minimumFractionDigits: meta.decimals`.
