import { Page, CDPSession } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class TestingHelper {
    private client: CDPSession | null = null;
    private distDir: string;

    constructor(private page: Page) {
        // Assume default dist location, can be parametrized
        this.distDir = path.resolve(__dirname, '../../dist/browser');
    }

    async initCDP() {
        this.client = await this.page.context().newCDPSession(this.page);
        await this.client.send('Runtime.enable');
        await this.client.send('Network.enable');
        return this.client;
    }

    async setNetworkCondition(condition: 'Regular 3G' | 'Fast 3G' | 'No Throttling') {
        if (!this.client) await this.initCDP();

        // Custom definitions for robustness
        const conditions = {
            'Regular 3G': {
                offline: false,
                downloadThroughput: 750 * 1024 / 8, // 750 kbps
                uploadThroughput: 250 * 1024 / 8, // 250 kbps
                latency: 100 // ms
            },
            'Fast 3G': {
                offline: false,
                downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
                uploadThroughput: 750 * 1024 / 8, // 750 kbps
                latency: 40 // ms
            },
            'No Throttling': {
                offline: false,
                downloadThroughput: -1,
                uploadThroughput: -1,
                latency: 0
            }
        };

        const params = conditions[condition];
        await this.client!.send('Network.emulateNetworkConditions', params);
        console.log(`[TestingHelper] Network set to: ${condition}`);
    }

    /**
     * Checks if a resource was served from cache using Performance API.
     * @param urlPart Partial URL to match
     * @returns boolean
     */
    async isResourceCached(urlPart: string): Promise<boolean> {
        return await this.page.evaluate((part) => {
            const resources = performance.getEntriesByType('resource');
            const entry = resources.find(r => r.name.includes(part));
            if (!entry) return false;
            // High confidence for cache: transferSize 0 OR deliveryType 'cache' OR very fast duration
            return (entry as any).transferSize === 0 ||
                (entry as any).deliveryType === 'cache' ||
                entry.duration < 20;
        }, urlPart);
    }

    /**
     * Gets transfer size for a resource.
     */
    async getTransferSize(urlPart: string): Promise<number> {
        return await this.page.evaluate((part) => {
            const resources = performance.getEntriesByType('resource');
            const entry = resources.find(r => r.name.includes(part));
            return entry ? (entry as any).transferSize : -1;
        }, urlPart);
    }

    async debugListResources() {
        const names = await this.page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name));
        console.log('[Helper Debug] Resources:', names);
    }

    /**
     * Helper to create a dummy file in the dist folder for testing verification.
     */
    createDummyFile(relativePath: string, content: string) {
        const fullPath = path.join(this.distDir, relativePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content);
        console.log(`[TestingHelper] Created dummy file: ${fullPath}`);
    }

    removeDummyFile(relativePath: string) {
        const fullPath = path.join(this.distDir, relativePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`[TestingHelper] Removed dummy file: ${fullPath}`);
        }
    }
}
