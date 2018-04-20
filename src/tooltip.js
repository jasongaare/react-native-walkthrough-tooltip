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

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_ARROW_SIZE = new Size(16, 7);
const DEFAULT_DISPLAY_AREA = new Rect(24, 24, SCREEN_WIDTH - 48, SCREEN_HEIGHT - 48);

class Tooltip extends Component {
  constructor(props) {
    super(props);

    this.state = {
      contentSize: {},
      anchorPoint: {},
      tooltipOrigin: {},
      childRect: {},
      placement: 'auto',
      isTransitioning: false,
      isAwaitingShow: props.isVisible,
      readyToComputeGeom: false,
      waitingToComputeGeom: false,
      defaultAnimatedValues: {
        scale: new Animated.Value(0),
        translate: new Animated.ValueXY(),
        fade: new Animated.Value(0),
      },
    };
  }

  componentWillReceiveProps(nextProps) {
    const willBeVisible = nextProps.isVisible;
    const { isVisible } = this.props;

    if (willBeVisible !== isVisible) {
      if (willBeVisible) {
        // We want to start the show animation only when contentSize is known
        // so that we can have some logic depending on the geometry
        this.setState({ contentSize: {}, isAwaitingShow: true });

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

  getArrowSize = placement => {
    const size = this.props.arrowSize;
    switch (placement) {
      case 'left':
      case 'right':
        return new Size(size.height, size.width);
      default:
        return size;
    }
  };

  getArrowColorStyle = color => {
    return { borderTopColor: color };
  };

  getArrowRotation = placement => {
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
    const { anchorPoint, tooltipOrigin } = this.state;
    const arrowSize = this.props.arrowSize;

    // Create the arrow from a rectangle with the appropriate borderXWidth set
    // A rotation is then applied dependending on the placement
    // Also make it slightly bigger
    // to fix a visual artifact when the tooltip is animated with a scale
    const width = arrowSize.width + 2;
    const height = arrowSize.height * 2 + 2;

    return {
      left: anchorPoint.x - tooltipOrigin.x - width / 2,
      top: anchorPoint.y - tooltipOrigin.y - height / 2,
      width,
      height,
      borderTopWidth: height / 2,
      borderRightWidth: width / 2,
      borderBottomWidth: height / 2,
      borderLeftWidth: width / 2,
    };
  };

  getTranslateOrigin = () => {
    const { contentSize, tooltipOrigin, anchorPoint } = this.state;
    const tooltipCenter = new Point(tooltipOrigin.x + contentSize.width / 2,
      tooltipOrigin.y + contentSize.height / 2);
    return new Point(anchorPoint.x - tooltipCenter.x, anchorPoint.y - tooltipCenter.y);
  };

  measureContent = x => {
    const { width, height } = x.nativeEvent.layout;
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
    this.childWrapper.measureInWindow((x, y, width, height) => {
      this.setState({
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
        }
      );
    });
  };

  _doComputeGeometry = ({ contentSize }) => {
    const geom = this.computeGeometry({ contentSize });
    const { tooltipOrigin, anchorPoint, placement } = geom;

    this.setState({
      contentSize,
      tooltipOrigin,
      anchorPoint,
      placement,
      readyToComputeGeom: undefined,
      waitingToComputeGeom: false,
    },
      () => this._startAnimation({ show: true })
    );
  }

  _updateGeometry = ({ contentSize }) => {
    const geom = this.computeGeometry({ contentSize });
    const { tooltipOrigin, anchorPoint, placement } = geom;

    this.setState({
      tooltipOrigin,
      anchorPoint,
      placement,
    });
  }

  computeGeometry = ({ contentSize, placement }) => {
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

  computeAutoGeometry = ({ displayArea, contentSize }) => {
    // prefer top, so check that first. if none 'work', fall back to top
    const placementsToTry = ['top', 'bottom', 'left', 'right', 'top'];

    let geom;
    for (let i = 0; i < placementsToTry.length; i++) {
      const placement = placementsToTry[i];

      geom = this.computeGeometry({ contentSize, placement });
      const { tooltipOrigin } = geom;

      if (tooltipOrigin.x >= displayArea.x
        && tooltipOrigin.x <= displayArea.x + displayArea.width - contentSize.width
        && tooltipOrigin.y >= displayArea.y
        && tooltipOrigin.y <= displayArea.y + displayArea.height - contentSize.height) {
        break;
      }
    }

    return geom;
  };

  _startAnimation = ({ show }) => {
    this._startDefaultAnimation({ show, callback: () => this.setState({ isTransitioning: false }) });
    this.setState({ isTransitioning: true });
  };

  _startDefaultAnimation = ({ show, callback }) => {
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
    ]).start(callback);
  };

  _getDefaultAnimatedStyles = () => {
    const animatedValues = this.state.defaultAnimatedValues;

    return {
      backgroundStyle: {
        opacity: animatedValues.fade,
      },
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
      contentStyle: {
        transform: [
          { translateX: animatedValues.translate.x },
          { translateY: animatedValues.translate.y },
          { scale: animatedValues.scale },
        ],
      },
    };
  };

  _getExtendedStyles = () => {
    const background = [];
    const tooltip = [];
    const arrow = [];
    const content = [];

    const animatedStyles = this.props.animated ? this._getDefaultAnimatedStyles() : null;

    [animatedStyles, this.props].forEach(source => {
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
      typeof onChildPress === 'function' ||
      typeof onChildLongPress === 'function';

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
  }

  render() {
    if (!this.props.children) {
      return null;
    }

    const { tooltipOrigin, placement } = this.state;
    const { children, content, isVisible, onClose, tooltipBackgroundColor } = this.props;

    const extendedStyles = this._getExtendedStyles();
    const contentStyle = [styles.content, ...extendedStyles.content];
    const arrowColor = StyleSheet.flatten(contentStyle).backgroundColor;
    const arrowColorStyle = this.getArrowColorStyle(arrowColor);
    const arrowDynamicStyle = this.getArrowDynamicStyle();
    const contentSizeAvailable = this.state.contentSize.width;

    // Special case, force the arrow rotation even if it was overriden
    let arrowStyle = [styles.arrow, arrowDynamicStyle, arrowColorStyle, ...extendedStyles.arrow];
    const arrowTransform = (StyleSheet.flatten(arrowStyle).transform || []).slice(0);
    arrowTransform.unshift({ rotate: this.getArrowRotation(placement) });
    arrowStyle = [...arrowStyle, { transform: arrowTransform }];

    return (
      <View>
        {/* This renders the fullscreen tooltip */}
        <Modal
          transparent
          visible={isVisible}
          onRequestClose={onClose}
        >
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={[styles.container, contentSizeAvailable && styles.containerVisible]}>
              <Animated.View style={[styles.background, { backgroundColor: tooltipBackgroundColor }, ...extendedStyles.background]} />
              <Animated.View
                style={[styles.tooltip, {
                  top: tooltipOrigin.y,
                  left: tooltipOrigin.x,
                }, ...extendedStyles.tooltip]}
              >
                <Animated.View style={arrowStyle} />
                <Animated.View
                  onLayout={this.measureContent}
                  style={contentStyle}
                >
                  {content}
                </Animated.View>
              </Animated.View>
              {this.renderChildInTooltip()}
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* This renders the child element in place in the parent's layout */}
        <View ref={r => { this.childWrapper = r; }} onLayout={this.measureChildRect}>
          {children}
        </View>
      </View>
    );
  }
}

Tooltip.defaultProps = {
  animated: false,
  arrowSize: DEFAULT_ARROW_SIZE,
  content: (<View />),
  displayArea: DEFAULT_DISPLAY_AREA,
  isVisible: false,
  onClose: () => { },
  onChildLongPress: null,
  onChildPress: null,
  placement: 'auto',
  tooltipBackgroundColor: 'rgba(0,0,0,0.5)',
};

Tooltip.propTypes = {
  animated: PropTypes.bool,
  arrowSize: PropTypes.object,
  children: PropTypes.element,
  content: PropTypes.element,
  displayArea: PropTypes.any,
  isVisible: PropTypes.bool,
  onChildLongPress: PropTypes.func,
  onChildPress: PropTypes.func,
  onClose: PropTypes.func,
  placement: PropTypes.string,
  tooltipBackgroundColor: PropTypes.string,
};

export default Tooltip;