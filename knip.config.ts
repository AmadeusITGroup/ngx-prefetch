import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    ignore: ["examples/**"],
    entry: ["src/schematics/ng-add/index.ts", "src/index.ts"]
}

export default config;