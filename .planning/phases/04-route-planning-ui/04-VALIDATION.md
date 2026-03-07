---
phase: 4
slug: route-planning-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | ROUTE-02 | unit | `npx vitest run components/route-planner/__tests__/StopList.test.tsx` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | ROUTE-03 | unit | `npx vitest run lib/pathfinding/__tests__/distance.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | ROUTE-03/04 | unit | `npx vitest run components/route-planner/__tests__/TripSummary.test.tsx` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | ROUTE-04 | unit | `npx vitest run components/route-planner/__tests__/SpeedControl.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `components/route-planner/__tests__/StopList.test.tsx` — stubs for ROUTE-02
- [ ] `lib/pathfinding/__tests__/distance.test.ts` — stubs for ROUTE-03
- [ ] `components/route-planner/__tests__/TripSummary.test.tsx` — stubs for ROUTE-03
- [ ] `components/route-planner/__tests__/SpeedControl.test.tsx` — stubs for ROUTE-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop feel | ROUTE-02 | Subjective UX quality | Drag stops in panel, verify smooth reorder |
| Speed slider responsiveness | ROUTE-04 | Visual feedback quality | Adjust slider, verify time updates feel instant |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
