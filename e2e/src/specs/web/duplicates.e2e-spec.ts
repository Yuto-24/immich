import { AssetMediaResponseDto, LoginResponseDto, updateAssets } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import crypto from 'node:crypto';
import { asBearerAuth, utils } from 'src/utils';

test.describe('Duplicates Utility', () => {
  let admin: LoginResponseDto;
  let firstAsset: AssetMediaResponseDto;
  let secondAsset: AssetMediaResponseDto;

  test.beforeEach(async ({ context }) => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    [firstAsset, secondAsset] = await Promise.all([
      utils.createAsset(admin.accessToken, {}),
      utils.createAsset(admin.accessToken, {}),
    ]);

    await updateAssets(
      {
        assetBulkUpdateDto: {
          ids: [firstAsset.id, secondAsset.id],
          duplicateId: crypto.randomUUID(),
        },
      },
      { headers: asBearerAuth(admin.accessToken) },
    );

    await utils.setAuthCookies(context, admin.accessToken);
  });

  test('navigates with arrow keys between duplicate preview assets', async ({ page }) => {
    await page.goto('/utilities/duplicates');
    await page.getByRole('button', { name: 'View' }).first().click();
    await page.waitForSelector('#immich-asset-viewer');

    const getViewedAssetId = () => new URL(page.url()).pathname.split('/').at(-1) ?? '';
    const initialAssetId = getViewedAssetId();
    expect([firstAsset.id, secondAsset.id]).toContain(initialAssetId);

    await page.keyboard.press('ArrowRight');
    await expect.poll(getViewedAssetId).not.toBe(initialAssetId);

    await page.keyboard.press('ArrowLeft');
    await expect.poll(getViewedAssetId).toBe(initialAssetId);
  });

  test('fits duplicate cards to wide screens and scrolls before cards become too narrow', async ({ page }) => {
    const additionalAssets = await Promise.all([
      utils.createAsset(admin.accessToken, {}),
      utils.createAsset(admin.accessToken, {}),
      utils.createAsset(admin.accessToken, {}),
    ]);

    await updateAssets(
      {
        assetBulkUpdateDto: {
          ids: [firstAsset.id, secondAsset.id, ...additionalAssets.map(({ id }) => id)],
          duplicateId: crypto.randomUUID(),
        },
      },
      { headers: asBearerAuth(admin.accessToken) },
    );

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/utilities/duplicates');

    const grid = page.getByTestId('duplicate-asset-grid');
    const scroller = page.getByTestId('duplicate-asset-scroller');
    await expect(grid.locator(':scope > div')).toHaveCount(5);

    const wideLayout = await grid.evaluate((element) => ({
      availableWidth: element.parentElement?.clientWidth ?? 0,
      cardWidths: [...element.children].map((child) => child.getBoundingClientRect().width),
      contentWidth: element.scrollWidth,
    }));
    expect(wideLayout.contentWidth).toBeLessThanOrEqual(wideLayout.availableWidth);
    expect(Math.max(...wideLayout.cardWidths) - Math.min(...wideLayout.cardWidths)).toBeLessThan(1);

    await page.setViewportSize({ width: 800, height: 1080 });
    await expect.poll(() => scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    const narrowCardWidths = await grid
      .locator(':scope > div')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
    expect(Math.min(...narrowCardWidths)).toBeGreaterThanOrEqual(240);
  });
});
