import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
import styles from './styles';
import TooltipChildrenContext from './tooltip-children.context';

export { TooltipChildrenContext };

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const DEFAULT_ARROW_SIZE = new Size(16, 8);
const DEFAULT_PADDING = 24;

const invertPlacement = (placement) => {
  switch (placement) {
    case 'top':
      return 'bottom';
    case 'bottom':
      return 'top';
    case 'right':
      return 'left';
    case 'left':
      return 'right';
    default:
      return placement;
  }
};

class Tooltip extends Component {
  static defaultProps = {
    animated: false,
    arrowSize: DEFAULT_ARROW_SIZE,
    backgroundColor: 'rgba(0,0,0,0.5)',
    childlessPlacementPadding: DEFAULT_PADDING,
    children: null,
    content: <View />,
    displayArea: new Rect(
      DEFAULT_PADDING,
      DEFAULT_PADDING,
      SCREEN_WIDTH - DEFAULT_PADDING * 2,
      SCREEN_HEIGHT - DEFAULT_PADDING * 2,
    ),
    isVisible: false,
    onChildLongPress: null,
    onChildPress: null,
    onClose: null,
    placement: 'auto',
  };

  constructor(props) {
    super(props);

    const { isVisible } = props;

    this.childWrapper = React.createRef();
    this.state = {
      // no need to wait for interactions if not visible initially
      waitingForInteractions: isVisible,
      contentSize: new Size(0, 0),
      anchorPoint: new Point(0, 0),
      tooltipOrigin: new Point(0, 0),
      childRect: new Rect(0, 0, 0, 0),
      // if we have no children, and place the tooltip at the "top" we want it to
      // behave like placement "bottom", i.e. display below the top of the screen
      placement: !props.children ? invertPlacement(props.placement) : props.placement,
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

  componentWillReceiveProps(nextProps) {
    const willBeVisible = nextProps.isVisible;
    const nextContent = nextProps.content;
    const { isVisible, content } = this.props;

    if (nextContent !== content && willBeVisible) {
      // The location of the child element may have changed based on
      // transition animations in the corresponding view, so remeasure
      InteractionManager.runAfterInteractions(() => {
        this.measureChildRect();
      });
    } else if (willBeVisible !== isVisible) {
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

  getArrowSize = (placement) => {
    const size = this.props.arrowSize;
    switch (placement) {
      case 'left':
      case 'right':
        return new Size(size.height, size.width);
      default:
        return size;
    }
  };

  getArrowColorStyle = (color) => {
    return { borderTopColor: color };
  };

  getArrowRotation = (placement) => {
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
    const height = arrowSize.height * 2 + 2;
    let marginTop = 0;
    let marginLeft = 0;

    if (placement === 'bottom') {
      marginTop = arrowSize.height;
    } else if (placement === 'right') {
      marginLeft = arrowSize.height;
    }

    return {
      left: anchorPoint.x - tooltipOrigin.x - (width / 2 - marginLeft),
      top: anchorPoint.y - tooltipOrigin.y - (height / 2 - marginTop),
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
      (tooltipOrigin.x + contentSize.width) / 2,
      (tooltipOrigin.y + contentSize.height) / 2,
    );
    return new Point(anchorPoint.x - tooltipCenter.x, anchorPoint.y - tooltipCenter.y);
  };

  waitAndMeasureChildRect = (clearWaitingForInteractions) => {
    setTimeout(() => {
      this.measureChildRect();

      if (clearWaitingForInteractions) {
        this.setState({ waitingForInteractions: false });
      }
    }, 1000);
  };

  measureContent = (e) => {
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

  finishMeasurements = () => {
    const { contentSize, waitingToComputeGeom } = this.state;
    if (waitingToComputeGeom) {
      this._doComputeGeometry({ contentSize });
    } else if (contentSize.width !== null) {
      this._updateGeometry({ contentSize });
    }
    this.setState({ measurementsFinished: true });
  };

  measureChildRect = () => {
    if (
      this.childWrapper.current &&
      typeof this.childWrapper.current.measureInWindow === 'function'
    ) {
      this.childWrapper.current.measureInWindow((x, y, width, height) => {
        this.setState(
          {
            childRect: new Rect(x, y, width, height),
            readyToComputeGeom: true,
          },
          () => this.finishMeasurements(),
        );
      });
    } else {
      // mock the placement of a child to compute geom
      let rectForChildlessPlacement = { ...this.state.childRect };
      let placementPadding = DEFAULT_PADDING;

      const { childlessPlacementPadding, placement } = this.props;
      // handle percentages
      if (typeof childlessPlacementPadding === 'string') {
        const isPercentage =
          childlessPlacementPadding.substring(childlessPlacementPadding.length - 1) === '%';
        const paddingValue = parseFloat(childlessPlacementPadding, 10);
        const verticalPlacement = placement === 'top' || placement === 'bottom';

        if (isPercentage) {
          placementPadding =
            (paddingValue / 100.0) * (verticalPlacement ? SCREEN_HEIGHT : SCREEN_WIDTH);
        } else {
          placementPadding = paddingValue;
        }
      } else {
        placementPadding = childlessPlacementPadding;
      }

      if (Number.isNaN(placementPadding)) {
        throw new Error('[Tooltip] Invalid value passed to childlessPlacementPadding');
      }

      const CENTER_X = SCREEN_WIDTH / 2;
      const CENTER_Y = SCREEN_HEIGHT / 2;

      switch (placement) {
        case 'bottom':
          rectForChildlessPlacement = new Rect(CENTER_X, SCREEN_HEIGHT - placementPadding, 0, 0);
          break;
        case 'left':
          rectForChildlessPlacement = new Rect(placementPadding, CENTER_Y, 0, 0);
          break;
        case 'right':
          rectForChildlessPlacement = new Rect(SCREEN_WIDTH - placementPadding, CENTER_Y, 0, 0);
          break;
        default:
        case 'top':
          rectForChildlessPlacement = new Rect(CENTER_X, placementPadding, 0, 0);
          break;
      }

      this.setState(
        {
          childRect: rectForChildlessPlacement,
          readyToComputeGeom: true,
        },
        () => this.finishMeasurements(),
      );
    }
  };

  _doComputeGeometry = ({ contentSize }) => {
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

  _updateGeometry = ({ contentSize }) => {
    const geom = this.computeGeometry({ contentSize });
    const { tooltipOrigin, anchorPoint, placement } = geom;

    this.setState({
      tooltipOrigin,
      anchorPoint,
      placement,
    });
  };

  computeGeometry = ({ contentSize, placement }) => {
    const innerPlacement = placement || this.state.placement;
    const { displayArea } = this.props;

    const options = {
      displayArea,
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

  computeAutoGeometry = ({ displayArea, contentSize }) => {
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

    return geom;
  };

  _startAnimation = ({ show }) => {
    const animDuration = 300;
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

    [animatedStyles, this.props].forEach((source) => {
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
        <TooltipChildrenContext.Provider value={{ tooltipDuplicate: true }}>
          {children}
        </TooltipChildrenContext.Provider>
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

    const noChildren = !children;

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
                {noChildren ? null : <Animated.View style={arrowStyle} />}
                <Animated.View onLayout={this.measureContent} style={contentStyle}>
                  {content}
                </Animated.View>
              </Animated.View>
              {noChildren ? null : this.renderChildInTooltip()}
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* This renders the child element in place in the parent's layout */}
        {noChildren ? null : (
          <View ref={this.childWrapper} onLayout={this.measureChildRect}>
            {children}
          </View>
        )}
      </View>
    );
  }
}

Tooltip.propTypes = {
  animated: PropTypes.bool,
  arrowSize: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number,
  }),
  backgroundColor: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  displayArea: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    height: PropTypes.number,
    width: PropTypes.number,
  }),
  isVisible: PropTypes.bool,
  onChildLongPress: PropTypes.func,
  onChildPress: PropTypes.func,
  onClose: PropTypes.func,
  placement: PropTypes.string,
  childlessPlacementPadding: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default Tooltip;
