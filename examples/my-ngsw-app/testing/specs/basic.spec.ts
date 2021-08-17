import { test, expect } from '@playwright/test';

const networkConditions = {
  offline: false,
  downloadThroughput: 25 * 1000,
  uploadThroughput: 25 * 1000,
  latency: 0
};

let prefetchLoadDuration: number;

test.describe('My app', () => {
  test('loads fast with prefetch mechanism', async ({ page }) => {
    await page.goto('http://localhost:8080/prefetch.html');
    await page.waitForURL('http://localhost:8080/prefetch.html', {
      waitUntil: 'networkidle'
    });
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', networkConditions);
    const [request] = await Promise.all([
      page.waitForEvent('requestfinished'),
      page.click('a:has-text("Launch the app")')
    ]);

    expect(await page.innerText('title')).toBe('MyNgswApp');
    console.log('prefetch', request.timing());
    prefetchLoadDuration = request.timing().responseEnd - request.timing().requestStart;
    client.detach();
  });

  test('takes a while to load on bad network', async ({ page }) => {
    const client = await page.context().newCDPSession(page);

    await client.send('Network.emulateNetworkConditions', networkConditions);
    const [request] = await Promise.all([
      page.waitForEvent('requestfinished'),
      page.goto('http://localhost:8080')
    ]);

    expect(await page.innerText('title')).toBe('MyNgswApp');
    console.log('direct load', request.timing());
    expect(request.timing().responseEnd - request.timing().requestStart).toBeGreaterThan(prefetchLoadDuration);
    client.detach();
  });
});
