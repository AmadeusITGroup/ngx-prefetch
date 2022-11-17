import { NgAddSchematicsSchema } from './schema';
import { chain, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';

function readPackageJson(tree: Tree, workspaceProject: any) {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const workspaceConfig = tree.read(`${workspaceProject.root}/package.json`);
  if (!workspaceConfig) {
    throw new SchematicsException('Could not find package.json file');
  }
  return JSON.parse(workspaceConfig.toString());
}

function readAngularJson(tree: Tree) {
  const workspaceConfig = tree.read('/angular.json');
  if (!workspaceConfig) {
    throw new SchematicsException('Could not find Angular workspace configuration');
  }
  return JSON.parse(workspaceConfig.toString());
}

function getFinalProjectName(workspace: any, projectName: string) {
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

    const workspace = readAngularJson(tree);
    const projectName = getFinalProjectName(workspace, options.projectName);

    const workspaceProject = workspace.projects[projectName];
    const packageJson = readPackageJson(tree, workspaceProject);

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
      context.logger.warn('Run `yarn ng add @angular/pwa` to setup Service Worker prefetch. This is a mandatory step for prefetch capability.');
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
