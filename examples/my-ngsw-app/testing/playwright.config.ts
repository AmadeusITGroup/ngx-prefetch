import { PlaywrightTestConfig } from '@playwright/test';
const config: PlaywrightTestConfig = {
  use: {
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  },
  testDir: './specs'
};
export default config;
