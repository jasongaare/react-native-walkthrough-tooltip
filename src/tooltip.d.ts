import React from 'react';
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'


export interface ToolTipSize {
    width: number,
    height: number
}


export interface ToolTopRect {
    x: number,
    y: number,
    width: number,
    height: number,
}

/**
 * Style Props
 * The tooltip styles should work out-of-the-box for most use cases, 
 * however should you need you can customize the styles of the tooltip using these props.
 */
export interface TooltipStyleProps {

    // Styles the triangle that points to the called out element
    arrowStyle?: StyleProp<ViewStyle>

    // Styles the overlay view that sits behind the tooltip, but over the current view
    backgroundStyle?: StyleProp<ViewStyle>

    // Styles the content wrapper that surrounds the content element
    contentStyle?: StyleProp<ViewStyle>

    // Styles the tooltip that wraps the arrow and content elements
    tooltipStyle?: StyleProp<ViewStyle>
}

export interface ToolTipProps extends Partial<TooltipStyleProps> {
    // When true, tooltip will animate in/out when showing/hiding
    animated?: boolean

    // The dimensions of the arrow on the bubble pointing to the highlighted element
    arrowSize?: ToolTipSize

    // Color of the fullscreen background beneath the tooltip. Overrides the backgroundStyle prop
    backgroundColor?: string

    // This is the view displayed in the tooltip popover bubble
    content?: React.ReactElement

    // Screen area where the tooltip may be displayed
    displayArea?: ToolTopRect

    // When true, tooltip is displayed
    isVisible?: boolean

    // Callback when user long presses on wrapped child. Overrides any touches in wrapped child element. 
    onChildLongPress?: (e: GestureResponderEvent) => void

    // Callback when user long presses on wrapped child. Overrides any touches in wrapped child element.
    onChildPress?: (event: GestureResponderEvent) => void

    // Callback fired when the user taps the tooltip background overlay
    onClose?: (event: GestureResponderEvent) => void

    /**
     * Where to position the tooltip - options: top, bottom, left, right, auto. 
     * When auto is specified, the library will determine the ideal placement so that the popover is fully 
     * visible within displayArea.
     */
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'

    /**
     * When the tooltip is rendered without a child element, 
     * this prop will determine the distance in pixels from the specified placement, 
     * i.e. a value of '25%' with placement 'bottom' would render the tooltip 25% of the 
     * device height above the bottom of the screen (prop ignored if tooltip is rendered 
     * with a child element)
     */
    childlessPlacementPadding?: number | string
}

/**
 ```
    // Simple Usage
    import Tooltip from 'react-native-walkthrough-tooltip';
    <Tooltip
        animated
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
 */
declare class Tooltip extends React.Component<ToolTipProps> {

}

export default ToolTipProps;