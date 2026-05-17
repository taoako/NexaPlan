# NexaPlan — Scenario Planning (Department Head) — Full Implementation Prompt

## What This Feature Does

The Scenario Planning tab serves one purpose: **when a budget cut scenario is active or
possible, the Department Head must be able to see which of their proposals survive, decide
what to cut, and formally submit that decision to the Finance Manager as a Scenario Pitch.**

**Example flow:**
A Finance Manager activates a "Conservative Cut (−35%)" scenario. The Dept Head's ₱200,000
allocation becomes ₱130,000. They open Scenario Planning, see that 3 of their 5 proposals
are at risk, mark 2 as "Defer", mark 1 as "Cut", write a justification, and submit the pitch.
The Finance Manager sees the formal response and can acknowledge it.

---

## Current Broken State

From the screenshot, the page shows:
- A slider that updates the "Projected Budget" number — but nothing else reacts
- Two scenario cards with peso amounts only (no proposal impact)
- A "Submit Scenario Pitch" button that does nothing meaningful
- No connection to real DB proposals, priorities, or Finance Manager scenarios

---

## Backend — New and Updated Endpoints

### 1. `GET /api/dept-head/scenarios` (already exists — verify it returns these fields)

Ensure the response includes:

```json
[
  {
    "scenarioId": 5,
    "title": "Conservative Cut Q3",
    "adjustmentMultiplier": 0.65,
    "isActive": true,
    "isArchived": false
  }
]
```

Filter out archived scenarios. Return active scenario first, then others ordered by creation date.

---

### 2. `GET /api/dept-head/scenarios/impact?multiplier={float}&fiscalYear={int}` (NEW)

This is the core calculation endpoint. Add to `DeptHeadScenariosController.cs`.

**Logic:**
1. Get dept's `TotalAllocatedCap` from `DepartmentAllocations` for the fiscal year
   (fallback to `Department.AnnualBudgetCap`)
2. Calculate `scenarioBudget = TotalAllocatedCap * multiplier`
3. Fetch all proposals for this dept where `ProposalStatus IN ('Draft', 'Pending', 'Approved')`
   ordered by `PriorityRank ASC` (Priority 1 = highest survival priority, 4 = lowest)
4. Walk through proposals in priority order, accumulating `runningTotal`:
   - If `runningTotal + proposal.RequestedAmount <= scenarioBudget` → `scenarioStatus = "Survives"`
   - Else → `scenarioStatus = "AtRisk"`
5. Proposals with null `PriorityRank` are treated as Priority 4 (lowest)

**Response shape:**

```json
{
  "currentBudget": 200000,
  "scenarioBudget": 130000,
  "adjustmentMultiplier": 0.65,
  "gap": -70000,
  "totalSurviving": 85000,
  "totalAtRisk": 115000,
  "proposals": [
    {
      "proposalId": 1,
      "title": "Q3 Marketing Campaign",
      "requestedAmount": 45000,
      "priorityRank": 1,
      "status": "Approved",
      "scenarioStatus": "Survives"
    },
    {
      "proposalId": 3,
      "title": "New Laptops",
      "requestedAmount": 60000,
      "priorityRank": 3,
      "status": "Pending",
      "scenarioStatus": "AtRisk"
    }
  ]
}
```

---

### 3. `POST /api/dept-head/scenarios/pitch` (NEW)

Saves the Dept Head's formal response to a scenario.

**Request body:**

```json
{
  "scenarioId": 5,
  "customMultiplier": 0.65,
  "pitchTitle": "Our response to the Conservative Cut",
  "justification": "We can defer the laptop refresh to Q1 next year and reduce campaign spend by 30%...",
  "proposalDecisions": [
    { "proposalId": 1, "decision": "Keep" },
    { "proposalId": 3, "decision": "Defer" },
    { "proposalId": 4, "decision": "Cut" }
  ]
}
```

**Backend logic:**
- Create a new `BudgetScenario` record scoped to this department (`IsActive = false`)
- Store pitch justification in `ReviewNotes`
- Store `proposalDecisions` as JSON in a new `PitchDecisions` column (add migration if needed)
- Write an audit log entry:
  `"Scenario Pitch submitted by [UserName] for scenario [Title] — [Keep/Defer/Cut summary]"`
- Return: `{ "success": true, "pitchId": 12 }`

---

### 4. `GET /api/dept-head/scenarios/pitches` (NEW)

Returns all scenario pitches submitted by this department.

**Response shape:**

```json
[
  {
    "pitchId": 12,
    "pitchTitle": "Our response to the Conservative Cut",
    "scenarioTitle": "Conservative Cut Q3",
    "submittedAt": "2026-05-14T10:30:00",
    "status": "Pending Review",
    "justification": "We can defer..."
  }
]
```

---

## Frontend — Complete UI Rebuild for `ScenarioView.tsx`

### Layout: Two-Panel Design

```
┌─────────────────────────┬──────────────────────────────────────────┐
│  LEFT PANEL             │  RIGHT PANEL                             │
│  Scenario Selector      │  Proposal Impact Table                   │
│  + Custom Slider        │                                          │
└─────────────────────────┴──────────────────────────────────────────┘
```

---

### Left Panel — Scenario Selector & Slider

- List Finance Manager's available scenarios as clickable cards
- Clicking a card sets the `multiplier` state and triggers the `/impact` call
- Color coding:
  - `multiplier < 1.0` → orange/red card border
  - `multiplier >= 1.0` → green card border
  - Active scenario → solid orange border + `ACTIVE` badge (already in screenshot)
- Below the cards: the custom slider (Conservative −50% to Growth +50%)
  - Slider movement updates projected budget in real time
  - Debounce: wait **400ms** after slider stops before calling `/impact` (prevents API flood)
- Show the projected budget prominently: `"Projected Budget: ₱130,000"`

---

### Right Panel — Proposal Impact Table (MISSING — build this)

**Header bar:**

```
Under this scenario, your ₱200,000 budget becomes ₱130,000 (−35%)
[RED BADGE] ₱70,000 Shortfall
```

**Table columns:**

| Priority | Proposal Title | Requested | Current Status | Scenario Status | Your Decision |
|----------|---------------|-----------|----------------|-----------------|---------------|
| 1 | Q3 Marketing Campaign | ₱45,000 | Approved | ✅ Survives | — |
| 3 | New Laptops | ₱60,000 | Pending | ⚠ At Risk | [Dropdown] |

- `Scenario Status` column:
  - Green badge `✅ Survives` for proposals that fit under the scenario budget
  - Orange/red badge `⚠ At Risk` for proposals that don't fit
- `Your Decision` column:
  - Only appears on `AtRisk` rows
  - Dropdown options: `Keep (flag for reallocation)` | `Defer to next fiscal year` | `Cut entirely`
  - Survives rows show `—` (no decision needed)

**Summary footer row:**

```
Surviving: ₱85,000   |   At Risk: ₱115,000   |   Gap: ₱70,000
```

---

### Submit Scenario Pitch Button

- Enabled only when: at least one AtRisk proposal has a decision selected
- Clicking opens a **modal** (NOT `window.confirm` — Zero-Alert Policy)
- Modal contents:
  - **Pitch Title** — text input (required)
  - **Justification** — textarea (required, minimum 50 characters)
  - **Decision Summary** — read-only list of the dept head's Keep/Defer/Cut choices
  - **Submit** button → POST to `/api/dept-head/scenarios/pitch`
- On success: toast `"✅ Scenario Pitch submitted. Finance Manager has been notified."`
- After submission: button changes to `"📋 Pitch Submitted — View Response"`

---

### Past Pitches Section (collapsible, below main panels)

Show a collapsible accordion at the bottom titled **"My Submitted Pitches"**.

Each pitch shows:
- Scenario name + date submitted
- Status badge: `Pending Review` (grey) or `Acknowledged` (green)
- Justification text (truncated, expandable)

---

## Integration with Dept Head Overview Tab

Add a contextual banner on the **Overview tab** that appears **only when a restrictive
scenario (multiplier < 1.0) is active**:

```
⚠ Active Budget Scenario: "Conservative Cut Q3" reduces your allocation by 35%.
  3 of your proposals are at risk.  [Review in Scenario Planning →]
```

- This is dept-specific (different from the global Finance Manager banner)
- Clicking the link navigates to the Scenarios tab
- Fetch the active scenario and run impact calculation on Overview load to get the count
- If no restrictive scenario is active, this banner does not render at all

---

## Frontend API additions (`deptHeadApi.ts`)

```typescript
// ── Types ────────────────────────────────────────────────────────────────────

export interface ProposalImpact {
  proposalId:      number;
  title:           string;
  requestedAmount: number;
  priorityRank:    number;
  status:          string;
  scenarioStatus:  'Survives' | 'AtRisk';
}

export interface ScenarioImpactResult {
  currentBudget:       number;
  scenarioBudget:      number;
  adjustmentMultiplier: number;
  gap:                 number;
  totalSurviving:      number;
  totalAtRisk:         number;
  proposals:           ProposalImpact[];
}

export interface PitchDecision {
  proposalId: number;
  decision:   'Keep' | 'Defer' | 'Cut';
}

export interface ScenarioPitchRequest {
  scenarioId:        number | null;
  customMultiplier:  number;
  pitchTitle:        string;
  justification:     string;
  proposalDecisions: PitchDecision[];
}

export interface SubmittedPitch {
  pitchId:       number;
  pitchTitle:    string;
  scenarioTitle: string;
  submittedAt:   string;
  status:        string;
  justification: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export const getScenarioImpact = (multiplier: number, fiscalYear: number) =>
  apiFetch<ScenarioImpactResult>(
    `/dept-head/scenarios/impact?multiplier=${multiplier}&fiscalYear=${fiscalYear}`
  );

export const submitScenarioPitch = (payload: ScenarioPitchRequest) =>
  apiFetch<{ success: boolean; pitchId: number }>('/dept-head/scenarios/pitch', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

export const getMyPitches = () =>
  apiFetch<SubmittedPitch[]>('/dept-head/scenarios/pitches');
```

---

## Critical Implementation Notes

| Rule | Detail |
|------|--------|
| Dept scoping | Always use `GetDepartmentIdAsync()` from `DeptHeadBaseController` |
| Priority ordering | `PriorityRank` 1 = highest (survives first). Null = treat as 4 (lowest) |
| Impact calculation | Must be server-side — not client-side — so Finance Manager sees same numbers |
| Zero-Alert Policy | No `window.confirm()` or `window.alert()` anywhere — use modal components |
| Toast feedback | Every action (pitch submit, slider change with result) triggers `addToast()` |
| Slider debounce | 400ms after slider stop before calling `/impact` endpoint |
| Fiscal year | Read from tenant's `FiscalYear` setting (already in settings API) |
| Scenario ownership | Dept Heads only READ Finance Manager scenarios and respond to them. Never set `BudgetScenario.IsActive` |
| Controller location | Add new endpoints to the existing `DeptHeadScenariosController.cs` |
| Migration | Only needed if adding `PitchDecisions` column — check if `ReviewNotes` JSON storage is sufficient first |
| Build check | Run `dotnet build` after backend changes — verify 0 errors before frontend work |
