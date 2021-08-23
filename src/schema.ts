import {JsonObject} from '@angular-devkit/core';

/** Prefetch builder */
export interface PrefetchBuilderSchema extends JsonObject {
  /** The target build where prefetch should be applied. Used for identifying the `outputPath` of the build. It will be mandatory in the next major version.*/
  targetBuild: string;

  /** An object describing the resource types that should be prefetched. */
  resourceTypes: JsonObject;

  /** Flag that sets crossorigin attribute on links. If true it will be set for all prefetched resources. */
  crossorigin: boolean;

  /** Flag for creating a production (minified) version of the js file or a development one. */
  production: boolean;

  /** By default the prefetched resources are hosted next to the `ngxPrefetch.js` file, on the same server. If it is not the case, you can configure the full path of the resources that will be prefetched. */
  staticsFullPath: string;
}
