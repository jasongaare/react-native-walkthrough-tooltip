// @flow
import React, { Component } from 'react';
import type { Node } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  InteractionManager,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Point,
  Size,
  Rect,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry,
} from './geom';
import type { SizeType, PointType, RectType } from './geom';
import styles from './styles';

const SCREEN_HEIGHT: number = Dimensions.get('window').height;
const SCREEN_WIDTH: number = Dimensions.get('window').width;

const DEFAULT_ARROW_SIZE: SizeType = new Size(16, 8);
const DEFAULT_DISPLAY_AREA: RectType = new Rect(24, 24, SCREEN_WIDTH - 48, SCREEN_HEIGHT - 48);

type PlacementType = 'auto' | 'top' | 'bottom' | 'left' | 'right';

type Props = {
  animated: boolean,
  arrowSize: SizeType,
  arrowStyle: StyleSheet.Styles,
  backgroundColor: string,
  backgroundStyle: StyleSheet.Styles,
  children: Node,
  content: Node,
  contentStyle: StyleSheet.Styles,
  displayArea: RectType,
  isVisible: boolean,
  onChildLongPress: () => void,
  onChildPress: () => void,
  onClose: () => void,
  placement: PlacementType,
  tooltipStyle: StyleSheet.Styles,
};

type State = {
  waitingForInteractions: boolean,
  contentSize: SizeType,
  anchorPoint: PointType,
  tooltipOrigin: PointType,
  childRect: RectType,
  placement: PlacementType,
  readyToComputeGeom: boolean,
  waitingToComputeGeom: boolean,
  measurementsFinished: boolean,
};

type ContentSizeProps = {
  contentSize: SizeType,
};

type ComputeGeomProps = {
  contentSize: SizeType,
  placement?: PlacementType,
};

type ComputeAutoGeomProps = {
  displayArea: RectType,
  contentSize: SizeType,
};

type ExtendedStylesProps = {
  backgroundStyle: StyleSheet.Styles,
  tooltipStyle: StyleSheet.Styles,
  arrowStyle: StyleSheet.Styles,
  contentStyle: StyleSheet.Styles,
};

class Tooltip extends Component<Props, State> {
  static defaultProps = {
    animated: false,
    arrowSize: DEFAULT_ARROW_SIZE,
    backgroundColor: 'rgba(0,0,0,0.5)',
    children: null,
    content: <View />,
    displayArea: DEFAULT_DISPLAY_AREA,
    isVisible: false,
    onChildLongPress: null,
    onChildPress: null,
    onClose: null,
    placement: 'auto',
  };

  constructor(props: Props) {
    super(props);

    const { isVisible } = props;

    this.state = {
      // no need to wait for interactions if not visible initially
      waitingForInteractions: isVisible,
      contentSize: new Size(0, 0),
      anchorPoint: new Point(0, 0),
      tooltipOrigin: new Point(0, 0),
      childRect: new Rect(0, 0, 0, 0),
      placement: 'auto',
      readyToComputeGeom: false,
      waitingToComputeGeom: false,
      measurementsFinished: false,
      defaultAnimatedValues: {
        scale: new Animated.Value(0),
        translate: new Animated.ValueXY(),
        fade: new Animated.Value(0),
      },
    };
  }

  componentDidMount() {
    if (this.state.waitingForInteractions) {
      InteractionManager.runAfterInteractions(() => {
        this.measureChildRect();
        this.setState({ waitingForInteractions: false });
      });
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const willBeVisible = nextProps.isVisible;
    const { isVisible } = this.props;

    if (willBeVisible !== isVisible) {
      if (willBeVisible) {
        // We want to start the show animation only when contentSize is known
        // so that we can have some logic depending on the geometry
        this.setState({ contentSize: new Size(0, 0) });

        // The location of the child element may have changed based on
        // transition animations in the corresponding view, so remeasure
        InteractionManager.runAfterInteractions(() => {
          this.measureChildRect();
        });
      } else {
        this._startAnimation({ show: false });
      }
    }
  }

  componentDidUpdate() {
    // We always want the measurements finished flag to be false
    // after the tooltip is closed
    if (this.state.measurementsFinished && !this.props.isVisible) {
      this.setState({ measurementsFinished: false });
    }
  }

  getArrowSize = (placement: PlacementType) => {
    const size = this.props.arrowSize;
    switch (placement) {
      case 'left':
      case 'right':
        return new Size(size.height, size.width);
      default:
        return size;
    }
  };

  getArrowColorStyle = (color: string) => {
    return { borderTopColor: color };
  };

  getArrowRotation = (placement: PlacementType) => {
    switch (placement) {
      case 'bottom':
        return '180deg';
      case 'left':
        return '-90deg';
      case 'right':
        return '90deg';
      default:
        return '0deg';
    }
  };

  getArrowDynamicStyle = () => {
    const { anchorPoint, tooltipOrigin, placement } = this.state;
    const arrowSize = this.props.arrowSize;

    // Create the arrow from a rectangle with the appropriate borderXWidth set
    // A rotation is then applied dependending on the placement
    // Also make it slightly bigger
    // to fix a visual artifact when the tooltip is animated with a scale
    const width = arrowSize.width + 2;
    const height = (arrowSize.height * 2) + 2;
    let marginTop = 0;
    let marginLeft = 0;

    if (placement === 'bottom') {
      marginTop = arrowSize.height;
    } else if (placement === 'right') {
      marginLeft = arrowSize.height;
    }

    return {
      left: anchorPoint.x - tooltipOrigin.x - ((width / 2) - marginLeft),
      top: anchorPoint.y - tooltipOrigin.y - ((height / 2) - marginTop),
      width,
      height,
      borderTopWidth: height / 2,
      borderRightWidth: width / 2,
      borderBottomWidth: height / 2,
      borderLeftWidth: width / 2,
    };
  };

  getTooltipPlacementStyles = () => {
    const { height } = this.props.arrowSize;
    const { tooltipOrigin } = this.state;

    switch (this.state.placement) {
      case 'bottom':
        return {
          paddingTop: height,
          top: tooltipOrigin.y - height,
          left: tooltipOrigin.x,
        };
      case 'top':
        return {
          paddingBottom: height,
          top: tooltipOrigin.y,
          left: tooltipOrigin.x,
        };
      case 'right':
        return {
          paddingLeft: height,
          top: tooltipOrigin.y,
          left: tooltipOrigin.x - height,
        };
      case 'left':
        return {
          paddingRight: height,
          top: tooltipOrigin.y,
          left: tooltipOrigin.x,
        };
      default:
        return {};
    }
  };

  getTranslateOrigin = () => {
    const { contentSize, tooltipOrigin, anchorPoint } = this.state;
    const tooltipCenter = new Point(
      tooltipOrigin.x + (contentSize.width / 2),
      tooltipOrigin.y + (contentSize.height / 2),
    );
    return new Point(anchorPoint.x - tooltipCenter.x, anchorPoint.y - tooltipCenter.y);
  };

  // $FlowFixMe: need to add type for nativeEvent
  measureContent = e => {
    const { width, height } = e.nativeEvent.layout;
    const contentSize = new Size(width, height);

    if (!this.state.readyToComputeGeom) {
      this.setState({
        waitingToComputeGeom: true,
        contentSize,
      });
    } else {
      this._doComputeGeometry({ contentSize });
    }
  };

  measureChildRect = () => {
    // $FlowFixMe: need to add type childWrapper
    this.childWrapper.measureInWindow((x, y, width, height) => {
      this.setState(
        {
          childRect: new Rect(x, y, width, height),
          readyToComputeGeom: true,
        },
        () => {
          const { contentSize, waitingToComputeGeom } = this.state;
          if (waitingToComputeGeom) {
            this._doComputeGeometry({ contentSize });
          } else if (contentSize.width !== null) {
            this._updateGeometry({ contentSize });
          }
          this.setState({ measurementsFinished: true });
        },
      );
    });
  };

  _doComputeGeometry = ({ contentSize }: ContentSizeProps) => {
    const geom = this.computeGeometry({ contentSize });
    const { tooltipOrigin, anchorPoint, placement } = geom;

    this.setState(
      {
        contentSize,
        tooltipOrigin,
        anchorPoint,
        placement,
        readyToComputeGeom: undefined,
        waitingToComputeGeom: false,
      },
      () => {
        this._startAnimation({ show: true });
      },
    );
  };

  _updateGeometry = ({ contentSize }: ContentSizeProps) => {
    const geom = this.computeGeometry({ contentSize });
    const { tooltipOrigin, anchorPoint, placement } = geom;

    this.setState({
      tooltipOrigin,
      anchorPoint,
      placement,
    });
  };

  computeGeometry = ({ contentSize, placement }: ComputeGeomProps) => {
    const innerPlacement = placement || this.props.placement;

    const options = {
      displayArea: this.props.displayArea,
      childRect: this.state.childRect,
      arrowSize: this.getArrowSize(innerPlacement),
      contentSize,
    };

    switch (innerPlacement) {
      case 'top':
        return computeTopGeometry(options);
      case 'bottom':
        return computeBottomGeometry(options);
      case 'left':
        return computeLeftGeometry(options);
      case 'right':
        return computeRightGeometry(options);
      default:
        return this.computeAutoGeometry(options);
    }
  };

  computeAutoGeometry = ({ displayArea, contentSize }: ComputeAutoGeomProps) => {
    // prefer top, so check that first. if none 'work', fall back to top
    const placementsToTry = ['top', 'bottom', 'left', 'right', 'top'];

    let geom;
    for (let i = 0; i < placementsToTry.length; i += 1) {
      const placement = placementsToTry[i];

      geom = this.computeGeometry({ contentSize, placement });
      const { tooltipOrigin } = geom;

      if (
        tooltipOrigin.x >= displayArea.x &&
        tooltipOrigin.x <= displayArea.x + displayArea.width - contentSize.width &&
        tooltipOrigin.y >= displayArea.y &&
        tooltipOrigin.y <= displayArea.y + displayArea.height - contentSize.height
      ) {
        break;
      }
    }

    // $FlowFixMe: need to fix issue regarding "uninitiated variable"
    return geom;
  };

  _startAnimation = ({ show }: { show: boolean }) => {
    const animDuration = 300;
    // $FlowFixMe: need to add type for Animated values
    const values = this.state.defaultAnimatedValues;
    const translateOrigin = this.getTranslateOrigin();

    if (show) {
      values.translate.setValue(translateOrigin);
    }

    const commonConfig = {
      duration: animDuration,
      easing: show ? Easing.out(Easing.back()) : Easing.inOut(Easing.quad),
    };

    Animated.parallel([
      Animated.timing(values.fade, {
        toValue: show ? 1 : 0,
        ...commonConfig,
      }),
      Animated.timing(values.translate, {
        toValue: show ? new Point(0, 0) : translateOrigin,
        ...commonConfig,
      }),
      Animated.timing(values.scale, {
        toValue: show ? 1 : 0,
        ...commonConfig,
      }),
    ]).start();
  };

  _getDefaultAnimatedStyles = () => {
    // $FlowFixMe: need to add type for Animated values
    const animatedValues = this.state.defaultAnimatedValues;

    return {
      arrowStyle: {
        transform: [
          {
            scale: animatedValues.scale.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
      backgroundStyle: {
        opacity: animatedValues.fade,
      },
      contentStyle: {
        transform: [
          { translateX: animatedValues.translate.x },
          { translateY: animatedValues.translate.y },
          { scale: animatedValues.scale },
        ],
      },
      tooltipStyle: {},
    };
  };

  _getExtendedStyles = () => {
    const background = [];
    const tooltip = [];
    const arrow = [];
    const content = [];

    const animatedStyles = this.props.animated ? this._getDefaultAnimatedStyles() : null;

    [animatedStyles, this.props].forEach((source: ExtendedStylesProps | null) => {
      if (source) {
        background.push(source.backgroundStyle);
        tooltip.push(source.tooltipStyle);
        arrow.push(source.arrowStyle);
        content.push(source.contentStyle);
      }
    });

    return {
      background,
      tooltip,
      arrow,
      content,
    };
  };

  renderChildInTooltip = () => {
    const { height, width, x, y } = this.state.childRect;
    const { children, onChildPress, onChildLongPress } = this.props;
    const wrapInTouchable =
      typeof onChildPress === 'function' || typeof onChildLongPress === 'function';

    const childElement = (
      <View
        pointerEvents={wrapInTouchable ? 'box-only' : 'auto'}
        style={{
          position: 'absolute',
          height,
          width,
          top: y,
          left: x,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    );

    if (wrapInTouchable) {
      return (
        <TouchableWithoutFeedback onPress={onChildPress} onLongPress={onChildLongPress}>
          {childElement}
        </TouchableWithoutFeedback>
      );
    }

    return childElement;
  };

  render() {
    if (!this.props.children) {
      return null;
    }

    const { measurementsFinished, placement, waitingForInteractions } = this.state;
    const { backgroundColor, children, content, isVisible, onClose } = this.props;

    const extendedStyles = this._getExtendedStyles();
    const contentStyle = [styles.content, ...extendedStyles.content];
    const arrowColor = StyleSheet.flatten(contentStyle).backgroundColor;
    const arrowColorStyle = this.getArrowColorStyle(arrowColor);
    const arrowDynamicStyle = this.getArrowDynamicStyle();
    const contentSizeAvailable = this.state.contentSize.width;
    const tooltipPlacementStyles = this.getTooltipPlacementStyles();

    // Special case, force the arrow rotation even if it was overriden
    let arrowStyle = [styles.arrow, arrowDynamicStyle, arrowColorStyle, ...extendedStyles.arrow];
    const arrowTransform = (StyleSheet.flatten(arrowStyle).transform || []).slice(0);
    arrowTransform.unshift({ rotate: this.getArrowRotation(placement) });
    arrowStyle = [...arrowStyle, { transform: arrowTransform }];

    return (
      <View>
        {/* This renders the fullscreen tooltip */}
        <Modal transparent visible={isVisible && !waitingForInteractions} onRequestClose={onClose}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View
              style={[
                styles.container,
                contentSizeAvailable && measurementsFinished && styles.containerVisible,
              ]}
            >
              <Animated.View
                style={[styles.background, ...extendedStyles.background, { backgroundColor }]}
              />
              <Animated.View
                style={[styles.tooltip, ...extendedStyles.tooltip, tooltipPlacementStyles]}
              >
                <Animated.View style={arrowStyle} />
                <Animated.View onLayout={this.measureContent} style={contentStyle}>
                  {content}
                </Animated.View>
              </Animated.View>
              {this.renderChildInTooltip()}
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* This renders the child element in place in the parent's layout */}
        <View
          ref={r => {
            // $FlowFixMe: need to add type childWrapper
            this.childWrapper = r;
          }}
          onLayout={this.measureChildRect}
        >
          {children}
        </View>
      </View>
    );
  }
}

export default Tooltip;
