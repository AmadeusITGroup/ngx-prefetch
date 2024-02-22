import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    ignore: ['examples/**'],
    entry: ['src/schematics/ng-add/index.ts', 'src/index.ts'],
    ignoreDependencies: ['@types/jest'],
    ignoreBinaries: ['playwright']
}

export default config;