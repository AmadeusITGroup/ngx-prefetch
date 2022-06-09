# ngx-prefetch
Angular builder for prefetching resources before loading the application

## Description
There are some cases when application resources need to be prefetched before loading the app (ex. from the airline portal.)

The prefetch builder will create a `ngxPrefetch.js` file that, when executed, will dinamically [create `<link>` tags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ).

## Prerequisites
A prerequiste for the script is to have [Angular Service Worker](https://angular.io/guide/service-worker-intro) enabled as it is using the `ngsw.json` from the production build  folder that is generated by the Angular Service Worker. Therefore it will be ran after the build prod.

## Install

```shell
npm install -D @o3r/ngx-prefetch
```

## Builder options
  - `targetBuild` **Mandatory** The target build where prefetch should be applied. Used for identifying the `outputPath` of the build.

  - `resourceTypes` An object describing the resource types that should be prefetched.

  - `crossorigin` Flag that sets crossorigin attribute on links. If true it will be set for all prefetched resources.

  - `production` Flag for creating a production (minified) version of the js file or a development one.

  - `staticsFullPath` By default the prefetched resources are hosted next to the `ngxPrefetch.js` file, on the same server. If it is not the case, you can configure the full path of the resources that will be prefetched. (ex: https://my-web-app.com/path/to/my-app/). It is also possible to set this value by runtime. Instead of setting it in the Builder's options, you can search and replace for `{STATICS_FULL_PATH}` on the server side in order to inject a path.
## Usage

[`package.json`]

```json
    ...
    "build:prod": "ng build --prod && yarn run generate:prefetch",
    "generate:prefetch": "yarn app-name:generate-prefetch",
    ...
```

[`angular.json`]

```json
"generate-prefetch": {
    "builder": "@o3r/ngx-prefetch:run",
    "options": {
        "targetBuild": "my-app:build:production"
    }
},
```

[`angular.json`: full configuration]

```json
"generate-prefetch": {
    "builder": "@o3r/ngx-prefetch:run",
    "options": {
        "targetBuild": "my-app:build:production",
        "resourceTypes": {
            "image": ["png", "jpg", "gif"],
            "font": ["eot", "ttf", "woff", "woff2", "svg"],
            "style": ["css"],
            "script": ["js"],
            "document": ["html"]
        },
        "crossorigin": true,
        "production": false,
        "staticsFullPath": "https://my-web-app.com/path/to/my-app/"
    }
},
```

## Versioning 

This library is following the Angular release cycle. Angular 13 and onwards is supported.

For instance, if you are using Angular 13, use a 13.x version of the library:

```shell
npm install -D @o3r/ngx-prefetch@13
```