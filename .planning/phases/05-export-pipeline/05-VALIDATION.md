---
phase: 5
slug: export-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom |
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
| 5-01-01 | 01 | 1 | EXP-01 | unit | `npx vitest run lib/export/__tests__/svg-export.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | EXP-02 | unit | `npx vitest run lib/export/__tests__/png-export.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | EXP-03 | unit | `npx vitest run lib/export/__tests__/pdf-export.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/export/__tests__/svg-export.test.ts` — stubs for EXP-01
- [ ] `lib/export/__tests__/png-export.test.ts` — stubs for EXP-02
- [ ] `lib/export/__tests__/pdf-export.test.ts` — stubs for EXP-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SVG opens in browser/Inkscape | EXP-01 | File rendering quality | Download SVG, open in new tab |
| PNG is crisp at 2x resolution | EXP-02 | Visual quality check | Download PNG, zoom to verify sharpness |
| PDF prints correctly | EXP-03 | Print layout verification | Download PDF, check landscape layout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
