# eBay QA Automation — Playwright Framework

> Automation test suite for the **eBay Related Best-Seller Products** feature on the Product Detail Page.

---

## 📋 Project Overview

This Playwright-based automation framework validates the "Related Best-Seller Products" section that appears on eBay wallet product pages. It maps directly to the manual test cases defined in the QA Skills Assessment.

| Item | Details |
|------|---------|
| **Feature Under Test** | Related Best-Seller Products on Product Detail Page |
| **Framework** | [Playwright](https://playwright.dev) (TypeScript) |
| **Test Architecture** | Page Object Model (POM) |
| **Browsers Supported** | Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari |

---

## 🗂️ Project Structure

```
ebay-qa-playwright/
├── tests/
│   └── relatedProducts.spec.ts     # All test cases (TC-001 to TC-023)
├── pages/
│   ├── ProductDetailPage.ts        # Page Object: eBay product detail page
│   └── SearchResultsPage.ts        # Page Object: eBay search results page
├── fixtures/
│   └── fixtures.ts                 # Extended Playwright fixtures (shared POM setup)
├── utils/
│   └── helpers.ts                  # Utility functions & constants
├── reports/                        # Auto-generated test reports (gitignored)
├── playwright.config.ts            # Playwright configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js **18+**
- npm **9+**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ebay-qa-playwright.git
cd ebay-qa-playwright

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install
```

---

## ▶️ Running Tests

```bash
# Run all tests (headless)
npm test

# Run all tests in headed mode (visible browser)
npm run test:headed

# Run with Playwright's interactive UI mode
npm run test:ui

# Run only smoke tests
npm run test:smoke

# Run only regression tests
npm run test:regression

# Run only negative / edge case tests
npm run test:negative

# View HTML report after a run
npm run test:report
```

### Run by browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Mobile Safari only
npx playwright test --project=mobile-safari
```

### Run a specific test file

```bash
npx playwright test tests/relatedProducts.spec.ts
```

### Run a specific test by title

```bash
npx playwright test --grep "TC-002"
```

---

## ⚙️ Configuration

### `playwright.config.ts`

| Setting | Value | Notes |
|---------|-------|-------|
| `baseURL` | `https://www.ebay.com` | Update to staging URL for CI |
| `timeout` | 45 seconds | Per test timeout |
| `retries` | 1 (local), 2 (CI) | Auto-retry on failure |
| `workers` | 1 | Sequential to avoid rate-limiting |
| `reporter` | HTML + JSON + List | Reports saved to `reports/` |

### Updating Test Product IDs

Open `utils/helpers.ts` and update `TEST_PRODUCT_IDS` with valid eBay item IDs (preferably from a staging environment):

```typescript
export const TEST_PRODUCT_IDS = {
  standardWallet: '195060516753',    // Update with staging item ID
  sparseWallet: '195060516754',      // Wallet with < 6 best sellers in category
  noBestSellersWallet: '195060516755', // Wallet with 0 best sellers
};
```

---

## 🧪 Test Cases Covered

| TC ID | Description | Type | Tag |
|-------|-------------|------|-----|
| TC-001 | Related products section is visible on product page | Positive | @smoke @regression |
| TC-002 | No more than 6 related products are displayed | Positive | @smoke @regression |
| TC-004 | Related products are within acceptable price range | Positive | @regression |
| TC-006 | Clicking a related product navigates correctly | Positive | @smoke @regression |
| TC-007 | Related product thumbnails load without errors | Positive | @regression |
| TC-008 | Product cards display title and price | Positive | @smoke @regression |
| TC-009 | Section has a visible header | Positive | @regression |
| TC-010 | Section is responsive on mobile viewport | Positive | @regression |
| TC-012 | Exactly 6 shown when many best sellers exist | Positive | @regression |
| TC-013 | Main product does not appear in related products | Positive | @regression |
| TC-015 | Fewer than 6 best sellers — only available shown | Negative | @negative @regression |
| TC-016 | Handles slow network gracefully | Negative | @negative |
| TC-017 | Count never exceeds 6 (hard limit) | Negative | @negative @regression |
| TC-019 | Broken images do not break layout | Negative | @negative |
| TC-021 | Guest user prompted to sign in on watchlist click | Negative | @negative @regression |
| TC-023 | XSS in product title is safely escaped | Negative | @negative |

---

## 🏗️ Architecture Decisions

### Page Object Model (POM)

All page interactions are encapsulated in `pages/`. Tests never interact with raw selectors directly — this makes the suite resilient to minor UI changes.

```
Test file
  └── uses fixtures (auto-provides POM instances)
        └── calls Page Object methods
              └── interacts with the browser via Playwright
```

### Flexible Selectors

eBay uses dynamic class names that change with deployments. Selectors in `ProductDetailPage.ts` use multiple fallback selectors to reduce brittleness:

```typescript
this.relatedProductsSection = page.locator(
  '[data-testid="related-items"], .s-similar-items, ' +
  'section:has-text("Similar sponsored items"), .merch-module'
).first();
```

### Test Fixtures

`fixtures/fixtures.ts` extends the base `test` object to auto-inject Page Objects into every test, keeping test files clean.

---

## 🌐 CI/CD Integration

### GitHub Actions example

```yaml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: reports/
```

---

## 📊 Test Reports

After running tests, view the HTML report:

```bash
npm run test:report
```

The report is saved to `reports/html/index.html` and includes:
- Test pass/fail status
- Screenshots on failure
- Video recordings on retry
- Trace files for debugging

---

## ⚠️ Important Notes

1. **Staging vs Production**: Point `baseURL` in `playwright.config.ts` to your staging environment in CI. Running against production may trigger anti-bot protections.

2. **Anti-bot Measures**: eBay may throttle or block automated requests. Use authenticated sessions, add delays between tests, and run with `workers: 1` (already the default).

3. **Test Data**: TC-015 and related edge cases require pre-seeded test data. Update `TEST_PRODUCT_IDS` in `utils/helpers.ts` accordingly.

4. **Network Tests (TC-016)**: The network throttle test uses Chrome DevTools Protocol (CDP) and only works reliably in Chromium. The test auto-skips on other browsers.

---

## 📝 Related Documents

- `QA_Manual_Testing_Document.docx` — Full manual test strategy, test cases, and bug reports

---

## 👤 Author

QA Engineer — February 2026
