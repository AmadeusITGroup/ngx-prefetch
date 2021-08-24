import { AssetGroup } from "../src";

export const prefetchInputAssetGroup: AssetGroup[] = [
    {
      "name": "app",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "cacheQueryOptions": {
        "ignoreVary": true
      },
      "urls": [
        "/assets/icons/icon-128x128.png",
        "/assets/icons/icon-144x144.png",
        "/assets/icons/icon-152x152.png",
        "/assets/icons/icon-192x192.png",
        "/assets/icons/icon-384x384.png",
        "/assets/icons/icon-512x512.png",
        "/assets/icons/icon-72x72.png",
        "/assets/icons/icon-96x96.png",
        "/favicon.ico",
        "/index.html",
        "/main.c1cefa7054b5f0af9a83.js",
        "/manifest.webmanifest",
        "/polyfills.f4a8b511e57773f04796.js",
        "/runtime.1b38c2c56f052a3a7bb8.js",
        "/styles.31d6cfe0d16ae931b73c.css"
      ],
      "patterns": []
    }
  ];

  export const lazyAndPrefetchAssetGroups: AssetGroup[] = [
    {
      "name": "app",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "cacheQueryOptions": {
        "ignoreVary": true
      },
      "urls": [
        "/favicon.ico",
        "/index.html",
        "/main.c1cefa7054b5f0af9a83.js",
        "/manifest.webmanifest",
        "/polyfills.f4a8b511e57773f04796.js",
        "/runtime.1b38c2c56f052a3a7bb8.js",
        "/styles.31d6cfe0d16ae931b73c.css"
      ],
      "patterns": []
    },
    {
      "installMode": "lazy",
      "urls": [
        "/assets/icons/icon-128x128.png",
        "/assets/icons/icon-144x144.png",
        "/assets/icons/icon-152x152.png",
        "/assets/icons/icon-192x192.png",
        "/assets/icons/icon-384x384.png",
        "/assets/icons/icon-512x512.png",
        "/assets/icons/icon-72x72.png",
        "/assets/icons/icon-96x96.png",
      ],
    }
  ];