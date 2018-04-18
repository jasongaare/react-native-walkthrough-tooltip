import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  View,
  Easing,
  Modal,
  InteractionManager,
} from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    opacity: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  containerVisible: {
    opacity: 1,
  },
  background: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  popover: {
    backgroundColor: 'transparent',
    position: 'absolute',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    shadowOpacity: 0.8,
  },
  content: {
    borderRadius: 3,
    padding: 8,
    backgroundColor: '#fff',
  },
  arrow: {
    position: 'absolute',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
});

function Point(x, y) {
  this.x = x;
  this.y = y;
}

function Size(width, height) {
  this.width = width;
  this.height = height;
}

function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

const DEFAULT_ARROW_SIZE = new Size(16, 7);

class Tooltip extends Component {
  constructor(props) {
    super(props);

    this.state = {
      contentSize: {},
      anchorPoint: {},
      popoverOrigin: {},
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
    const { anchorPoint, popoverOrigin } = this.state;
    const arrowSize = this.props.arrowSize;

    // Create the arrow from a rectangle with the appropriate borderXWidth set
    // A rotation is then applied dependending on the placement
    // Also make it slightly bigger
    // to fix a visual artifact when the popover is animated with a scale
    const width = arrowSize.width + 2;
    const height = arrowSize.height * 2 + 2;

    return {
      left: anchorPoint.x - popoverOrigin.x - width / 2,
      top: anchorPoint.y - popoverOrigin.y - height / 2,
      width,
      height,
      borderTopWidth: height / 2,
      borderRightWidth: width / 2,
      borderBottomWidth: height / 2,
      borderLeftWidth: width / 2,
    };
  };

  getTranslateOrigin = () => {
    const { contentSize, popoverOrigin, anchorPoint } = this.state;
    const popoverCenter = new Point(popoverOrigin.x + contentSize.width / 2,
      popoverOrigin.y + contentSize.height / 2);
    return new Point(anchorPoint.x - popoverCenter.x, anchorPoint.y - popoverCenter.y);
  };

  measureContent = x => {
    const { width, height } = x.nativeEvent.layout;
    const contentSize = { width, height };

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
        childRect: { x, y, width, height },
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
    const { popoverOrigin, anchorPoint, placement } = geom;

    this.setState({
      contentSize,
      popoverOrigin,
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
    const { popoverOrigin, anchorPoint, placement } = geom;

    this.setState({
      popoverOrigin,
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
        return this.computeTopGeometry(options);
      case 'bottom':
        return this.computeBottomGeometry(options);
      case 'left':
        return this.computeLeftGeometry(options);
      case 'right':
        return this.computeRightGeometry(options);
      default:
        return this.computeAutoGeometry(options);
    }
  };

  computeTopGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
    const popoverOrigin = new Point(
      Math.min(displayArea.x + displayArea.width - contentSize.width,
        Math.max(displayArea.x, childRect.x + (childRect.width - contentSize.width) / 2)),
      childRect.y - contentSize.height - arrowSize.height);
    const anchorPoint = new Point(childRect.x + childRect.width / 2.0, childRect.y);

    return {
      popoverOrigin,
      anchorPoint,
      placement: 'top',
    };
  };

  computeBottomGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
    const popoverOrigin = new Point(
      Math.min(displayArea.x + displayArea.width - contentSize.width,
        Math.max(displayArea.x, childRect.x + (childRect.width - contentSize.width) / 2)),
      childRect.y + childRect.height + arrowSize.height);
    const anchorPoint = new Point(
      childRect.x + childRect.width / 2.0,
      childRect.y + childRect.height
    );

    return {
      popoverOrigin,
      anchorPoint,
      placement: 'bottom',
    };
  };

  computeLeftGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
    const popoverOrigin = new Point(childRect.x - contentSize.width - arrowSize.width,
      Math.min(displayArea.y + displayArea.height - contentSize.height,
        Math.max(displayArea.y, childRect.y + (childRect.height - contentSize.height) / 2)));
    const anchorPoint = new Point(childRect.x, childRect.y + childRect.height / 2.0);

    return {
      popoverOrigin,
      anchorPoint,
      placement: 'left',
    };
  };

  computeRightGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
    const popoverOrigin = new Point(childRect.x + childRect.width + arrowSize.width,
      Math.min(displayArea.y + displayArea.height - contentSize.height,
        Math.max(displayArea.y, childRect.y + (childRect.height - contentSize.height) / 2)));
    const anchorPoint = new Point(
      childRect.x + childRect.width,
      childRect.y + childRect.height / 2.0
    );

    return {
      popoverOrigin,
      anchorPoint,
      placement: 'right',
    };
  };

  computeAutoGeometry = ({ displayArea, contentSize }) => {
    const placementsToTry = ['left', 'right', 'bottom', 'top'];
    let geom;

    for (let i = 0; i < placementsToTry.length; i++) {
      const placement = placementsToTry[i];

      geom = this.computeGeometry({ contentSize, placement });
      const { popoverOrigin } = geom;

      if (popoverOrigin.x >= displayArea.x
        && popoverOrigin.x <= displayArea.x + displayArea.width - contentSize.width
        && popoverOrigin.y >= displayArea.y
        && popoverOrigin.y <= displayArea.y + displayArea.height - contentSize.height) {
        break;
      }
    }

    return geom;
  };

  _startAnimation = ({ show }) => {
    const handler = this._startDefaultAnimation;
    handler({ show, doneCallback: () => this.setState({ isTransitioning: false }) });
    this.setState({ isTransitioning: true });
  };

  _startDefaultAnimation = ({ show, doneCallback }) => {
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
    ]).start(doneCallback);
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
    const popover = [];
    const arrow = [];
    const content = [];

    const animatedStyles = this.props.animated ? this._getDefaultAnimatedStyles() : null;

    [animatedStyles, this.props].forEach(source => {
      if (source) {
        background.push(source.backgroundStyle);
        popover.push(source.popoverStyle);
        arrow.push(source.arrowStyle);
        content.push(source.contentStyle);
      }
    });

    return {
      background,
      popover,
      arrow,
      content,
    };
  };

  renderChildInTooltip = () => {
    const { height, width, x, y } = this.state.childRect;
    const { onElementPress, onElementLongPress } = this.props;
    const wrapInTouchable =
      typeof onElementPress === 'function' ||
      typeof onElementLongPress === 'function';

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
        {this.props.children}
      </View>
    );

    if (wrapInTouchable) {
      return (
        <TouchableWithoutFeedback onPress={onElementPress} onLongPress={onElementLongPress}>
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

    const { popoverOrigin, placement } = this.state;

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
        {/* This renders the tooltip fullscreen popover */}
        <Modal
          transparent
          visible={this.props.isVisible}
          onRequestClose={this.props.onClose}
        >
          <TouchableWithoutFeedback onPress={this.props.onClose}>
            <View style={[styles.container, contentSizeAvailable && styles.containerVisible]}>
              <Animated.View style={[styles.background, ...extendedStyles.background]} />
              <Animated.View
                style={[styles.popover, {
                  top: popoverOrigin.y,
                  left: popoverOrigin.x,
                }, ...extendedStyles.popover]}
              >
                <Animated.View style={arrowStyle} />
                <Animated.View
                  onLayout={this.measureContent}
                  style={contentStyle}
                >
                  {this.props.content}
                </Animated.View>
              </Animated.View>
              {this.renderChildInTooltip()}
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* This renders the child element where it is in the parent's layout */}
        <View
          ref={r => { this.childWrapper = r; }}
          onLayout={this.measureChildRect}
        >
          {this.props.children}
        </View>
      </View>
    );
  }
}

Tooltip.defaultProps = {
  animated: false,
  arrowSize: DEFAULT_ARROW_SIZE,
  content: () => { },
  displayArea: new Rect(24, 24, SCREEN_WIDTH - 48, SCREEN_HEIGHT - 48),
  isVisible: false,
  onClose: () => { },
  onElementLongPress: null,
  onElementPress: null,
  placement: 'auto',
};

Tooltip.propTypes = {
  animated: PropTypes.bool,
  arrowSize: PropTypes.object,
  content: PropTypes.element,
  displayArea: PropTypes.any,
  isVisible: PropTypes.bool,
  onElementLongPress: PropTypes.func,
  onElementPress: PropTypes.func,
  onClose: PropTypes.func,
  placement: PropTypes.string,
  children: PropTypes.element,
};

export default Tooltip;