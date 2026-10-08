// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');

const escapeForRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const config = getDefaultConfig(projectRoot);

// 1. Watch the library source so editing ../src hot-reloads the example app.
config.watchFolders = [libraryRoot];

// 2. Let the app import the library by its published name while actually
//    reading ../src/tooltip.js. This means the example tests the real source,
//    with no build step and no `npm link` to keep in sync.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-walkthrough-tooltip': libraryRoot,
};

// 3. The library source lives outside this project, so Metro cannot find
//    `react`/`react-native`/`prop-types` by walking up from ../src. Add the
//    example's node_modules as an explicit resolution root.
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths ?? []),
  path.resolve(projectRoot, 'node_modules'),
];

// 4. The library's own node_modules pins react-native 0.55 as a devDependency
//    (for jest). Hide it so the example always resolves a single copy of React
//    and React Native from step 3.
const libraryNodeModules = new RegExp(
  `^${escapeForRegExp(path.join(libraryRoot, 'node_modules'))}/.*$`,
);
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  libraryNodeModules,
];

module.exports = config;
