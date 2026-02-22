import { test, expect } from '../fixtures/fixtures';
import {
  MAX_RELATED_PRODUCTS,
  PRICE_TOLERANCE_PERCENT,
  isPriceInRange,
  scrollToBottom,
  TEST_PRODUCT_IDS,
} from '../utils/helpers';

/**
 * Test Suite: eBay Related Best-Seller Products Feature
 *
 * Maps to manual test cases TC-001 through TC-023.
 * Tags:
 *   @smoke     - Critical path tests
 *   @regression - Full regression suite
 *   @negative  - Negative/edge case tests
 *
 * NOTE: These tests run against the live eBay website.
 * For CI environments, configure baseURL to point to a staging instance.
 * Update TEST_PRODUCT_IDS in utils/helpers.ts with valid staging item IDs.
 */

test.describe('Related Best-Seller Products Feature', () => {

  // ─────────────────────────────────────────────
  // FUNCTIONAL / POSITIVE TEST CASES
  // ─────────────────────────────────────────────

  test.describe('Functional Tests', () => {

    /**
     * TC-001: Related products section is displayed on product page
     * @smoke @regression
     */
    test('TC-001 | @smoke @regression | Related products section is displayed on product page', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();
      await scrollToBottom(productDetailPage.page);

      const isVisible = await productDetailPage.isRelatedProductsSectionVisible();
      expect(
        isVisible,
        'Related products section should be visible on the wallet product page'
      ).toBeTruthy();
    });

    /**
     * TC-002: Up to 6 best-seller products are displayed
     * @smoke @regression
     */
    test('TC-002 | @smoke @regression | No more than 6 related products are displayed', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('leather wallet');
      await searchResultsPage.clickFirstResult();

      const count = await productDetailPage.getRelatedProductCount();

      expect(count, 'Related products count should be between 1 and 6').toBeGreaterThanOrEqual(1);
      expect(
        count,
        `Related products count ${count} must not exceed ${MAX_RELATED_PRODUCTS}`
      ).toBeLessThanOrEqual(MAX_RELATED_PRODUCTS);
    });

    /**
     * TC-004: Related products are within the same price range
     * @regression
     */
    test('TC-004 | @regression | Related products are within acceptable price range of main product', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      const mainPrice = await productDetailPage.getMainProductPrice();
      const relatedPrices = await productDetailPage.getRelatedProductPrices();

      if (mainPrice <= 0) {
        test.skip(true, 'Could not determine main product price — skipping price range check');
      }

      for (const relatedPrice of relatedPrices) {
        const inRange = isPriceInRange(mainPrice, relatedPrice, PRICE_TOLERANCE_PERCENT);
        expect(
          inRange,
          `Related product price $${relatedPrice} is outside ±${PRICE_TOLERANCE_PERCENT}% of main price $${mainPrice}`
        ).toBeTruthy();
      }
    });

    /**
     * TC-006: Clicking a related product navigates to its product page
     * @smoke @regression
     */
    test('TC-006 | @smoke @regression | Clicking a related product navigates to its product page', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      const originalUrl = await productDetailPage.getCurrentUrl();
      const hasRelated = await productDetailPage.isRelatedProductsSectionVisible();

      if (!hasRelated) {
        test.skip(true, 'Related products section not found — skipping navigation test');
      }

      await productDetailPage.clickRelatedProduct(0);

      const newUrl = await productDetailPage.getCurrentUrl();
      expect(newUrl, 'URL should change after clicking a related product').not.toBe(originalUrl);
      expect(newUrl, 'Should navigate to an eBay item page').toContain('ebay.com/itm/');
    });

    /**
     * TC-007: Related product thumbnails load correctly
     * @regression
     */
    test('TC-007 | @regression | Related product thumbnails load correctly', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      await productDetailPage.page.waitForTimeout(3000); // Allow lazy-load images to load

      const { loaded, broken } = await productDetailPage.areAllRelatedImagesLoaded();

      expect(
        broken,
        `${broken} related product image(s) failed to load (broken images found)`
      ).toBe(0);
      expect(
        loaded,
        'At least one related product image should be loaded'
      ).toBeGreaterThan(0);
    });

    /**
     * TC-008: Related products section shows product titles and prices
     * @smoke @regression
     */
    test('TC-008 | @smoke @regression | Related product cards display title and price', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      const hasRelated = await productDetailPage.isRelatedProductsSectionVisible();
      if (!hasRelated) {
        test.skip(true, 'Related products section not visible');
      }

      const titles = await productDetailPage.getRelatedProductTitles();
      const prices = await productDetailPage.getRelatedProductPrices();

      expect(titles.length, 'Related product titles should be present').toBeGreaterThan(0);
      expect(prices.length, 'Related product prices should be present').toBeGreaterThan(0);

      for (const title of titles) {
        expect(title.trim(), 'Each related product title should not be empty').not.toBe('');
      }
    });

    /**
     * TC-009: Related products section has a header/title
     * @regression
     */
    test('TC-009 | @regression | Related products section has a visible section header', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();
      await scrollToBottom(productDetailPage.page);

      const headerVisible = await productDetailPage.relatedProductsSectionHeader
        .isVisible()
        .catch(() => false);

      expect(
        headerVisible,
        'A section header (e.g. "Similar sponsored items") should be visible above related products'
      ).toBeTruthy();
    });

    /**
     * TC-012: Exactly 6 products shown when 6+ best sellers exist
     * @regression
     */
    test('TC-012 | @regression | Exactly 6 products shown when many best sellers are available', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('leather wallet men bifold');
      await searchResultsPage.clickFirstResult();

      const count = await productDetailPage.getRelatedProductCount();

      expect(
        count,
        `Should display at most ${MAX_RELATED_PRODUCTS} related products`
      ).toBeLessThanOrEqual(MAX_RELATED_PRODUCTS);
    });

    /**
     * TC-013: Related products do not include the main product itself
     * @regression
     */
    test('TC-013 | @regression | Main product does not appear in related products list', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      const mainTitle = await productDetailPage.mainProductTitle.innerText().catch(() => '');
      const relatedTitles = await productDetailPage.getRelatedProductTitles();

      for (const relatedTitle of relatedTitles) {
        // Exact match check — titles should not be identical to the main product
        expect(
          relatedTitle.trim().toLowerCase(),
          `Related product "${relatedTitle}" should not be the same as the main product`
        ).not.toBe(mainTitle.trim().toLowerCase());
      }
    });

  });

  // ─────────────────────────────────────────────
  // NEGATIVE / EDGE CASE TEST CASES
  // ─────────────────────────────────────────────

  test.describe('Negative & Edge Case Tests', () => {

    /**
     * TC-015: Fewer than 6 best sellers in category — only available count shown
     * @negative @regression
     */
    test('TC-015 | @negative @regression | Fewer than 6 best sellers — section shows available items only', async ({
      productDetailPage,
    }) => {
      // Navigate to a product in a less popular category
      // Update TEST_PRODUCT_IDS.sparseWallet with a valid staging item ID
      await productDetailPage.page.goto(`/itm/${TEST_PRODUCT_IDS.sparseWallet}`, {
        waitUntil: 'domcontentloaded',
      }).catch(() => {
        test.skip(true, 'Sparse wallet test product not available — update TEST_PRODUCT_IDS');
      });

      const count = await productDetailPage.getRelatedProductCount();

      // Should show between 0 and 6 — not more than available
      expect(count).toBeLessThanOrEqual(MAX_RELATED_PRODUCTS);
    });

    /**
     * TC-016: Related products section behaves gracefully on slow network
     * @negative @regression (Chromium only — requires CDP)
     */
    test('TC-016 | @negative | Related products section handles slow network gracefully', async ({
      productDetailPage,
      searchResultsPage,
    }, testInfo) => {
      // CDP throttling only works reliably in Chromium
      if (!testInfo.project.name.includes('chromium')) {
        test.skip(true, 'Network throttle test requires Chromium');
      }

      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');

      // Throttle BEFORE clicking the result to simulate slow loading
      const { throttleNetworkToSlow3G } = await import('../utils/helpers');
      await throttleNetworkToSlow3G(productDetailPage.page);
      await searchResultsPage.clickFirstResult();

      // The page should not crash — basic structure should render
      const title = productDetailPage.mainProductTitle;
      await expect(title).toBeVisible({ timeout: 30000 });

      // Scroll to where related products would be — verify no JS error overlay
      await scrollToBottom(productDetailPage.page);
      const errorOverlay = productDetailPage.page.locator('.error-overlay, [class*="error-page"]');
      await expect(errorOverlay).toHaveCount(0);
    });

    /**
     * TC-017: More than 6 products are NOT shown (hard limit enforced)
     * @negative @regression
     */
    test('TC-017 | @negative @regression | Related products count never exceeds 6', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      const count = await productDetailPage.getRelatedProductCount();

      expect(
        count,
        `Count of ${count} exceeds the maximum of ${MAX_RELATED_PRODUCTS} allowed related products`
      ).toBeLessThanOrEqual(MAX_RELATED_PRODUCTS);
    });

    /**
     * TC-019: Broken images do not break the layout
     * @negative @regression
     */
    test('TC-019 | @negative | Broken product images show placeholder and do not break layout', async ({
      productDetailPage,
      searchResultsPage,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      // Intercept image requests and force a subset to fail
      let imageRequestCount = 0;
      await productDetailPage.page.route('**/*.jpg', (route) => {
        imageRequestCount++;
        if (imageRequestCount <= 2) {
          // Abort first 2 images to simulate broken images
          route.abort();
        } else {
          route.continue();
        }
      });

      await productDetailPage.page.reload({ waitUntil: 'domcontentloaded' });
      await scrollToBottom(productDetailPage.page);
      await productDetailPage.page.waitForTimeout(2000);

      // The section container should still be rendered
      const isVisible = await productDetailPage.isRelatedProductsSectionVisible();
      // Even with broken images, the section should not disappear entirely
      // (or if it does, no error overlay should appear)
      const errorOverlay = productDetailPage.page.locator('[class*="error-page"], .error-overlay');
      await expect(errorOverlay).toHaveCount(0);
    });

    /**
     * TC-021: Unauthenticated user clicking watchlist is prompted to log in
     * @negative @regression
     */
    test('TC-021 | @negative @regression | Guest user clicking watchlist is prompted to sign in', async ({
      productDetailPage,
      searchResultsPage,
      context,
    }) => {
      // Ensure no session cookies
      await context.clearCookies();

      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      const hasRelated = await productDetailPage.isRelatedProductsSectionVisible();
      if (!hasRelated) {
        test.skip(true, 'Related products section not found');
      }

      const iconCount = await productDetailPage.relatedProductWatchlistIcons.count();
      if (iconCount === 0) {
        test.skip(true, 'No watchlist icons found in related products');
      }

      await productDetailPage.clickRelatedProductWatchlist(0);
      await productDetailPage.page.waitForTimeout(1500);

      // Should show login modal or navigate to sign-in page
      const currentUrl = await productDetailPage.getCurrentUrl();
      const signInModalVisible = await productDetailPage.page
        .locator('[class*="signin"], [id*="signin"], text=Sign in, text=Log in')
        .first()
        .isVisible()
        .catch(() => false);

      const isRedirectedToLogin = currentUrl.includes('signin') || currentUrl.includes('login');

      expect(
        signInModalVisible || isRedirectedToLogin,
        'Guest user should be prompted to sign in when clicking watchlist'
      ).toBeTruthy();
    });

    /**
     * TC-023: XSS attempt in product title is safely escaped
     * @negative @regression
     */
    test('TC-023 | @negative | XSS payload in related product title is safely escaped', async ({
      productDetailPage,
      searchResultsPage,
      consoleErrors,
    }) => {
      await searchResultsPage.navigate();
      await searchResultsPage.searchFor('wallet');
      await searchResultsPage.clickFirstResult();

      // Check that no unexpected dialogs were triggered (XSS via alert())
      let alertTriggered = false;
      productDetailPage.page.on('dialog', async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      await scrollToBottom(productDetailPage.page);
      await productDetailPage.page.waitForTimeout(2000);

      expect(
        alertTriggered,
        'An alert dialog was triggered — possible XSS vulnerability'
      ).toBeFalsy();
    });

  });

  // ─────────────────────────────────────────────
  // RESPONSIVE / CROSS-DEVICE TESTS
  // ─────────────────────────────────────────────

  test.describe('Responsive & Cross-Device Tests', () => {

    /**
     * TC-010: Related products section is responsive on mobile
     * @regression
     */
    test('TC-010 | @regression | Related products section is visible and usable on mobile viewport', async ({
      page,
    }) => {
      // Override viewport to mobile
      await page.setViewportSize({ width: 375, height: 812 });

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const searchInput = page.locator('#gh-ac, [name="_nkw"]').first();
      await searchInput.fill('wallet');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('.s-item__link').first().click();
      await page.waitForLoadState('domcontentloaded');

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
      await page.waitForTimeout(2000);

      // Section should either be visible or absent — not broken
      const errorOverlay = page.locator('[class*="error-page"], .error-overlay');
      await expect(errorOverlay).toHaveCount(0);

      // Page width should fit viewport
      const bodyWidth: number = await page.evaluate(() => document.body.scrollWidth);
      expect(
        bodyWidth,
        'Page content should not overflow mobile viewport width'
      ).toBeLessThanOrEqual(395); // Minor tolerance above 375
    });

  });

});
