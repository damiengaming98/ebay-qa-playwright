import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for eBay Search Results Page
 */
export class SearchResultsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resultItems: Locator;
  readonly firstResultLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchInput = page.locator('#gh-ac, [name="_nkw"]').first();
    this.searchButton = page.locator('#gh-btn, [type="submit"]').first();
    this.resultItems = page.locator('.s-item:not(.s-item--placeholder), [data-testid="s-item"]');
    this.firstResultLink = page.locator(
      'a.s-item__link, ' +
      '.s-item__info > a, ' +
      '.s-item__image-wrapper > a, ' +
      'a[href*="/itm/"]'
    ).first();
  }

  async navigate(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async searchFor(term: string): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getResultCount(): Promise<number> {
    return await this.resultItems.count();
  }

  async clickFirstResult(): Promise<void> {
    // Wait for results to stabilize
    await this.page.waitForTimeout(2000);
    await this.firstResultLink.waitFor({ state: 'visible', timeout: 10000 });

    // Extract real item ID and navigate to a clean URL to avoid tracking/redirect errors
    // eBay item IDs are typically 12 digits. We look for 10-15 digits to be safe.
    const href = await this.firstResultLink.getAttribute('href');
    const itemIdMatch = href?.match(/\/itm\/(\d{10,15})/);
    const isPlaceholder = itemIdMatch?.[1] === '123456';

    if (itemIdMatch && !isPlaceholder) {
      const itemId = itemIdMatch[1];
      console.log(`Navigating to clean item URL: https://www.ebay.com/itm/${itemId}`);
      await this.page.goto(`https://www.ebay.com/itm/${itemId}`, { waitUntil: 'domcontentloaded' });
    } else if (href && !href.includes('123456')) {
      // Fallback to full href if ID extraction fails or it's not a known placeholder
      const absoluteUrl = href.startsWith('http') ? href : `https://www.ebay.com${href}`;
      await this.page.goto(absoluteUrl, { waitUntil: 'domcontentloaded' });
    } else {
      // If we're stuck with a placeholder, try to click a different result or just click and hope
      await this.firstResultLink.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  async clickResultByIndex(index: number): Promise<void> {
    const selector = 'a.s-item__link, .s-item__info > a, .s-item__image-wrapper > a, a[href*="/itm/"]';
    const links = await this.page.locator(selector).all();
    if (index >= links.length) throw new Error(`No result at index ${index}`);

    const href = await links[index].getAttribute('href');
    const itemIdMatch = href?.match(/\/itm\/(\d{10,15})/);
    const isPlaceholder = itemIdMatch?.[1] === '123456';

    if (itemIdMatch && !isPlaceholder) {
      const itemId = itemIdMatch[1];
      await this.page.goto(`https://www.ebay.com/itm/${itemId}`, { waitUntil: 'domcontentloaded' });
    } else if (href && !href.includes('123456')) {
      const absoluteUrl = href.startsWith('http') ? href : `https://www.ebay.com${href}`;
      await this.page.goto(absoluteUrl, { waitUntil: 'domcontentloaded' });
    } else {
      await links[index].click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }
}
