import { JsonObject } from '@angular-devkit/core';

export interface NgAddSchematicsSchema extends JsonObject {
  /** Project name */
  projectName: string | null;
  /** The target build for which prefetch should be applied (ex: build:production) */
  targetBuild: string | null;
}
