import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Dimensions,
  InteractionManager,
  Modal,
  TouchableWithoutFeedback,
  View
} from "react-native";
import rfcIsEqual from "react-fast-compare";
import {
  Point,
  Size,
  Rect,
  swapSizeDimmensions,
  makeChildlessRect,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry
} from "./geom";
import styleGenerator from "./styles";

const DEFAULT_ARROW_SIZE = new Size(16, 8);

const invertPlacement = (placement) => {
  switch (placement) {
    case "top":
      return "bottom";
    case "bottom":
      return "top";
    case "right":
      return "left";
    case "left":
      return "right";
    default:
      return placement;
  }
};

class Tooltip extends Component {
  static defaultProps = {
    arrowSize: DEFAULT_ARROW_SIZE,
    backgroundColor: "rgba(0,0,0,0.5)",
    children: null,
    content: <View />,
    displayInsets: {
      top: 24,
      bottom: 24,
      left: 24,
      right: 24
    },
    isVisible: false,
    onChildLongPress: null,
    onChildPress: null,
    onClose: null,
    placement: "auto",
    useInteractionManager: false
  };

  static propTypes = {
    arrowSize: PropTypes.shape({
      height: PropTypes.number,
      width: PropTypes.number
    }),
    backgroundColor: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    displayInsets: PropTypes.shape({
      top: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number,
      right: PropTypes.number
    }),
    isVisible: PropTypes.bool,
    onChildLongPress: PropTypes.func,
    onChildPress: PropTypes.func,
    onClose: PropTypes.func,
    placement: PropTypes.oneOf(["top", "left", "bottom", "right", "auto"]),
    useInteractionManager: PropTypes.bool
  };

  constructor(props) {
    super(props);

    const { isVisible, useInteractionManager } = props;

    this.isMeasuringChild = false;

    this.childWrapper = React.createRef();
    this.state = {
      // no need to wait for interactions if not visible initially
      waitingForInteractions: isVisible && useInteractionManager,
      contentSize: new Size(0, 0),
      adjustedContentSize: new Size(0, 0),
      anchorPoint: new Point(0, 0),
      tooltipOrigin: new Point(0, 0),
      childRect: new Rect(0, 0, 0, 0),
      // if we have no children, and place the tooltip at the "top" we want it to
      // behave like placement "bottom", i.e. display below the top of the screen
      placement: !props.children
        ? invertPlacement(props.placement)
        : props.placement,
      readyToComputeGeom: false,
      waitingToComputeGeom: false,
      measurementsFinished: false,
      windowDims: Dimensions.get("window")
    };
  }

  componentDidMount() {
    if (this.state.waitingForInteractions) {
      this.measureChildRect();
    }

    Dimensions.addEventListener("change", this.updateWindowDims);
  }

  componentDidUpdate(prevProps) {
    const { content, isVisible, placement } = this.props;

    const contentChanged = !rfcIsEqual(prevProps.content, content);
    const placementChanged = prevProps.placement !== placement;
    const becameVisible = isVisible && !prevProps.isVisible;

    if (contentChanged || placementChanged || becameVisible) {
      setTimeout(() => {
        this.measureChildRect();
      });
    }
  }

  componentWillUnmount() {
    Dimensions.removeEventListener("change", this.updateWindowDims);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // set measurements finished flag to false when tooltip closes
    if (prevState.measurementsFinished && !nextProps.isVisible) {
      return {
        measurementsFinished: false
      };
    }

    return null;
  }

  updateWindowDims = (dims) => {
    this.setState(
      {
        windowDims: dims.window,
        contentSize: new Size(0, 0),
        adjustedContentSize: new Size(0, 0),
        anchorPoint: new Point(0, 0),
        tooltipOrigin: new Point(0, 0),
        childRect: new Rect(0, 0, 0, 0),
        readyToComputeGeom: false,
        waitingToComputeGeom: false,
        measurementsFinished: false
      },
      () => {
        setTimeout(() => {
          this.measureChildRect();
        });
      }
    );
  };

  doChildlessPlacement = () => {
    this.onMeasurementComplete(
      makeChildlessRect({
        displayInsets: this.props.displayInsets,
        placement: this.state.placement, // MUST use from state, not props
        windowDims: this.state.windowDims
      })
    );
  };

  measureContent = (e) => {
    const { width, height } = e.nativeEvent.layout;
    const contentSize = new Size(width, height);
    if (!this.state.readyToComputeGeom) {
      this.setState({
        waitingToComputeGeom: true,
        contentSize
      });
    } else {
      this._doComputeGeometry({ contentSize });
    }

    if (React.Children.count(this.props.children) === 0) {
      this.doChildlessPlacement();
    }
  };

  onMeasurementComplete = (rect) => {
    this.setState(
      {
        childRect: rect,
        readyToComputeGeom: true,
        waitingForInteractions: false
      },
      () => {
        this.isMeasuringChild = false;
        this._updateGeometry();
      }
    );
  };

  measureChildRect = () => {
    const doMeasurement = () => {
      if (!this.isMeasuringChild) {
        this.isMeasuringChild = true;

        if (
          this.childWrapper.current &&
          typeof this.childWrapper.current.measureInWindow === "function"
        ) {
          this.childWrapper.current.measureInWindow((x, y, width, height) => {
            const childRect = new Rect(x, y, width, height);
            this.onMeasurementComplete(childRect);
          });
        } else {
          this.doChildlessPlacement();
        }
      }
    };

    if (this.props.useInteractionManager) {
      InteractionManager.runAfterInteractions(() => {
        doMeasurement();
      });
    } else {
      doMeasurement();
    }
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
      measurementsFinished: true
    });
  };

  _updateGeometry = () => {
    const { contentSize } = this.state;
    const geom = this.computeGeometry({ contentSize });
    const { tooltipOrigin, anchorPoint, placement, adjustedContentSize } = geom;

    this.setState({
      tooltipOrigin,
      anchorPoint,
      placement,
      measurementsFinished: true,
      adjustedContentSize
    });
  };

  computeGeometry = ({ contentSize, placement }) => {
    const innerPlacement = placement || this.state.placement;
    const { arrowSize, displayInsets } = this.props;
    const { childRect, windowDims } = this.state;

    const topBottomPlacement =
      innerPlacement === "top" || innerPlacement === "bottom";

    const options = {
      displayInsets,
      childRect,
      windowDims,
      arrowSize: topBottomPlacement
        ? arrowSize
        : swapSizeDimmensions(arrowSize),
      contentSize
    };

    switch (innerPlacement) {
      case "top":
        return computeTopGeometry(options);
      case "bottom":
        return computeBottomGeometry(options);
      case "left":
        return computeLeftGeometry(options);
      case "right":
        return computeRightGeometry(options);
      default:
        return this.computeAutoGeometry(options);
    }
  };

  computeAutoGeometry = ({ contentSize }) => {
    // prefer top, so check that first. if none 'work', fall back to top
    const placementsToTry = ["top", "bottom", "left", "right", "top"];

    let geom;
    for (let i = 0; i < placementsToTry.length; i += 1) {
      const placement = placementsToTry[i];

      geom = this.computeGeometry({ contentSize, placement });
      const { tooltipOrigin, adjustedContentSize } = geom;

      // Auto is "Best fit" ?

      const adjustedRatio =
        adjustedContentSize.width / adjustedContentSize.height;
      const originalRatio = contentSize.width / adjustedContentSize.height;

      console.log(placementsToTry[i], { adjustedRatio, originalRatio });
    }

    return geom;
  };

  renderChildInTooltip = () => {
    const { height, width, x, y } = this.state.childRect;
    const { children, onChildPress, onChildLongPress } = this.props;
    const wrapInTouchable =
      typeof onChildPress === "function" ||
      typeof onChildLongPress === "function";

    const childElement = (
      <View
        pointerEvents={wrapInTouchable ? "box-only" : "auto"}
        style={{
          position: "absolute",
          height,
          width,
          top: y,
          left: x,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {children}
      </View>
    );

    if (wrapInTouchable) {
      return (
        <TouchableWithoutFeedback
          onPress={onChildPress}
          onLongPress={onChildLongPress}
        >
          {childElement}
        </TouchableWithoutFeedback>
      );
    }

    return childElement;
  };

  render() {
    const generatedStyles = styleGenerator({
      adjustedContentSize: this.state.adjustedContentSize,
      anchorPoint: this.state.anchorPoint,
      arrowSize: this.props.arrowSize,
      measurementsFinished: this.state.measurementsFinished,
      ownProps: { ...this.props },
      placement: this.state.placement,
      tooltipOrigin: this.state.tooltipOrigin
    });

    const hasChildren = React.Children.count(this.props.children) > 0;

    return (
      <React.Fragment>
        {/* This renders the fullscreen tooltip */}
        <Modal
          transparent
          visible={this.props.isVisible && !this.state.waitingForInteractions}
          onRequestClose={this.props.onClose}
          supportedOrientations={["portrait", "landscape"]}
        >
          <TouchableWithoutFeedback onPress={this.props.onClose}>
            <View style={generatedStyles.containerStyle}>
              <View style={generatedStyles.backgroundStyle} />
              <View style={generatedStyles.tooltipStyle}>
                {hasChildren ? (
                  <View style={generatedStyles.arrowStyle} />
                ) : null}
                <View
                  onLayout={this.measureContent}
                  style={generatedStyles.contentStyle}
                >
                  {this.props.content}
                </View>
              </View>
              {hasChildren ? this.renderChildInTooltip() : null}
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* This renders the child element in place in the parent's layout */}
        {hasChildren ? (
          <View ref={this.childWrapper} onLayout={this.measureChildRect}>
            {this.props.children}
          </View>
        ) : null}
      </React.Fragment>
    );
  }
}

export default Tooltip;
