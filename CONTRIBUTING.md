# Contributing to ShopLedger

Thank you for your interest in contributing to **ShopLedger**! We welcome contributions from developers of all skill levels. To ensure code quality, reliability, and smooth collaboration, please review the following engineering guidelines before submitting code.

---

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please maintain professionalism, constructive feedback, and mutual respect in all interactions.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x+`
- **npm**: `v9.x+`
- **MongoDB**: Access to a MongoDB Atlas cluster (M0 or higher) or a local MongoDB 5.0+ replica set (replica sets are required for Mongoose ACID sessions).
- **Git**: Configured with your name and email.

### 2. Fork & Clone
1. Fork the repository to your GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/shopledger.git
   cd shopledger
   ```
3. Install dependencies across both client and server:
   ```bash
   npm run install:all
   ```

### 3. Environment Configuration
Copy the template files and fill in your local secrets:
```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```
> **Warning**: Never commit `.env` files to git. All credentials must remain strictly in local `.env` files.

---

## Development Workflow

### Branch Strategy
Create a feature branch branching off `main`:
- `feat/<feature-name>`: New user-facing or architectural features
- `fix/<bug-name>`: Bug fixes and patches
- `docs/<doc-name>`: Documentation, guides, or README updates
- `test/<test-name>`: New unit, integration, or E2E tests
- `refactor/<scope>`: Code cleanup without behavior changes

Example:
```bash
git checkout -b feat/export-tax-reports
```

### Commit Convention
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary in imperative mood>

[optional detailed body explaining context and rationale]

[optional footer(s), e.g. Closes #12]
```

#### Allowed Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation-only updates
- `style`: Formatting, missing semicolons, etc. (no code logic change)
- `refactor`: Refactoring code without altering features or bug fixes
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Tooling, build config, dependency bumps

#### Examples:
```bash
git commit -m "feat(expenses): add category breakdown aggregation pipeline"
git commit -m "fix(auth): prevent cashier token refresh on deactivated accounts"
git commit -m "docs(readme): add sequence diagram for ACID transaction rollback"
```

---

## Quality Standards & Testing

Before opening a Pull Request, verify that all automated suites pass:

```bash
# 1. Run full backend integration test suite
npm --prefix server run test:week3day5

# 2. Run RBAC isolation tests
npm --prefix server run test:week2day1
npm --prefix server run test:week2day5

# 3. Verify client production build compiles cleanly
npm --prefix client run build

# 4. Check client linting
npm --prefix client run lint
```

### Architectural Principles
- **Strict Role-Based Access Control**: Never expose cost prices, profit margins, or shop-wide analytics to `Cashier` roles. Cashier endpoints must remain scoped strictly to operational receivables.
- **ACID Atomicity**: Any operation modifying inventory and customer balance simultaneously must wrap inside `session.startTransaction()` and include explicit `abortTransaction()` on catch.
- **Zero-Emoji UI Policy**: Use standard Lucide vector icons (`lucide-react`) rather than emoji characters to maintain an enterprise feel.
- **No Hardcoded Constants**: Ensure ports, URLs, secrets, and connection strings are loaded via environment variables.

---

## Submitting a Pull Request (PR)

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Navigate to the main repository and open a Pull Request targeting `main`.
3. Complete the PR template checklist:
   - Provide a clear description of the problem and solution.
   - Attach screenshots or GIFs for UI modifications.
   - List the tests executed and their results.
4. Wait for CI checks to pass. An engineer will review your pull request.

---

## Questions & Support
For bugs or feature proposals, please open an issue in the [GitHub Issue Tracker](https://github.com/Ahsan-Qamar-47/shopledger/issues).
