---
phase: 3
slug: pathfinding-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 with jsdom |
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
| 3-01-01 | 01 | 1 | ROUTE-01 | unit | `npx vitest run lib/pathfinding/__tests__/astar.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | ROUTE-01 | integration | `npx vitest run lib/pathfinding/__tests__/route.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | ROUTE-01 | unit | `npx vitest run lib/pathfinding/__tests__/simplify.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | VIZ-03 | unit | `npx vitest run components/map/__tests__/RouteLayer.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/pathfinding/__tests__/astar.test.ts` — stubs for ROUTE-01 (A* correctness, water-only, performance)
- [ ] `lib/pathfinding/__tests__/route.test.ts` — stubs for ROUTE-01 (waterway traversal integration)
- [ ] `lib/pathfinding/__tests__/simplify.test.ts` — stubs for path simplification
- [ ] `components/map/__tests__/RouteLayer.test.tsx` — stubs for VIZ-03 (route rendering)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Route visual smoothness | VIZ-03 | Subjective visual quality | Open app, compute route between distant ports, verify line looks natural |
| Arrow direction correctness | VIZ-03 | Visual inspection | Verify arrows point from start to end port along the route |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
