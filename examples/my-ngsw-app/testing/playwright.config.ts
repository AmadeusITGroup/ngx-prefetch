import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    use: {
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        // Collect specific trace for debugging if needed
        trace: 'on-first-retry',
    },
    testDir: './specs',
    // Run both basic and advanced specs
    testMatch: ['basic.spec.ts', 'advanced.spec.ts'],
    webServer: {
        command: 'node server/index.js',
        port: 8080,
        cwd: '.',
        reuseExistingServer: !process.env.CI,
    },
};
export default config;
