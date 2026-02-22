import { test as base } from '@playwright/test';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { SearchResultsPage } from '../pages/SearchResultsPage';

/**
 * Extended test fixtures for eBay QA suite.
 * Provides pre-initialized Page Objects to every test.
 */
type EbayFixtures = {
  productDetailPage: ProductDetailPage;
  searchResultsPage: SearchResultsPage;
  consoleErrors: string[];
};

export const test = base.extend<EbayFixtures>({
  productDetailPage: async ({ page }, use) => {
    const pdp = new ProductDetailPage(page);
    await use(pdp);
  },

  searchResultsPage: async ({ page }, use) => {
    const srp = new SearchResultsPage(page);
    await use(srp);
  },

  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await use(errors);
  },
});

export { expect } from '@playwright/test';
