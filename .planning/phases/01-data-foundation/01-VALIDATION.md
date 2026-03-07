---
phase: 1
slug: data-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | DATA-01 | unit | `npx vitest run lib/geo/__tests__/coastlines.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | DATA-02 | unit | `npx vitest run lib/grid/__tests__/waterways.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | DATA-02 | unit | `npx vitest run lib/grid/__tests__/performance.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | DATA-03 | unit | `npx vitest run lib/ports/__tests__/ports.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | DATA-03 | unit | `npx vitest run lib/ports/__tests__/search.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-06 | 01 | 1 | DATA-01/02/03 | integration | `npx vitest run lib/ports/__tests__/port-grid.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/geo/__tests__/coastlines.test.ts` — stubs for DATA-01 (coastline completeness, file size)
- [ ] `lib/grid/__tests__/waterways.test.ts` — stubs for DATA-02 (waterway navigability)
- [ ] `lib/grid/__tests__/performance.test.ts` — stubs for DATA-02 (grid load time)
- [ ] `lib/ports/__tests__/ports.test.ts` — stubs for DATA-03 (port data completeness)
- [ ] `lib/ports/__tests__/search.test.ts` — stubs for DATA-03 (search functionality)
- [ ] `lib/ports/__tests__/port-grid.test.ts` — stubs for DATA-01/02/03 integration (ports on water)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual coastline rendering quality | DATA-01 | Subjective visual inspection | Load map in browser, verify all 5 Great Lakes render with recognizable coastlines and major islands visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
