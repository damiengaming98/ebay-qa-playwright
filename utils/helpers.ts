import { Page } from '@playwright/test';

/**
 * Utility helpers for the eBay QA test suite
 */

/**
 * Check if a price is within the acceptable range of a base price
 * @param basePrice - Main product price
 * @param comparePrice - Related product price to validate
 * @param tolerancePercent - Allowed percentage difference (default 30%)
 */
export function isPriceInRange(
  basePrice: number,
  comparePrice: number,
  tolerancePercent = 30
): boolean {
  if (basePrice <= 0 || comparePrice <= 0) return false;
  const minPrice = basePrice * (1 - tolerancePercent / 100);
  const maxPrice = basePrice * (1 + tolerancePercent / 100);
  return comparePrice >= minPrice && comparePrice <= maxPrice;
}

/**
 * Throttle network speed using CDP (Chrome DevTools Protocol)
 * Requires Chromium-based browser context
 */
export async function throttleNetworkToSlow3G(page: Page): Promise<void> {
  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send('Network.enable');
  await cdpSession.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (500 * 1024) / 8, // 500 Kbps
    uploadThroughput: (500 * 1024) / 8,
    latency: 400,
  });
}

/**
 * Disable network to simulate offline state
 */
export async function disableNetwork(page: Page): Promise<void> {
  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send('Network.enable');
  await cdpSession.send('Network.emulateNetworkConditions', {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  });
}

/**
 * Restore normal network conditions
 */
export async function restoreNetwork(page: Page): Promise<void> {
  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send('Network.disable');
}

/**
 * Wait for all images on the page to load
 */
export async function waitForAllImages(page: Page, timeout = 10000): Promise<void> {
  await page.waitForFunction(
    () => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete);
    },
    { timeout }
  );
}

/**
 * Extract numeric price from a price string like "$24.99", "US $24.99"
 */
export function extractPrice(priceString: string): number {
  const cleaned = priceString.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

/**
 * Scroll the page to the bottom gradually
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * eBay product URL patterns for test data
 * These are representative wallet item IDs — update with valid staging IDs
 */
export const TEST_PRODUCT_IDS = {
  // Standard wallet with multiple best sellers in category
  standardWallet: '195060516753',
  // Wallet in category with fewer than 6 best sellers (seed with test data)
  sparseWallet: '195060516754',
  // Wallet in category with 0 best sellers
  noBestSellersWallet: '195060516755',
} as const;

/**
 * Maximum number of related products allowed per business requirement
 */
export const MAX_RELATED_PRODUCTS = 6;

/**
 * Price tolerance percentage for related products range check
 */
export const PRICE_TOLERANCE_PERCENT = 30;
