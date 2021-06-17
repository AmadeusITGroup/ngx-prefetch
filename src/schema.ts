import {JsonObject} from '@angular-devkit/core';

/** Prefetch builder */
export interface PrefetchBuilderSchema extends JsonObject {
  /** An object describing the resource types that should be prefetched. */
  resourceTypes: JsonObject;

  /** Flag that sets crossorigin attribute on links. If true it will be set for all prefetched resources. */
  crossorigin: boolean;
}
