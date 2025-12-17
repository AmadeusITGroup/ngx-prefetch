import { test, expect } from '@playwright/test';
import { TestingHelper } from '../utils/e2e-helpers';

test.describe('Exhaustive Prefetch Tests', () => {
    const BASE_URL = 'http://localhost:8080';
    let helper: TestingHelper;

    test.beforeEach(async ({ page }) => {
        helper = new TestingHelper(page);
    });

    // GROUP 1: Efficacy & Baseline
    test.describe('Group 1: Baseline & Efficacy (Throttled)', () => {
        test('Baseline: Slow Network w/o Prefetch', async ({ page }) => {
            // Simulate Fast 3G
            await helper.setNetworkCondition('Fast 3G');

            const start = Date.now();
            await page.goto(`${BASE_URL}/`);
            await page.waitForLoadState('networkidle'); // wait for it to fully load
            const duration = Date.now() - start;

            await helper.debugListResources();
            // search for 'main' as hashed file is like main-XYZ.js
            const isCached = await helper.isResourceCached('main');
            const size = await helper.getTransferSize('main');

            console.log(`[Baseline] Load Time: ${duration}ms, Cached: ${isCached}, Size: ${size}`);

            // Assertions
            expect(isCached).toBe(false);
            expect(size).toBeGreaterThan(0);
            expect(duration).toBeGreaterThan(100); // Should take some time on 3G
        });

        test('Efficacy: Slow Network w/ Prefetch', async ({ page }) => {
            await helper.setNetworkCondition('Fast 3G');

            // 1. Visit Prefetch page
            await page.goto(`${BASE_URL}/prefetch.html`);
            await page.waitForLoadState('networkidle');

            // 2. Launch App
            const start = Date.now();
            await page.click('text=Launch the app');
            await expect(page).toHaveTitle('MyNgswApp');
            // We use evaluate to ensure we check perf entries of the NEW page (not prefetch page)
            // waiting for networkidle on the new page ensures main.js is loaded
            await page.waitForLoadState('networkidle');
            const duration = Date.now() - start;

            const isCached = await helper.isResourceCached('main');
            console.log(`[Prefetch] Load Time: ${duration}ms, Cached: ${isCached}`);

            // Assertions
            // Note: In headless + throttle, it might look like network request but size=0 or fast duration
            expect(isCached).toBe(true);
            // Ideally duration should be significantly faster than Baseline, but strictly asserting duration is flaky.
        });
    });

    // GROUP 2: Advanced Server-Side Features
    test.describe('Group 2: Advanced Server-Side Features', () => {
        test('Dynamic Path Replacement', async ({ page }) => {
            // Reuse existing logic, simplified with helper if needed, but keeping direct for clarity
            // ...
            const dynamicPath = 'http://localhost:8081/custom-cdn';
            const dynamicFiles = JSON.stringify(['favicon.ico']);

            await page.goto(`${BASE_URL}/prefetch.html?replace=true&dynamicPath=${encodeURIComponent(dynamicPath)}&dynamicFiles=${encodeURIComponent(dynamicFiles)}`);

            const link = page.locator(`link[rel="prefetch"][href*="${dynamicPath}"][href*="favicon.ico"]`);
            await expect(link).toHaveCount(1);
        });

        test('Dynamic Language: Real File Fetching', async ({ page }) => {
            // Setup: Create dummy file
            helper.createDummyFile('localizations/fr-FR.json', '{ "hello": "bonjour" }');

            try {
                // Setup CDP to listen for response status
                const client = await helper.initCDP();
                let resourceStatus = 0;
                client.on('Network.responseReceived', (params) => {
                    if (params.response.url.includes('fr-FR.json')) {
                        resourceStatus = params.response.status;
                        console.log(`[CDP] fr-FR.json status: ${resourceStatus}`);
                    }
                });

                const lang = 'fr-FR';
                const dynamicFiles = JSON.stringify(['localizations/fr-FR.json']);

                await page.goto(`${BASE_URL}/prefetch.html?replace=true&lang=${lang}&dynamicFiles=${encodeURIComponent(dynamicFiles)}`);

                // Verify Link Exists
                const locLink = page.locator('link[rel="prefetch"][href*="localizations/fr-FR.json"]');
                await expect(locLink).toHaveCount(1);

                // Verify Resource was fetched (Status 200)
                // We might need to wait a bit for the request to happen
                await page.waitForTimeout(1000);
                expect(resourceStatus).toBe(200);

            } finally {
                // Cleanup
                helper.removeDummyFile('localizations/fr-FR.json');
            }
        });
    });

    // GROUP 3: Negative / Robustness
    test.describe('Group 3: Negative Testing', () => {
        test('Invalid File: 404 Verification', async ({ page }) => {
            const client = await helper.initCDP();
            let resourceStatus = 0;
            client.on('Network.responseReceived', (params) => {
                if (params.response.url.includes('xx-XX.json')) {
                    resourceStatus = params.response.status;
                }
            });
            client.on('Runtime.exceptionThrown', (params) => {
                console.log('[CDP] Runtime Exception:', params.exceptionDetails.text);
            });
            client.on('Runtime.consoleAPICalled', (params) => {
                console.log('[CDP] Console:', params.type, params.args.map(a => a.value).join(' '));
            });
            // Also listen for loadingFailed (sometimes 404s show as failed if blocked?)
            // But usually it's a response with 404 status.

            // We must use the Language mechanism because ngxPrefetch only adds dynamic files if they match the language pattern.
            // It does not add arbitrary files from dynamicFiles list.
            const lang = 'xx-XX';
            const badFile = 'localizations/xx-XX.json';
            const dynamicFiles = JSON.stringify([badFile]);

            await page.goto(`${BASE_URL}/prefetch.html?replace=true&lang=${lang}&dynamicFiles=${encodeURIComponent(dynamicFiles)}`);

            // Verify Link Created
            const badLink = page.locator(`link[rel="prefetch"][href*="${badFile}"]`);
            await expect(badLink).toHaveCount(1);

            // Verify Network 404
            await page.waitForTimeout(1000);
            expect(resourceStatus).toBe(404);
        });
    });

});
