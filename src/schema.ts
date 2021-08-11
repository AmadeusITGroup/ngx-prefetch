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
}
