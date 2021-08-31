import {BuilderOutput, createBuilder, Target} from '@angular-devkit/architect';
import * as commentJson from 'comment-json';
import * as fs from 'fs';
import * as path from 'path';
import * as webpack from 'webpack';
import * as Mustache from 'mustache';

import {PrefetchBuilderSchema} from './schema';

export * from './schema';

/**
 * AssetGroup format found in the ngsw.json
 */
export interface AssetGroup {
  urls: string[];
  installMode?: 'prefetch' | 'lazy';
  [x: string]: unknown;
}

/**
 * @param json
 */
export function getResArray(assetGroups: AssetGroup[]): string[] {
  const resArray: string[] = [];
  assetGroups.filter((assetGroup) => assetGroup.installMode === 'prefetch')
    .forEach((assetGroup) => resArray.push(...assetGroup.urls));
  return resArray;
}

/** Maximum number of steps */
const STEP_NUMBER = 4;


export default createBuilder<PrefetchBuilderSchema>(async (options, context): Promise<BuilderOutput> => {
  context.reportRunning();

  context.reportProgress(0, STEP_NUMBER, 'Retrieve production output folder.');
  const [project, target, configuration] = options.targetBuild.split(':');
  const targetBuild: Target = { project, target, configuration };
  const [targetBuildRawOptions, targetBuildBuilder] = await Promise.all([
    context.getTargetOptions(targetBuild),
    context.getBuilderNameForTarget(targetBuild)
  ]);
  const targetBuildOptions = await context.validateOptions<{ outputPath: string }>(targetBuildRawOptions, targetBuildBuilder);

  /** Check the minimum of mandatory options to the builders */
  if (typeof targetBuildOptions.outputPath !== 'string') {
    return {
      success: false,
      error: `The targetBuild ${options.targetBuild} does not provide 'outputPath' option`
    };
  }

  /** Path to the build output folder */
  const prodBuildOutputPath = targetBuildOptions.outputPath;

  context.reportProgress(1, STEP_NUMBER, 'Read ngsw.json');
  const swJsonString = fs.readFileSync(path.join(process.cwd(), prodBuildOutputPath, 'ngsw.json'), {encoding: 'utf-8'});
  const swJson = commentJson.parse(swJsonString);

  if (!swJson.assetGroups || swJson.assetGroups.length <= 0) {
    return {
      success: false,
      error: 'Prefetch builder failed. No asset group found in the Angular Service Worker.'
    }
  }
  const resourceArray = getResArray(swJson.assetGroups);

  context.reportProgress(2, STEP_NUMBER, 'Read prefetch template file.');
  const prefetchTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'prefetch.mustache'), {encoding: 'utf-8'});
  const variables = {
    resourceArray: commentJson.stringify(resourceArray),
    prefetchConfig: JSON.stringify(options),
    staticsFullPath: options.staticsFullPath
  };
  const prefetchJs = Mustache.render(prefetchTemplate, variables);

  context.reportProgress(3, STEP_NUMBER, 'Write prefetch js script.');
  const tempOutputPath = path.join(process.cwd(), prodBuildOutputPath, 'tempPrefetch.js');
  fs.writeFileSync(tempOutputPath, prefetchJs);

  context.reportProgress(4, STEP_NUMBER, 'Webpack');
  const compiler = webpack({
    mode: options.production ? "production" : "none",
    entry: tempOutputPath,
    output: {
      path: path.join(process.cwd(), prodBuildOutputPath),
      filename: 'ngxPrefetch.js'
    },
    devtool: options.production ? "source-map" : false
  });
  return new Promise((resolve) => {
    compiler.run((err, stats) => {
      fs.unlinkSync(tempOutputPath);
      if (err || stats.hasErrors()) {
        resolve({
          success: false,
          error: `Webpack tanspilation failed. ${err || stats.hasErrors()}`
        });
      } else {
        resolve({
          success: true
        });
      }
    });
  });
});
