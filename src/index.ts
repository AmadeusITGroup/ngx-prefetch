import {BuilderOutput, createBuilder} from '@angular-devkit/architect';
import * as commentJson from 'comment-json';
import * as fs from 'fs';
import * as path from 'path';

import {PrefetchBuilderSchema} from './schema';

export * from './schema';

/**
 * @param json
 */
function getResArray(json: any) {
  const resArray: string[] = [];
  if (json.assetGroups) {
    json.assetGroups
      .filter((assetGroup: {installMode: string}) => assetGroup.installMode === 'prefetch')
      .forEach((assetGroup: { urls: string[] }) => resArray.push(...assetGroup.urls));
  } else {
    // eslint-disable-next-line no-console
    console.error('No assets group found. Unable to generate resource prefetch script.');
  }
  return resArray;
}

/** Maximum number of steps */
const STEP_NUMBER = 4;

export default createBuilder<PrefetchBuilderSchema>((options, context): BuilderOutput => {
  context.reportRunning();

  context.reportProgress(0, STEP_NUMBER, 'Retrieve production output folder.');
  const angularJsonString = fs.readFileSync(path.join(context.workspaceRoot, 'angular.json'), {encoding: 'utf-8'});
  const angularJson = commentJson.parse(angularJsonString);
  const projectName = angularJson.defaultProject || Object.keys(angularJson.projects)[0];
  const workspaceProject = angularJson.projects[projectName];
  const prodBuildOutputPath = workspaceProject && workspaceProject.architect &&
  workspaceProject.architect.build && workspaceProject.architect.build.configurations &&
  workspaceProject.architect.build.configurations.production && workspaceProject.architect.build.configurations.production.outputPath || 'dist';

  context.reportProgress(1, STEP_NUMBER, 'Read ngsw.json');
  const swJsonString = fs.readFileSync(path.join(process.cwd(), prodBuildOutputPath, 'ngsw.json'), {encoding: 'utf-8'});
  const swJson = commentJson.parse(swJsonString);
  const resourceArray = getResArray(swJson);

  context.reportProgress(1, STEP_NUMBER, 'Read prefetch template file.');
  const prefetchTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'prefetch.tpl.js'), {encoding: 'utf8'});

  const prefetchJs = prefetchTemplate
    .replace('[null]', commentJson.stringify(resourceArray))
    .replace('prefetchConfig;', 'prefetchConfig = ' + JSON.stringify(options) + ';');

  context.reportProgress(2, STEP_NUMBER, 'Write prefetch js script.');
  fs.writeFileSync(path.join(process.cwd(), prodBuildOutputPath, 'ngxPrefetch.js'), prefetchJs);

  return {
    success: true
  };
});
