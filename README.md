# React Native Walkthrough Tooltip [![npm](https://img.shields.io/npm/v/react-native-walkthrough-tooltip.svg)](https://www.npmjs.com/package/react-native-walkthrough-tooltip) [![npm](https://img.shields.io/npm/dm/react-native-walkthrough-tooltip.svg)](https://www.npmjs.com/package/react-native-walkthrough-tooltip)

> Much credit belongs to [@jeanregisser](https://github.com/jeanregisser) and the [react-native-popover](https://github.com/jeanregisser/react-native-popover) library. Most of the animations and geometry computation belong to his library. Please check it out! It was an invaluable resource.

## Tooltip

React Native Walkthrough Tooltip is a fullscreen modal that highlights whichever element it wraps.\
When not visible, the wrapped element is displayed normally.

## Breaking Changes in Version 1.0

For Version 1.0, the library was refactored and simplified. 

- **No more `animated` prop** - if you want to have your tooltips animated, use the last stable version: `0.6.1`. Hopefully animations can be added again in the sure (great idea for a PR!)
- **No more `displayArea` and `childlessPlacementPadding` props** - these have been replaced with the `displayInsets` prop, which allows you to simply declare how many pixels in from each side of the screen to inset the area the tooltip may display.
- **Tooltips are now bound by the displayInsets** - before if your content was larger than the displayArea prop, the tooltip would render outside of the display area. Now the tooltip should always resize to be inside the display area as defined by the `displayInsets` prop
- **Removed the "auto" option for placement** - you must now specify a direction
- **Added the "center" option for _childless_ placement** - option to center the tooltip within the bounds of the `displayInsets` when it does not point to a child

 

### Installation

```
yarn add react-native-walkthrough-tooltip
```

### Example Usage

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

The tooltip wraps an element _in place_ in your React Native rendering. When it initially renders, it measures the location of the element in the window, utilizing React Native's
[measureInWindow](https://facebook.github.io/react-native/docs/direct-manipulation.html#measureinwindowcallback). When the tooltip is displayed, it renders a _copy_ of the wrapped element positioned absolutely on the screen at the coordinates returned after measuring. This allows you to touch the element in the tooltip modal rendered above your current screen.

### Listening for touches on highlighted child element

Optionally, you can provide the props `onChildPress` or `onChildLongPress` to override any functionality of the current element, should you find that useful. More information on this [can be found below](onPress).

### Props

| Prop name        | Type             | Default value                          | Description                                                                                                                                                                                                    |
| ---------------- | ---------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| arrowSize        | `Size`           | { width: 16, height: 8 }               | The dimensions of the arrow on the bubble pointing to the highlighted element                                                                                                                                  |
| backgroundColor  | string           | 'rgba(0,0,0,0.5)'                      | Color of the fullscreen background beneath the tooltip. **_Overrides_** the `backgroundStyle` prop                                                                                                             |
| content          | function/Element | `<View />`                             | This is the view displayed in the tooltip popover bubble                                                                                                                                                       |
| displayInsets | object | { top: 24, bottom: 24, left: 24, right: 24 } | The number of pixels to inset the tooltip on the screen (think of it like padding). The tooltip bubble should never render outside of these insets, so you may need to adjust your `content` accordingly |
| isVisible        | bool             | false                                  | When true, tooltip is displayed                                                                                                                                                                                |
| onChildLongPress | function         | null                                   | Callback when user long presses on wrapped child. **_Overrides_** any touches in wrapped child element. [See below for more info](onPress)                                                                     |
| onChildPress     | function         | null                                   | Callback when user long presses on wrapped child. **_Overrides_** any touches in wrapped child element. [See below for more info](onPress)                                                                     |
| onClose          | function         | null                                   | Callback fired when the user taps the tooltip background overlay                                                                                                                                               |
| placement        | string           | "top" \| "center"                                  | Where to position the tooltip - options: `top, bottom, left, right, center`. Default is `top` for tooltips rendered with children Default is `center` for tooltips rendered without children. <br><br>NOTE: `center` is only available with a childless placement, and the content will be centered within the bounds defined by the `displayInsets`. |
| showChildInTooltip | bool | true | Set this to `false` if you do NOT want to display the child alongside the tooltip when the tooltip is visible |
| supportedOrientations | array | ["portrait", "landscape"] | This prop allows you to control the supported orientations the tooltip modal can be displayed. It correlates directly with [the prop for React Native's Modal component](https://facebook.github.io/react-native/docs/modal#supportedorientations) |
| useInteractionManager | bool | false | Set this to true if you want the tooltip to wait to become visible until the callback for `InteractionManager.runAfterInteractions` is executed. Can be useful if you need to wait for navigation transitions to complete, etc. [See docs on InteractionManager here](https://facebook.github.io/react-native/docs/interactionmanager)

### Style Props

The tooltip styles should work out-of-the-box for most use cases, however should you need you can customize the styles of the tooltip using these props.

| Prop name       | Effect                                                                          |
| --------------- | ------------------------------------------------------------------------------- |
| arrowStyle      | Styles the triangle that points to the called out element                       |
| backgroundStyle | Styles the overlay view that sits behind the tooltip, but over the current view |
| contentStyle    | Styles the content wrapper that surrounds the `content` element                 |
| tooltipStyle    | Styles the tooltip that wraps the arrow and content elements                    |

### Class definitions for props

* `Size` is an object with properties: `{ width: number, height: number }`

<a name="onPress"></a>

### onChildPress and onChildLongPress

When providing either of these functions, React Native Walkthrough Tooltip will wrap your entire child element in a touchable like so:

```js
<TouchableWithoutFeedback onPress={onChildPress} onLongPress={onChildLongPress}>
  {childElement}
</TouchableWithoutFeedback>
```

**NOTE: This will disable and override any touch events on your child element**

One possible use case for these functions would be a scenerio where you are highlighting new functionality and want to restrict a user to ONLY do a certain action when they press on an element. While perhaps uncommon, this use case was relevant for another library I am working on, so it may be useful for you. When these props are NOT provided, all touch events on children occur as expected.

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
