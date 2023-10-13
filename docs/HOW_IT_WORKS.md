# How ngx-prefetch works

After adding a service worker to your project, as specified in the [prerequisites](README.md#prerequisites), the modifications include 
the creation of a service worker configuration file called `ngsw-config.json`, which specifies the caching behaviors. 
Then the build process creates the manifest file `ngsw.json` in the `dist` folder using information from `ngsw-config.json`.

## Create Angular CLI builder

Before all, if the mandatory options are provided and verified, the production output folder is retrieved.
Then the creation of the builder consists of four steps:

1. The first step is to read the `ngsw.json` file. This allows to create an array of resources based on the asset groups that have the `installMode` set to `prefetch`.
2. The second step is to read the prefetch [Mustache](https://mustache.github.io/) template file. This template is rendered in JavaScript using the object of variables that is passed as a parameter.
3. The third step is to write the prefetch JS script using the previous template.
4. The fourth step is to create a Compiler by bundling the JS file for usage in a browser using [webpack](https://webpack.js.org/).

When this compiler is run successfully, a new file `ngxPrefetch.js` is created in the production output folder.

## ngxPrefetch.js file

The `ngxPrefetch.js` file contains a list of static resources that the Angular service worker should cache based on the `ngsw-config.json` file.
The path where these resources are hosted can be defined in the [builder options](README.md#builder-options) otherwise the default path is next to the `ngxPrefetch.js` file, on the same server.

Then, for each resource of type `string`, a link is appended to the html header of the webpage with the following properties:
* A relationship (`rel`) of type `prefetch`
* The type of content being loaded (`as`) if possible
* Possibly the `crossorigin` attribute to indicate whether CORS must be used when fetching the resource
* The URL of the linked resource (`href`)

Below is an example of the appended link: 

```html
<link rel="prefetch" as="type-of-content" crossorigin href="url-of-linked-resource">
```
