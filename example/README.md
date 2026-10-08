# Tooltip Example App

An [Expo](https://expo.dev) app for developing and testing
`react-native-walkthrough-tooltip` against current React Native
(SDK 57 / React Native 0.86 / React 19, New Architecture).

It imports the library **straight from `../src`** — no build step, no
`npm link`. Editing `src/tooltip.js`, `src/geom.js` or `src/styles.js` reloads
the running app.

## Running it

```bash
cd example
npm install
npm run ios      # or: npm run android, npm start
```

## Screens

| Tab        | What it exercises                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| placement  | `placement` and `displayInsets` against nine anchors across the screen — the cases where the bubble has to clamp, or flip to the opposite side when the requested one has no room. |
| tour       | A four-step walkthrough navigated from inside the bubble, using `closeOnContentInteraction={false}` and `parentWrapperStyle` to keep a flexed child at its real width.              |
| styling    | `arrowSize`, `backgroundColor`, `childContentSpacing`, `contentStyle` and `disableShadow`, all live.                                                                                |
| behavior   | `allowChildInteraction`, `closeOnChildInteraction`, `closeOnBackgroundInteraction`, `showChildInTooltip`, `useReactNativeModal`, a childless centred tooltip, and `TooltipChildrenContext`. |

Rotation is enabled (`"orientation": "default"`) so the `Dimensions` change
handling and `supportedOrientations` can be checked too.

## Bugs this app has caught

Both are fixed on `master`; the screens that exposed them are the regression
checks.

- **The backdrop collapsed on React Native 0.85+** (fixed in #209).
  `StyleSheet.absoluteFillObject` was removed in RN 0.85, so spreading it gave
  the backdrop no positioning at all and it shrank to its own padding — 48pt
  with the default insets. Because React Native views do not clip, the bubble
  and lifted child still drew correctly, which made it look cosmetic. It was
  not: nothing below 48pt was hit-testable, so the tooltip could not be
  dismissed. Check it on any screen — the scrim should cover the whole display
  and a tap on the backdrop should close the tooltip.
- **A bubble with no room on its side was drawn over its anchor** (fixed in
  #210). On the placement screen, pick `left` with insets `64` and tap `1,1`:
  the requested side has negative room, so the tooltip now flips to the right
  instead of covering the plate with its arrow left hanging.

## Still worked around in the app

- **Android edge-to-edge offsets the lifted child.** Expo forces Android
  edge-to-edge, so `measure()` reports positions from the top of the screen,
  while the library's default `Modal` starts below the status bar. The lifted
  child and its bubble land one status-bar height too low, and the scrim leaves
  both system bars uncovered. [`src/Tip.js`](src/Tip.js) passes an edge-to-edge
  `Modal` through the `modalComponent` prop (`statusBarTranslucent` +
  `navigationBarTranslucent`), which fixes both without the
  `topAdjustment={-StatusBar.currentHeight}` the main README suggests. A
  candidate for the library's default `Modal`, since edge-to-edge is now the
  Android default.

## How the library is resolved

`metro.config.js` does four things:

1. Adds the repo root to `watchFolders`, so edits to `../src` trigger a reload.
2. Maps `react-native-walkthrough-tooltip` to the repo root via
   `resolver.extraNodeModules`, so the app imports the library by its published
   name but reads the real source.
3. Adds `example/node_modules` to `resolver.nodeModulesPaths`. The library
   source sits outside this project, so Metro cannot find `react`,
   `react-native` or `prop-types` by walking up from `../src`.
4. Blocks the repo root's `node_modules` via `resolver.blockList`. It pins
   React Native 0.55 as a `devDependency` for the Jest suite, and resolving two
   copies of React Native would break the app.

## The look

Every visual constant is derived from a single 64-character seed string in
[`src/seed.js`](src/seed.js) — change `SEED` and the app re-skins itself.
An FNV-1a hash of each 16-character quarter supplies one axis of the design:

| From the seed | Value | Used for                                                     |
| ------------- | ----- | ------------------------------------------------------------ |
| hue           | 217   | blue-slate ink and rules                                     |
| hue           | 37    | amber — reserved for the element being measured right now     |
| hue           | 282   | the faint violet cast in the paper                            |
| radius        | 0     | every corner                                                  |
| border        | 1     | drafted rules                                                 |
| pitch         | 13    | the spacing scale: 3 / 7 / 13 / 20 / 26 / 39                  |
| type ratio    | 1.333 | the type scale: 10 / 13 / 17 / 23 / 31                        |
| digit census  | 13/64 | the masthead ruling's cadence                                 |

The masthead is one tick per seed character, tall where that character is a
digit. Each screen owns one 16-character quarter, lit in amber — so the rule
doubles as a position indicator, and the readout strip closes with the same 16
characters.

Type is [Archivo](https://fonts.google.com/specimen/Archivo) for structure and
[IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) for anything
measured or literal — prop names, coordinates, values.
