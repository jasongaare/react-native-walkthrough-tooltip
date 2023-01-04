# React Native Walkthrough Tooltip [![npm](https://img.shields.io/npm/v/react-native-walkthrough-tooltip.svg)](https://www.npmjs.com/package/react-native-walkthrough-tooltip) [![npm](https://img.shields.io/npm/dm/react-native-walkthrough-tooltip.svg)](https://www.npmjs.com/package/react-native-walkthrough-tooltip)

React Native Walkthrough Tooltip is a fullscreen modal that highlights whichever element it wraps.\
When not visible, the wrapped element is displayed normally.

*Used by* [`react-native-walkthrough`](https://github.com/jasongaare/react-native-walkthrough): a lightweight walkthrough library for React Native using react-native-walkthrough-tooltip

### Table of Contents

  - [Installation](#installation)
  - [Breaking Changes in Version 1.0](#breaking-changes-in-version-10)
  - [Example Usage](#example-usage)
  - [Screenshot](#screenshot)
  - [How it works](#how-it-works)
  - [Props](#props)
  - [Style Props](#style-props)
  - [Class definitions for props](#class-definitions-for-props)
  - [TooltipChildrenContext](#tooltipchildrencontext)

### Installation

```bash
yarn add react-native-walkthrough-tooltip
```

### Breaking Changes in Version 1.0

For Version 1.0, the library was refactored and simplified.

- **No more `animated` prop** - if you want to have your tooltips animated, use the last stable version: `0.6.1`. Hopefully animations can be added again in the sure (great idea for a PR!)
- **No more `displayArea` and `childlessPlacementPadding` props** - these have been replaced with the `displayInsets` prop, which allows you to simply declare how many pixels in from each side of the screen to inset the area the tooltip may display.
- **Tooltips are now bound by the displayInsets** - before if your content was larger than the displayArea prop, the tooltip would render outside of the display area. Now the tooltip should always resize to be inside the display area as defined by the `displayInsets` prop
- **Removed the "auto" option for placement** - you must now specify a direction
- **Added the "center" option for _childless_ placement** - option to center the tooltip within the bounds of the `displayInsets` when it does not point to a child
- **Added `useReactNativeModal` prop** - this allows you to enable/disable the usage of React Native's `Modal` component to render the tooltip content. It is true by default.

Changes to handling users pressing the tooltip child element:

- **No more `onChildPress` and `onChildLongPress` props** - touches are now passed to the child by default. This allows you to maintain the original functionality of the child element. Further, the tooltip will also automatically dismiss on interaction with the child element.
- **Added `closeOnChildInteraction` prop** - if you want the user to be able to interact with the child element, but not automatically dismiss the tooltip when they do so, set this to false (true by default)
- **Added `allowChildInteraction` prop** - if you'd like to disable interaction with the child element, set this to false (true by default). When false, tapping on the child element will call `onClose` as if the user touched the background element.

### Example Usage

To see an expo snack example, click [here](https://snack.expo.io/@matthewliuhello/react-native-walkthrough-tooltip-example)

```js
import Tooltip from 'react-native-walkthrough-tooltip';

<Tooltip
  isVisible={this.state.toolTipVisible}
  content={<Text>Check this out!</Text>}
  placement="top"
  onClose={() => this.setState({ toolTipVisible: false })}
>
  <TouchableHighlight style={styles.touchable}>
    <Text>Press me</Text>
  </TouchableHighlight>
</Tooltip>
```

### Screenshot

<img height ="400" src="example.gif" />

### How it works

The tooltip wraps an element _in place_ in your React Native rendering. When it renders, it measures the location of the element, using React Native's
[measure](https://facebook.github.io/react-native/docs/direct-manipulation.html#measurecallback). When the tooltip is displayed, it renders a _copy_ of the wrapped element positioned absolutely on the screen at the coordinates returned after measuring ([see `TooltipChildrenContext` below](#tooltipchildrencontext) if you need to tell the difference between the _copy_ and the _original_ element). This allows you to touch the element in the tooltip modal rendered above your current screen.

### Props

| Prop name        | Type             | Default value                          | Description                                                                                                                                                                                                    |
| ---------------- | ---------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accessible | bool| true | Set this to `false` if you do not want the root touchable element to be accessible. [See docs on accessible here](https://reactnative.dev/docs/accessibility#accessibility-properties)
| allowChildInteraction | bool| true | By default, the user can touch and interact with the child element. When this prop is false, the user cannot interact with the child element while the tooltip is visible. |
| arrowSize        | `Size`           | { width: 16, height: 8 }               | The dimensions of the arrow on the bubble pointing to the highlighted element                                                                                                                                  |
| backgroundColor  | string           | 'rgba(0,0,0,0.5)'                      | Color of the fullscreen background beneath the tooltip. **_Overrides_** the `backgroundStyle` prop                                                                                                             |
| childContentSpacing | number | 4 | The distance between the tooltip-rendered child and the arrow pointing to it |
| closeOnChildInteraction | bool | true | When child interaction is allowed, this prop determines if `onClose` should be called when the user interacts with the child element. Default is true (usually means the tooltip will dismiss once the user touches the element highlighted) |
| closeOnContentInteraction | bool | true | this prop determines if `onClose` should be called when the user interacts with the content element. Default is true (usually means the tooltip will dismiss once the user touches the content element) |
| content          | function/Element | `<View />`                             | This is the view displayed in the tooltip popover bubble                                                                                                                                                       |
| displayInsets | object | { top: 24, bottom: 24, left: 24, right: 24 } | The number of pixels to inset the tooltip on the screen (think of it like padding). The tooltip bubble should never render outside of these insets, so you may need to adjust your `content` accordingly |
| disableShadow | bool | false | When true, tooltips will not appear elevated. Disabling shadows will remove the warning: `RCTView has a shadow set but cannot calculate shadow efficiently` on IOS devices. |
| isVisible        | bool             | false                                  | When true, tooltip is displayed                                                                                                                                                                                |                                                            |
| onClose          | function         | null                                   | Callback fired when the user taps the tooltip background overlay                                                                                                                                               |
| placement        | string           | "top" \| "center"                                  | Where to position the tooltip - options: `top, bottom, left, right, center`. Default is `top` for tooltips rendered with children Default is `center` for tooltips rendered without children. <br><br>NOTE: `center` is only available with a childless placement, and the content will be centered within the bounds defined by the `displayInsets`. |
| showChildInTooltip | bool | true | Set this to `false` if you do NOT want to display the child alongside the tooltip when the tooltip is visible |
| supportedOrientations | array | ["portrait", "landscape"] | This prop allows you to control the supported orientations the tooltip modal can be displayed. It correlates directly with [the prop for React Native's Modal component](https://facebook.github.io/react-native/docs/modal#supportedorientations) (has no effect if `useReactNativeModal` is false) |
| topAdjustment          | number         | 0                                   | Value which provides additional vertical offest for the child element displayed in a tooltip. Commonly set to: `Platform.OS === 'android' ? -StatusBar.currentHeight : 0` due to an issue with React Native's measure function on Android
| horizontalAdjustment          | number         | 0                                   | Value which provides additional horizontal offest for the child element displayed in a tooltip. This is useful for adjusting the horizontal positioning of a highlighted child element if needed
| useInteractionManager | bool | false | Set this to true if you want the tooltip to wait to become visible until the callback for `InteractionManager.runAfterInteractions` is executed. Can be useful if you need to wait for navigation transitions to complete, etc. [See docs on InteractionManager here](https://facebook.github.io/react-native/docs/interactionmanager)
| useReactNativeModal | bool| true | By default, this library uses a `<Modal>` component from React Native. If you need to disable this, and simply render an absolutely positioned full-screen view, set `useReactNativeModal={false}`. This is especially useful if you desire to render a Tooltip while you have a different `Modal` rendered.

### Style Props

The tooltip styles should work out-of-the-box for most use cases, however should you need you can customize the styles of the tooltip using these props.

| Prop name            | Effect                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| arrowStyle           | Styles the triangle that points to the called out element                       |
| backgroundStyle      | Styles the overlay view that sits behind the tooltip, but over the current view |
| childrenWrapperStyle | Styles the view that wraps cloned children                                      |
| contentStyle         | Styles the content wrapper that surrounds the `content` element                 |
| tooltipStyle         | Styles the tooltip that wraps the arrow and content elements                    |

### Class definitions for props

* `Size` is an object with properties: `{ width: number, height: number }`

### TooltipChildrenContext

[React Context](https://reactjs.org/docs/context.html) that can be used to distinguish "real" children rendered inside parent's layout from their copies rendered inside tooltip's modal. The duplicate child rendered in the tooltip modal is wrapped in a Context.Provider which provides object with prop `tooltipDuplicate` set to `true`, so informed decisions may be made, if necessary, based on where the child rendered.

```js
import Tooltip, { TooltipChildrenContext } from 'react-native-walkthrough-tooltip';
...
<Tooltip>
  <ComponentA />
  <ComponentB>
    <TooltipChildrenContext.Consumer>
      {({ tooltipDuplicate }) => (
        // will only assign a ref to the original component
        <FlatList {...(!tooltipDuplicate && { ref: this.listRef })} />
      )}
    </TooltipChildrenContext.Consumer>
  </ComponentB>
</Tooltip>
```
