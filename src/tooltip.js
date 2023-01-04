import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Dimensions,
  InteractionManager,
  Modal,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import rfcIsEqual from 'react-fast-compare';
import {
  Point,
  Size,
  Rect,
  swapSizeDimmensions,
  makeChildlessRect,
  computeCenterGeometry,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry,
} from './geom';
import styleGenerator from './styles';
import TooltipChildrenContext from './tooltip-children.context';

export { TooltipChildrenContext };

const DEFAULT_DISPLAY_INSETS = {
  top: 24,
  bottom: 24,
  left: 24,
  right: 24,
};

const computeDisplayInsets = insetsFromProps =>
  Object.assign({}, DEFAULT_DISPLAY_INSETS, insetsFromProps);

const invertPlacement = placement => {
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
    allowChildInteraction: true,
    arrowSize: new Size(16, 8),
    backgroundColor: 'rgba(0,0,0,0.5)',
    childContentSpacing: 4,
    children: null,
    closeOnChildInteraction: true,
    closeOnContentInteraction: true,
    closeOnBackgroundInteraction: true,
    content: <View />,
    displayInsets: {},
    disableShadow: false,
    isVisible: false,
    onClose: () => {
      console.warn(
        '[react-native-walkthrough-tooltip] onClose prop not provided',
      );
    },
    placement: 'center', // falls back to "top" if there ARE children
    showChildInTooltip: true,
    supportedOrientations: ['portrait', 'landscape'],
    useInteractionManager: false,
    useReactNativeModal: true,
    topAdjustment: 0,
    horizontalAdjustment: 0,
    accessible: true,
  };

  static propTypes = {
    allowChildInteraction: PropTypes.bool,
    arrowSize: PropTypes.shape({
      height: PropTypes.number,
      width: PropTypes.number,
    }),
    backgroundColor: PropTypes.string,
    childContentSpacing: PropTypes.number,
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    closeOnChildInteraction: PropTypes.bool,
    closeOnContentInteraction: PropTypes.bool,
    closeOnBackgroundInteraction: PropTypes.bool,
    content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    displayInsets: PropTypes.shape({
      top: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number,
      right: PropTypes.number,
    }),
    disableShadow: PropTypes.bool,
    isVisible: PropTypes.bool,
    onClose: PropTypes.func,
    placement: PropTypes.oneOf(['top', 'left', 'bottom', 'right', 'center']),
    showChildInTooltip: PropTypes.bool,
    supportedOrientations: PropTypes.arrayOf(PropTypes.string),
    useInteractionManager: PropTypes.bool,
    useReactNativeModal: PropTypes.bool,
    topAdjustment: PropTypes.number,
    horizontalAdjustment: PropTypes.number,
    accessible: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    const { isVisible, useInteractionManager } = props;

    this.isMeasuringChild = false;
    this.interactionPromise = null;
    this.dimensionsSubscription = null;

    this.childWrapper = React.createRef();
    this.state = {
      // no need to wait for interactions if not visible initially
      waitingForInteractions: isVisible && useInteractionManager,
      contentSize: new Size(0, 0),
      adjustedContentSize: new Size(0, 0),
      anchorPoint: new Point(0, 0),
      tooltipOrigin: new Point(0, 0),
      childRect: new Rect(0, 0, 0, 0),
      displayInsets: computeDisplayInsets(props.displayInsets),
      // if we have no children, and place the tooltip at the "top" we want it to
      // behave like placement "bottom", i.e. display below the top of the screen
      placement:
        React.Children.count(props.children) === 0
          ? invertPlacement(props.placement)
          : props.placement,
      measurementsFinished: false,
      windowDims: Dimensions.get('window'),
    };
  }

  componentDidMount() {
    this.dimensionsSubscription = Dimensions.addEventListener(
      'change',
      this.updateWindowDims,
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const { content, isVisible, placement } = this.props;
    const { displayInsets } = this.state;

    const contentChanged = !rfcIsEqual(prevProps.content, content);
    const placementChanged = prevProps.placement !== placement;
    const becameVisible = isVisible && !prevProps.isVisible;
    const insetsChanged = !rfcIsEqual(prevState.displayInsets, displayInsets);

    if (contentChanged || placementChanged || becameVisible || insetsChanged) {
      setTimeout(() => {
        this.measureChildRect();
      });
    }
  }

  componentWillUnmount() {
    // removeEventListener deprecated
    // https://reactnative.dev/docs/dimensions#removeeventlistener
    if (this.dimensionsSubscription?.remove) {
      // react native >= 0.65.*
      this.dimensionsSubscription.remove();
    } else {
      // react native < 0.65.*
      Dimensions.removeEventListener('change', this.updateWindowDims);
    }

    if (this.interactionPromise) {
      this.interactionPromise.cancel();
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextState = {};

    // update placement in state if the prop changed
    const nextPlacement =
      React.Children.count(nextProps.children) === 0
        ? invertPlacement(nextProps.placement)
        : nextProps.placement;

    if (nextPlacement !== prevState.placement) {
      nextState.placement = nextPlacement;
    }

    // update computed display insets if they changed
    const nextDisplayInsets = computeDisplayInsets(nextProps.displayInsets);
    if (!rfcIsEqual(nextDisplayInsets, prevState.displayInsets)) {
      nextState.displayInsets = nextDisplayInsets;
    }

    // set measurements finished flag to false when tooltip closes
    if (prevState.measurementsFinished && !nextProps.isVisible) {
      nextState.measurementsFinished = false;
      nextState.adjustedContentSize = new Size(0, 0);
    }

    if (Object.keys(nextState).length) {
      return nextState;
    }

    return null;
  }

  updateWindowDims = dims => {
    this.setState(
      {
        windowDims: dims.window,
        contentSize: new Size(0, 0),
        adjustedContentSize: new Size(0, 0),
        anchorPoint: new Point(0, 0),
        tooltipOrigin: new Point(0, 0),
        childRect: new Rect(0, 0, 0, 0),
        measurementsFinished: false,
      },
      () => {
        setTimeout(() => {
          this.measureChildRect();
        }, 500); // give the rotation a moment to finish
      },
    );
  };

  doChildlessPlacement = () => {
    this.onChildMeasurementComplete(
      makeChildlessRect({
        displayInsets: this.state.displayInsets,
        placement: this.state.placement, // MUST use from state, not props
        windowDims: this.state.windowDims,
      }),
    );
  };

  measureContent = e => {
    const { width, height } = e.nativeEvent.layout;
    const contentSize = new Size(width, height);
    this.setState({ contentSize }, () => {
      this.computeGeometry();
    });
  };

  onChildMeasurementComplete = rect => {
    this.setState(
      {
        childRect: rect,
        waitingForInteractions: false,
      },
      () => {
        this.isMeasuringChild = false;
        if (this.state.contentSize.width) {
          this.computeGeometry();
        }
      },
    );
  };

  measureChildRect = () => {
    const doMeasurement = () => {
      if (!this.isMeasuringChild) {
        this.isMeasuringChild = true;
        if (
          this.childWrapper.current &&
          typeof this.childWrapper.current.measure === 'function'
        ) {
          this.childWrapper.current.measure(
            (x, y, width, height, pageX, pageY) => {
              const childRect = new Rect(pageX, pageY, width, height);
              if (
                Object.values(childRect).every(value => value !== undefined)
              ) {
                this.onChildMeasurementComplete(childRect);
              } else {
                this.doChildlessPlacement();
              }
            },
          );
        } else {
          this.doChildlessPlacement();
        }
      }
    };

    if (this.props.useInteractionManager) {
      if (this.interactionPromise) {
        this.interactionPromise.cancel();
      }
      this.interactionPromise = InteractionManager.runAfterInteractions(() => {
        doMeasurement();
      });
    } else {
      doMeasurement();
    }
  };

  computeGeometry = () => {
    const { arrowSize, childContentSpacing } = this.props;
    const {
      childRect,
      contentSize,
      displayInsets,
      placement,
      windowDims,
    } = this.state;

    const options = {
      displayInsets,
      childRect,
      windowDims,
      arrowSize:
        placement === 'top' || placement === 'bottom'
          ? arrowSize
          : swapSizeDimmensions(arrowSize),
      contentSize,
      childContentSpacing,
    };

    let geom = computeTopGeometry(options);

    // special case for centered, childless placement tooltip
    if (
      placement === 'center' &&
      React.Children.count(this.props.children) === 0
    ) {
      geom = computeCenterGeometry(options);
    } else {
      switch (placement) {
        case 'bottom':
          geom = computeBottomGeometry(options);
          break;
        case 'left':
          geom = computeLeftGeometry(options);
          break;
        case 'right':
          geom = computeRightGeometry(options);
          break;
        case 'top':
        default:
          break; // computed just above if-else-block
      }
    }

    const { tooltipOrigin, anchorPoint, adjustedContentSize } = geom;

    this.setState({
      tooltipOrigin,
      anchorPoint,
      placement,
      measurementsFinished: childRect.width && contentSize.width,
      adjustedContentSize,
    });
  };

  renderChildInTooltip = () => {
    let { height, width, x, y } = this.state.childRect;

    if (this.props.horizontalAdjustment) {
      x = x + this.props.horizontalAdjustment;
    }

    const onTouchEnd = () => {
      if (this.props.closeOnChildInteraction) {
        this.props.onClose();
      }
    };

    return (
      <TooltipChildrenContext.Provider value={{ tooltipDuplicate: true }}>
        <View
          onTouchEnd={onTouchEnd}
          pointerEvents={this.props.allowChildInteraction ? 'box-none' : 'none'}
          style={[
            {
              position: 'absolute',
              height,
              width,
              top: y,
              left: x,
              alignItems: 'center',
              justifyContent: 'center',
            },
            this.props.childrenWrapperStyle,
          ]}
        >
          {this.props.children}
        </View>
      </TooltipChildrenContext.Provider>
    );
  };

  renderContentForTooltip = () => {
    const generatedStyles = styleGenerator({
      adjustedContentSize: this.state.adjustedContentSize,
      anchorPoint: this.state.anchorPoint,
      arrowSize: this.props.arrowSize,
      displayInsets: this.state.displayInsets,
      measurementsFinished: this.state.measurementsFinished,
      ownProps: { ...this.props },
      placement: this.state.placement,
      tooltipOrigin: this.state.tooltipOrigin,
      topAdjustment: this.props.topAdjustment,
    });

    const hasChildren = React.Children.count(this.props.children) > 0;

    const onPressBackground = () => {
      if (this.props.closeOnBackgroundInteraction) {
        this.props.onClose();
      }
    };

    const onPressContent = () => {
      if (this.props.closeOnContentInteraction) {
        this.props.onClose();
      }
    };

    return (
      <TouchableWithoutFeedback
        onPress={onPressBackground}
        accessible={this.props.accessible}
      >
        <View style={generatedStyles.containerStyle}>
          <View style={[generatedStyles.backgroundStyle]}>
            <View style={generatedStyles.tooltipStyle}>
              {hasChildren ? <View style={generatedStyles.arrowStyle} /> : null}
              <View
                onLayout={this.measureContent}
                style={generatedStyles.contentStyle}
              >
                <TouchableWithoutFeedback
                  onPress={onPressContent}
                  accessible={this.props.accessible}
                >
                  {this.props.content}
                </TouchableWithoutFeedback>
              </View>
            </View>
          </View>
          {hasChildren && this.props.showChildInTooltip
            ? this.renderChildInTooltip()
            : null}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  render() {
    const {
      children,
      isVisible,
      useReactNativeModal,
      modalComponent,
    } = this.props;

    const hasChildren = React.Children.count(children) > 0;
    const showTooltip = isVisible && !this.state.waitingForInteractions;
    const ModalComponent = modalComponent || Modal;

    return (
      <React.Fragment>
        {useReactNativeModal ? (
          <ModalComponent
            transparent
            visible={showTooltip}
            onRequestClose={this.props.onClose}
            supportedOrientations={this.props.supportedOrientations}
          >
            {this.renderContentForTooltip()}
          </ModalComponent>
        ) : null}

        {/* This renders the child element in place in the parent's layout */}
        {hasChildren ? (
          <View
            ref={this.childWrapper}
            onLayout={this.measureChildRect}
            style={this.props.parentWrapperStyle}
          >
            {children}
          </View>
        ) : null}

        {!useReactNativeModal && showTooltip
          ? this.renderContentForTooltip()
          : null}
      </React.Fragment>
    );
  }
}

export default Tooltip;
