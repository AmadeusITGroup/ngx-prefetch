import type {BuilderOutput, Target} from '@angular-devkit/architect';
import {createBuilder} from '@angular-devkit/architect';
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

/**
 * @param options prefetch Builder Options
 * @param allowedOptions list of allowed options for Builder configuration
 */
export function filterOptions(options: PrefetchBuilderSchema, allowedOptions: string[]): Partial<PrefetchBuilderSchema> {
  return Object.keys(options)
    .filter(key => allowedOptions.includes(key))
    .reduce((obj, key) => {
      return {
        ...obj,
        [key]: options[key]
      };
    }, {});
}

/** Maximum number of steps */
const STEP_NUMBER = 4;

/**
 * Compute the path where to find the swJson file from the ngx-prefetch and the build target options.
 * @param targetBuildBuilder
 * @param targetOutputPath
 * @param outputPathOverride
 */
function computeSwJsonFolderPath<T extends {base: string, browser?: string}>(targetBuildBuilder: string,
  targetOutputPath: string | T, outputPathOverride: string | undefined) {
  if (typeof outputPathOverride === 'string' && !!outputPathOverride) {
    return outputPathOverride;
  }
  if (typeof targetOutputPath === 'string') {
    if (['@nx/angular:application', '@angular-devkit/build-angular:application'].indexOf(targetBuildBuilder) > -1) {
      return path.join(targetOutputPath, 'browser');
    }
    return targetOutputPath;
  }
  if (typeof targetOutputPath.browser === 'string' && typeof targetOutputPath.base === 'string') {
    return path.join(targetOutputPath.base, targetOutputPath.browser);
  }
  if (typeof targetOutputPath.base === 'string') {
    return targetOutputPath.base;
  }
  return undefined;
}

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

  /** Path to the build output folder */
  const prodBuildOutputPath = computeSwJsonFolderPath(targetBuildBuilder, targetBuildOptions.outputPath, options.outputPath);

  /** Check the minimum of mandatory options to the builders */
  if (!prodBuildOutputPath) {
    return {
      success: false,
      error: `Neither the ngx-prefetch task nor targetBuild ${options.targetBuild} provide an 'outputPath' option.`
    };
  }


  context.reportProgress(1, STEP_NUMBER, 'Read ngsw.json');
  let swJsonString;
  try {
    swJsonString = fs.readFileSync(path.join(process.cwd(), prodBuildOutputPath, 'ngsw.json'), {encoding: 'utf-8'});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
  const swJson = JSON.parse(swJsonString);

  if (!swJson.assetGroups || swJson.assetGroups.length <= 0) {
    return {
      success: false,
      error: 'Prefetch builder failed. No asset group found in the Angular Service Worker.'
    }
  }
  const resourceArray = getResArray(swJson.assetGroups);

  context.reportProgress(2, STEP_NUMBER, 'Read prefetch template file.');
  const prefetchTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'prefetch.mustache'), {encoding: 'utf-8'});
  const configOptions = ['crossorigin', 'resourceTypes', 'fallbackLocalesMap'];
  const variables = {
    resourceArray: JSON.stringify(resourceArray),
    prefetchConfig: JSON.stringify(filterOptions(options, configOptions)),
    staticsFullPath: options.staticsFullPath,
    localizationPattern: options.localizationPattern
  };
  const prefetchJs = Mustache.render(prefetchTemplate, variables);

  context.reportProgress(3, STEP_NUMBER, 'Write prefetch js script.');
  const tempOutputPath = path.join(process.cwd(), prodBuildOutputPath, 'tempPrefetch.js');
  fs.writeFileSync(tempOutputPath, prefetchJs);

  context.reportProgress(4, STEP_NUMBER, 'Webpack');
  const compiler = webpack({
    mode: options.production ? 'production' : 'none',
    entry: tempOutputPath,
    output: {
      path: path.join(process.cwd(), prodBuildOutputPath),
      filename: 'ngxPrefetch.js'
    },
    devtool: options.production ? 'source-map' : false
  });
  return new Promise((resolve) => {
    compiler.run((err, stats) => {
      fs.unlinkSync(tempOutputPath);
      if (err || stats.hasErrors()) {
        resolve({
          success: false,
          error: `Webpack transpilation failed. ${err || stats.hasErrors()}`
        });
      } else {
        resolve({
          success: true
        });
      }
    });
  });
});
