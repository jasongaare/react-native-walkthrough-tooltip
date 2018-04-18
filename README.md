# React Native Walkthrough Tooltip

> Much credit belongs to [jeanregisster](https://github.com/jeanregisser) and the [react-native-popover](https://github.com/jeanregisser/react-native-popover) library. Most of the animations belong to his library. Please check it out!

## Tooltip

Tooltip is a fullscreen modal that highlights whichever element it is wrapping. When the tooltip is not visible, the wrapped element is displayed normally.

### Props


| Prop        | Type             | Default                                      | Description                                                                                                                                                                                                      |
| ----------- | ---------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| animated    | bool             | false                                        | Whether or not the bubble animates in (disabled by default because it is sketchy slow on Android)                                                                                                                |
| arrowSize   | Size             | { width: 16, height: 7 }                     | The dimensions of the arrow on the bubble pointing to the highlighted element                                                                                                                                    |
| content     | function/Element |                                              | This is the view displayed in the tooltip popover bubble                                                                                                                                                         |
| displayArea | Rect             | screen rect with 24px of margin on all sides | Area where the popover is allowed to be displayed                                                                                                                                                                |
| isVisible   | bool             | false                                        | Show/Hide the popover                                                                                                                                                                                            |
| onClose     | function         |                                              | Callback to be fired when the user taps the popover                                                                                                                                                              |
| placement   | string           | 'auto'                                       | How to position the popover - top &#124; bottom &#124; left &#124; right &#124; auto. When 'auto' is specified, it will determine the ideal placement so that the popover is fully visible within `displayArea`. |



`Rect` is an object with the following properties: `{x: number, y: number, width: number, height: number}`

`Size` is an object with the following properties: `{width: number, height: number}`


### Example Usage

```js
<Tooltip
  isVisible={tooltipVisible}
  onClose={this.trayTooltip}
  content={<Content />}
  placement="top"
>
  <HighlightedElement />
</Tooltip>
```