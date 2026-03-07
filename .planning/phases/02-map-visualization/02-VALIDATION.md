---
phase: 2
slug: map-visualization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom |
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
| 2-01-01 | 01 | 1 | VIZ-01 | unit | `npx vitest run components/map/__tests__/NauticalMap.test.tsx` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | VIZ-01 | unit | `npx vitest run components/map/__tests__/use-map-projection.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | VIZ-01 | unit | `npx vitest run components/map/__tests__/GraticuleLayer.test.tsx` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | VIZ-02 | unit | `npx vitest run components/map/__tests__/PortLayer.test.tsx` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | VIZ-02 | unit | `npx vitest run components/map/__tests__/PortLayer.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `components/map/__tests__/NauticalMap.test.tsx` — stubs for VIZ-01 (overall map structure, SVG presence)
- [ ] `components/map/__tests__/use-map-projection.test.ts` — stubs for VIZ-01 (projection fitting)
- [ ] `components/map/__tests__/GraticuleLayer.test.tsx` — stubs for VIZ-01 (graticule rendering)
- [ ] `components/map/__tests__/PortLayer.test.tsx` — stubs for VIZ-02 (port rendering, selection, hover)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nautical chart visual quality | VIZ-01 | Subjective visual — parchment texture, compass rose aesthetics | Open app in browser, verify nautical styling looks polished |
| Port marker visibility at scale | VIZ-02 | Visual density assessment | Verify 86 markers don't overlap excessively, labels readable on hover |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
