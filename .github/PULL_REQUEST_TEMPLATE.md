## Description
Please summarize the changes and the related issue/feature motivation. Include relevant context for reviewers.

Fixes / Closes #(issue)

---

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Architectural / Refactor / Performance enhancement
- [ ] Documentation update

---

## Architectural Checklist
- [ ] **RBAC Verified**: Did you verify that Cashiers cannot access Owner-only endpoints?
- [ ] **ACID Sessions**: If modifying multi-document state, is it wrapped in a transaction session?
- [ ] **Zero-Emoji UI**: Are icons sourced from Lucide vector icons (`lucide-react`)?
- [ ] **Environment Safety**: No secrets or connection strings are hardcoded.

---

## Testing Verification
Please check the tests that you ran to verify your changes:
- [ ] `npm --prefix server run test:week3day5` (Full Integration Suite)
- [ ] `npm --prefix server run test:week2day1` (RBAC Middleware)
- [ ] `npm --prefix client run build` (Production client compilation)
- [ ] `npm --prefix client run lint` (Frontend linting)
- [ ] Manual smoke test in browser with Owner & Cashier accounts

---

## Screenshots / Evidence (if applicable)
Add UI screenshots or terminal test outputs here.
