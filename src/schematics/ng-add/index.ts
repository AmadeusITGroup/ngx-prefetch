import { NgAddSchematicsSchema } from './schema';
import { chain, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import type { PackageJson } from 'type-fest';

interface WorkspaceProject {
  root: string;
  architect?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [k: string]: any
  };
}
interface WorkspaceSchema {
  projects: {
    [k: string]: WorkspaceProject;
  };
}

function getFinalProjectName(workspace: WorkspaceSchema, projectName: string) {
  if (projectName) return projectName;
  const projectKeys = Object.keys(workspace.projects);
  if (projectKeys.length !== 1) throw new SchematicsException('No project name provided and several projects were found in angular.json.');
  return projectKeys[0];
}

/**
 * Update the application with the prefetch script
 *
 * @param options
 */
function updatePrefetchBuilder(options: NgAddSchematicsSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let workspace;
    try {
      workspace = tree.readJson('/angular.json') as unknown as WorkspaceSchema;
    } catch (e) {
      throw new SchematicsException(`Could not parse /angular.json. ${e}`);
    }

    const projectName = getFinalProjectName(workspace, options.projectName);

    const workspaceProject = workspace.projects[projectName];

    const packageJsonPath = `${workspaceProject.root}/package.json`;
    if (!tree.exists(packageJsonPath)) {
      throw new SchematicsException('Could not find package.json');
    }

    const packageJson = tree.readJson(packageJsonPath) as PackageJson;

    packageJson.scripts ||= {};

    packageJson.scripts['generate:prefetch'] = `ng run ${projectName}:generate-prefetch`;

    tree.overwrite(`${workspaceProject.root}/package.json`, JSON.stringify(packageJson, null, 2));

    workspaceProject.architect ||= {};

    workspaceProject.architect['generate-prefetch'] = {
      builder: '@o3r/ngx-prefetch:run',
      options: {
        targetBuild: `${projectName}:${options.targetBuild}`
      }
    };

    if (!tree.exists('/ngsw-config.json')) {
      context.logger.warn('Run `ng add @angular/pwa` to setup Angular Service Worker. This is a mandatory package for the ngx-prefetch library.');
    }

    workspace.projects[projectName] = workspaceProject;
    tree.overwrite('/angular.json', JSON.stringify(workspace, null, 2));

    return tree;
  };
}



/**
 * Add the ngx-prefetch library to an Angular Project
 *
 * @param options
 */
export function ngAdd(options: NgAddSchematicsSchema): Rule {
  return chain([
    updatePrefetchBuilder(options)
  ]);
}
