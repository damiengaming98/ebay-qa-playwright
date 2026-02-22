import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for eBay Product Detail Page
 * Encapsulates all selectors and interactions for the product detail page
 * and its Related Best-Seller Products section.
 */
export class ProductDetailPage {
  readonly page: Page;

  // ── Main product selectors ──
  readonly mainProductTitle: Locator;
  readonly mainProductPrice: Locator;
  readonly addToCartButton: Locator;
  readonly addToWatchlistButton: Locator;

  // ── Related products section selectors ──
  readonly relatedProductsSection: Locator;
  readonly relatedProductsSectionHeader: Locator;
  readonly relatedProductCards: Locator;
  readonly relatedProductImages: Locator;
  readonly relatedProductTitles: Locator;
  readonly relatedProductPrices: Locator;
  readonly relatedProductWatchlistIcons: Locator;
  readonly seeAllLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main product
    this.mainProductTitle = page.locator('h1.x-item-title__mainTitle span, [itemprop="name"]').first();
    this.mainProductPrice = page.locator('.x-price-primary span[itemprop="price"], .notranslate').first();
    this.addToCartButton = page.locator('#atcBtn_btn, [data-testid="ux-call-to-action"]').first();
    this.addToWatchlistButton = page.locator('.watchlist-btn, [data-testid="watchlist-btn"]').first();

    // Related products - flexible selectors to handle eBay's dynamic class names
    this.relatedProductsSection = page.locator(
      '[data-testid="related-items"], .s-similar-items, ' +
      'section:has-text("Similar sponsored items"), ' +
      'section:has-text("People who viewed this item also viewed"), ' +
      'section:has-text("Related Items"), ' +
      '.merch-module, [class*="similar"], [class*="related"]'
    ).first();

    this.relatedProductsSectionHeader = page.locator(
      'text=Similar sponsored items, text=Related Items, text=Best Sellers, ' +
      'text=People who viewed this item also viewed, text=More to explore'
    ).first();

    this.relatedProductCards = page.locator(
      '[data-testid="related-items"] .s-item, ' +
      '.merch-module .s-item, ' +
      '.s-similar-items .s-item, ' +
      'section:has-text("Similar sponsored items") [class*="item"], ' +
      'section:has-text("People who viewed this item also viewed") [class*="item"]'
    );

    this.relatedProductImages = page.locator(
      '[data-testid="related-items"] img, .merch-module img, ' +
      'section:has-text("Similar sponsored items") img'
    );

    this.relatedProductTitles = page.locator(
      '[data-testid="related-items"] .s-item__title, ' +
      'section:has-text("Similar sponsored items") [class*="title"]'
    );

    this.relatedProductPrices = page.locator(
      '[data-testid="related-items"] .s-item__price, ' +
      'section:has-text("Similar sponsored items") [class*="price"]'
    );

    this.relatedProductWatchlistIcons = page.locator(
      '[data-testid="related-items"] [class*="watchlist"], ' +
      'section:has-text("Similar sponsored items") [aria-label*="watchlist"], ' +
      'section:has-text("Similar sponsored items") [class*="heart"]'
    );

    this.seeAllLink = page.locator(
      'a:has-text("See all"), [data-testid="see-all-related"]'
    ).first();
  }

  /**
   * Navigate directly to a specific eBay item page
   */
  async navigateToProduct(itemId: string): Promise<void> {
    await this.page.goto(`/itm/${itemId}`, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
      // networkidle may not always be reachable; continue regardless
    });
  }

  /**
   * Navigate to eBay and search for a term, then click the first result
   */
  async searchAndOpenFirstResult(searchTerm: string): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    const searchInput = this.page.locator('#gh-ac, [name="_nkw"]').first();
    await searchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');

    // Click first real result (skip ads if possible)
    await this.page.waitForTimeout(2000);
    const firstResult = this.page.locator(
      'a.s-item__link, .s-item__info > a, .s-item__image-wrapper > a, a[href*="/itm/"]'
    ).first();
    await firstResult.waitFor({ state: 'visible', timeout: 10000 });
    await firstResult.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Scroll to the related products section
   */
  async scrollToRelatedProducts(): Promise<void> {
    await this.page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await this.page.waitForTimeout(1500);

    try {
      await this.relatedProductsSection.scrollIntoViewIfNeeded({ timeout: 5000 });
    } catch {
      // Section may not exist — handled in individual tests
    }
  }

  /**
   * Get the main product price as a number
   */
  async getMainProductPrice(): Promise<number> {
    const priceText = await this.mainProductPrice.innerText().catch(() => '0');
    const cleaned = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Get all related product prices as numbers
   */
  async getRelatedProductPrices(): Promise<number[]> {
    const priceElements = await this.relatedProductPrices.all();
    const prices: number[] = [];
    for (const el of priceElements) {
      const text = await el.innerText().catch(() => '0');
      const cleaned = text.replace(/[^0-9.]/g, '');
      const price = parseFloat(cleaned);
      if (!isNaN(price) && price > 0) prices.push(price);
    }
    return prices;
  }

  /**
   * Get count of visible related product cards
   */
  async getRelatedProductCount(): Promise<number> {
    await this.scrollToRelatedProducts();
    return await this.relatedProductCards.count();
  }

  /**
   * Get all related product titles
   */
  async getRelatedProductTitles(): Promise<string[]> {
    const titleElements = await this.relatedProductTitles.all();
    const titles: string[] = [];
    for (const el of titleElements) {
      const text = await el.innerText().catch(() => '');
      if (text.trim()) titles.push(text.trim());
    }
    return titles;
  }

  /**
   * Click a related product by index (0-based)
   */
  async clickRelatedProduct(index: number): Promise<void> {
    const cards = await this.relatedProductCards.all();
    if (index >= cards.length) throw new Error(`No related product at index ${index}`);
    await cards[index].click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click the watchlist icon on a related product card
   */
  async clickRelatedProductWatchlist(index: number): Promise<void> {
    const icons = await this.relatedProductWatchlistIcons.all();
    if (index >= icons.length) throw new Error(`No watchlist icon at index ${index}`);
    await icons[index].click();
  }

  /**
   * Check if the related products section exists in the DOM
   */
  async isRelatedProductsSectionVisible(): Promise<boolean> {
    try {
      await this.relatedProductsSection.waitFor({ state: 'visible', timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if all images in related products are loaded (not broken)
   */
  async areAllRelatedImagesLoaded(): Promise<{ loaded: number; broken: number }> {
    await this.scrollToRelatedProducts();
    const images = await this.relatedProductImages.all();
    let loaded = 0;
    let broken = 0;

    for (const img of images) {
      const isLoaded = await img.evaluate((el: HTMLImageElement) => {
        return el.complete && el.naturalWidth > 0;
      });
      if (isLoaded) loaded++;
      else broken++;
    }
    return { loaded, broken };
  }

  /**
   * Get the current page URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Get console errors from the page
   */
  collectConsoleErrors(): string[] {
    const errors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    return errors;
  }
}
