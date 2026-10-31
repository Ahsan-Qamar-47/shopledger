# Security Policy

ShopLedger takes the security of financial ledgers, inventory records, and user authentication seriously. This document outlines our security policies and procedures for reporting security vulnerabilities.

---

## Supported Versions

Only the latest major version receives proactive security updates and patches:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x: (Deprecated)   |

---

## Reporting a Vulnerability

If you discover a security vulnerability within ShopLedger, please **DO NOT** open a public issue. Publicly disclosing a flaw before a fix is available puts user data at risk.

Instead, report vulnerabilities privately by emailing the maintainer:
- **Email**: `ahsanqamar926@gmail.com`
- **Subject**: `[SECURITY VULNERABILITY] ShopLedger - <Brief Summary>`

### What to Include in Your Report:
1. Detailed description of the vulnerability.
2. Step-by-step reproduction steps or a minimal proof of concept (PoC).
3. The potential impact (e.g., privilege escalation from Cashier to Owner, unauthorized data access, transaction bypass).
4. Any proposed remediations if available.

### Our Commitment:
- We acknowledge receipt of security reports within **48 hours**.
- We will coordinate disclosure timelines and validate fixes in a private patch branch before public release.
- Maintainers will credit researchers in release notes (unless anonymity is requested).

---

## Security Architecture & Best Practices

ShopLedger V2 incorporates several defense-in-depth mechanisms:

1. **Role-Based Access Control (RBAC)**:
   - Server-side route middleware (`middleware/rbac.js`) enforces strict authorization boundaries.
   - Client-side navigation guards prevent UI rendering of unauthorized views, complemented by an Axios response interceptor that catches any HTTP 403 Forbidden responses.
2. **ACID Transaction Guarantees**:
   - Multi-document transactions (`mongoose.startSession()`) prevent race conditions, orphan balance updates, and negative inventory states.
3. **Injection Mitigation**:
   - `express-mongo-sanitize` strips `$` and `.` operators from client inputs to prevent NoSQL injection attacks.
   - Parameterized Mongoose queries throughout all controllers.
4. **Rate Limiting & Headers**:
   - `express-rate-limit` prevents brute-force attempts on authentication and registration endpoints.
   - `helmet` applies secure HTTP headers (CSP, HSTS, X-Frame-Options).
5. **Credential Storage**:
   - User passwords are salted and hashed using `bcrypt` (10 rounds). Passwords are never stored in plain text.
