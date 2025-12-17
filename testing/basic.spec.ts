import { filterOptions, getResArray } from '../src';
import { lazyAndPrefetchAssetGroups, prefetchInputAssetGroup } from './mocks';

describe('Prefetch builder', () => {
  describe('getResArray', () => {
    test('should output all urls for prefetch install mode', () => {

      const expectedArray = [
        '/assets/icons/icon-128x128.png',
        '/assets/icons/icon-144x144.png',
        '/assets/icons/icon-152x152.png',
        '/assets/icons/icon-192x192.png',
        '/assets/icons/icon-384x384.png',
        '/assets/icons/icon-512x512.png',
        '/assets/icons/icon-72x72.png',
        '/assets/icons/icon-96x96.png',
        '/favicon.ico',
        '/index.html',
        '/main.c1cefa7054b5f0af9a83.js',
        '/manifest.webmanifest',
        '/polyfills.f4a8b511e57773f04796.js',
        '/runtime.1b38c2c56f052a3a7bb8.js',
        '/styles.31d6cfe0d16ae931b73c.css'
      ];
      expect(getResArray(prefetchInputAssetGroup)).toEqual(expectedArray);
    });

    test('should output only urls for for prefetch install mode', () => {

      const expectedArray = [
        '/favicon.ico',
        '/index.html',
        '/main.c1cefa7054b5f0af9a83.js',
        '/manifest.webmanifest',
        '/polyfills.f4a8b511e57773f04796.js',
        '/runtime.1b38c2c56f052a3a7bb8.js',
        '/styles.31d6cfe0d16ae931b73c.css'
      ];
      expect(getResArray(lazyAndPrefetchAssetGroups)).toEqual(expectedArray);
    });
  });

  describe('filterOptions', () => {
    test('should filter out builder options not used in prefetch.js config', () => {
      const inputOptions = {
        targetBuild: 'my-ngsw-app:build:production',
        resourceTypes: {
          image: ['png', 'jpg', 'gif'],
          font: ['eot', 'ttf', 'woff', 'woff2', 'svg'],
          style: ['css'],
          script: ['js'],
          document: ['html']
        },
        crossorigin: true,
        production: true,
        staticsFullPath: '{STATICS_FULL_PATH}',
        localizationPattern: 'localizations/${language}.json'
      };

      const expectedBuilderConfig = {
        resourceTypes: {
          image: ['png', 'jpg', 'gif'],
          font: ['eot', 'ttf', 'woff', 'woff2', 'svg'],
          style: ['css'],
          script: ['js'],
          document: ['html']
        },
        crossorigin: true
      };
      expect(filterOptions(inputOptions, ['crossorigin', 'resourceTypes'])).toEqual(expectedBuilderConfig);
    });
  });
});
