// Type definitions for react-native-walkthrough-tooltip 1.0.0
// Original definitions by: Siraj Alam https://github.com/sirajalam049

declare module 'react-native-walkthrough-tooltip' {
  import React from 'react';
  import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

  type Orientation =
    | 'portrait'
    | 'portrait-upside-down'
    | 'landscape'
    | 'landscape-left'
    | 'landscape-right';

  export interface TooltipSize {
    width: number;
    height: number;
  }

  export interface TooltipDisplayInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }

  /**
   * Style Props
   * The tooltip styles should work out-of-the-box for most use cases,
   * however should you need you can customize the styles of the tooltip using these props.
   */
  export interface TooltipStyleProps {
    // Styles the triangle that points to the called out element
    arrowStyle?: StyleProp<ViewStyle>;

    // Styles the overlay view that sits behind the tooltip, but over the current view
    backgroundStyle?: StyleProp<ViewStyle>;

    // Styles the content wrapper that surrounds the content element
    contentStyle?: StyleProp<ViewStyle>;

    // Styles the tooltip that wraps the arrow and content elements
    tooltipStyle?: StyleProp<ViewStyle>;

    // Styles the View element that wraps the children to clone it
    childrenWrapperStyle?: StyleProp<ViewStyle>;

    // Styles the view element that wraps the original children
    parentWrapperStyle?: StyleProp<ViewStyle>
  }

  export interface TooltipProps extends Partial<TooltipStyleProps> {
    // When true (default), user can interact with child element
    allowChildInteraction?: boolean;

    // The dimensions of the arrow on the bubble pointing to the highlighted element
    arrowSize?: TooltipSize;

    // Color of the fullscreen background beneath the tooltip. Overrides the backgroundStyle prop
    backgroundColor?: string;

    // When true (default), onClose prop is called when user touches child element
    closeOnChildInteraction?: boolean;

    // When true (default), onClose prop is called when user touches content element
    closeOnContentInteraction?: boolean;

    // When true (default), onClose prop is called when user touches background element
    closeOnBackgroundInteraction?: boolean;

    // This is the view displayed in the tooltip popover bubble
    content?: React.ReactElement;

    // The number of pixels to inset the tooltip on the screen
    displayInsets?: TooltipDisplayInsets;

    // When true, tooltip shadow aren't displayed
    // Fix: https://github.com/jasongaare/react-native-walkthrough-tooltip/issues/81
    disableShadow?: boolean;

    // When true, tooltip is displayed
    isVisible?: boolean;

    // Callback fired when the user taps the tooltip background overlay
    onClose?: (event: GestureResponderEvent) => void;

    /**
     * Where to position the tooltip - options: top, bottom, left, right, center.
     * Default is 'top' for tooltips rendered with children. Default is 'center' for tooltips
     * rendered without children. NOTE: center is only available with a childless placement,
     * and the content will be centered within the bounds defined by the displayInsets.
     */
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';

    // Determines if the tooltip's children should be shown in the foreground when the tooltip is visible.
    showChildInTooltip?: boolean;

    // The supportedOrientations prop allows the modal to be rotated to any of the specified orientations.
    supportedOrientations?: Orientation[];

    /**
     * Set this to true if you want the tooltip to wait to become visible until the callback
     * from InteractionManager.runAfterInteractions is executed. Can be useful if you need
     * to wait for navigation transitions to complete, etc
     */
    useInteractionManager?: boolean;

    /**
     * When false, will not use a React Native Modal component to display tooltip,
     * but rather an absolutely positioned view
     */
    useReactNativeModal?: boolean;

    /**
     *The distance between the tooltip-rendered child and the arrow pointing to it
     */
    childContentSpacing?: number;

    /**
     *The top value to set for the container. This is useful to fix the issue with StatusBar in Android.
     ```js
        // Usage Example
        <Tooltip topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0} />
     ```
    */
    topAdjustment?: number;

    /**
     * Horizontal adjustment in pixels for the container. If for some reason the alignment of the child element we are
     * highlighting is off, the horizontalAdjustment prop can be used to tweak the horizontal positioning of the child
     * element which we are highlighting.
     ```js
        // Usage Example
        <Tooltip horizontalAdjustment={-84} />
     ```
     */
    horizontalAdjustment?: number;

    /**
     *Set this to false if you want to override the default accessible on the root TouchableWithoutFeedback
     */
    accessible?: boolean;

    /** Will use given component instead of default react-native Modal component **/
    modalComponent?: object;

    // Support for nested elements within the Tooltip component.
    children?: React.ReactNode;
  }

  /**
     ```js
        // Usage Example
        import Tooltip, { TooltipChildrenContext } from 'react-native-walkthrough-tooltip';
        <Tooltip>
            <TooltipChildrenContext.Consumer>
                {({ tooltipDuplicate }) => (
                    <ScrollView scrollEnabled={!tooltipDuplicate}>
                        {children}
                    </ScrollView>
                )}
            </TooltipChildrenContext.Consumer>
        </Tooltip>
    ```
     */
  export const TooltipChildrenContext: React.Context<{
    tooltipDuplicate: boolean;
  }>;

  /**
     ```js
        // Simple Usage
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
     */
  class Tooltip extends React.Component<TooltipProps> {}

  export default Tooltip;
}
