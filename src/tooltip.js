import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Dimensions,
  Easing,
  InteractionManager,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from "react-native";
import rfcIsEqual from "react-fast-compare";
import {
  Point,
  Size,
  Rect,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry
} from "./geom";
import styles from "./styles";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

const DEFAULT_ARROW_SIZE = new Size(16, 8);
const DEFAULT_PADDING = 24;
const DEFAULT_DISPLAY_AREA = new Rect(
  DEFAULT_PADDING,
  DEFAULT_PADDING,
  SCREEN_WIDTH - DEFAULT_PADDING * 2,
  SCREEN_HEIGHT - DEFAULT_PADDING * 2
);

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
    childlessPlacementPadding: DEFAULT_PADDING,
    children: null,
    content: <View />,
    displayArea: DEFAULT_DISPLAY_AREA,
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
    childlessPlacementPadding: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    displayArea: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      height: PropTypes.number,
      width: PropTypes.number
    }),
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

      if (becameVisible) {
        // TODO: Move setState out of didUpdate
        // We want to start the show animation only when contentSize is known
        // so that we can have some logic depending on the geometry
        // this.setState({ contentSize: new Size(0, 0) });
      }
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
    console.log("hihihi");
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

  getArrowSize = (placement) => {
    const size = this.props.arrowSize;
    switch (placement) {
      case "left":
      case "right":
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
      case "bottom":
        return "180deg";
      case "left":
        return "-90deg";
      case "right":
        return "90deg";
      default:
        return "0deg";
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

    if (placement === "bottom") {
      marginTop = arrowSize.height;
    } else if (placement === "right") {
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
      borderLeftWidth: width / 2
    };
  };

  getTooltipPlacementStyles = () => {
    const { height } = this.props.arrowSize;
    const { tooltipOrigin } = this.state;

    switch (this.state.placement) {
      case "bottom":
        return {
          paddingTop: height,
          top: tooltipOrigin.y - height,
          left: tooltipOrigin.x
        };
      case "top":
        return {
          paddingBottom: height,
          top: tooltipOrigin.y,
          left: tooltipOrigin.x
        };
      case "right":
        return {
          paddingLeft: height,
          top: tooltipOrigin.y,
          left: tooltipOrigin.x - height
        };
      case "left":
        return {
          paddingRight: height,
          top: tooltipOrigin.y,
          left: tooltipOrigin.x
        };
      default:
        return {};
    }
  };

  getTranslateOrigin = () => {
    const { contentSize, tooltipOrigin, anchorPoint } = this.state;
    const tooltipCenter = new Point(
      (tooltipOrigin.x + contentSize.width) / 2,
      (tooltipOrigin.y + contentSize.height) / 2
    );
    return new Point(
      anchorPoint.x - tooltipCenter.x,
      anchorPoint.y - tooltipCenter.y
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

    if (!this.props.children) {
      this.mockChildRect();
    }
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
            this.setState(
              {
                childRect: new Rect(x, y, width, height),
                readyToComputeGeom: true,
                waitingForInteractions: false,
                placement: this.props.placement
              },
              () => {
                this.isMeasuringChild = false;
                this._updateGeometry();
              }
            );
          });
        } else {
          this.mockChildRect();
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

  mockChildRect = () => {
    // mock the placement of a child to compute geom
    let rectForChildlessPlacement = { ...this.state.childRect };
    let placementPadding = DEFAULT_PADDING;

    const { childlessPlacementPadding, placement } = this.props;

    // handle percentages
    if (typeof childlessPlacementPadding === "string") {
      const isPercentage =
        childlessPlacementPadding.substring(
          childlessPlacementPadding.length - 1
        ) === "%";
      const paddingValue = parseFloat(childlessPlacementPadding, 10);
      const verticalPlacement = placement === "top" || placement === "bottom";

      if (isPercentage) {
        placementPadding =
          (paddingValue / 100.0) *
          (verticalPlacement ? SCREEN_HEIGHT : SCREEN_WIDTH);
      } else {
        placementPadding = paddingValue;
      }
    } else {
      placementPadding = childlessPlacementPadding;
    }

    if (Number.isNaN(placementPadding)) {
      throw new Error(
        "[Tooltip] Invalid value passed to childlessPlacementPadding"
      );
    }

    const CENTER_X = SCREEN_WIDTH / 2;
    const CENTER_Y = SCREEN_HEIGHT / 2;

    switch (placement) {
      case "bottom":
        rectForChildlessPlacement = new Rect(
          CENTER_X,
          SCREEN_HEIGHT - placementPadding,
          0,
          0
        );
        break;
      case "left":
        rectForChildlessPlacement = new Rect(placementPadding, CENTER_Y, 0, 0);
        break;
      case "right":
        rectForChildlessPlacement = new Rect(
          SCREEN_WIDTH - placementPadding,
          CENTER_Y,
          0,
          0
        );
        break;
      default:
      case "top":
        rectForChildlessPlacement = new Rect(CENTER_X, placementPadding, 0, 0);
        break;
    }

    this.setState(
      {
        childRect: rectForChildlessPlacement,
        readyToComputeGeom: true
      },
      () => {
        this.isMeasuringChild = false;
        this._updateGeometry();
      }
    );
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
    const { displayArea, displayInsets } = this.props;
    const { childRect, windowDims } = this.state;

    const options = {
      displayArea,
      displayInsets,
      childRect,
      windowDims,
      arrowSize: this.getArrowSize(innerPlacement),
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

  computeAutoGeometry = ({ displayArea, contentSize }) => {
    // prefer top, so check that first. if none 'work', fall back to top
    const placementsToTry = ["top", "bottom", "left", "right", "top"];

    let geom;
    for (let i = 0; i < placementsToTry.length; i += 1) {
      const placement = placementsToTry[i];

      geom = this.computeGeometry({ contentSize, placement });
      const { tooltipOrigin } = geom;

      if (
        tooltipOrigin.x >= displayArea.x &&
        tooltipOrigin.x <=
          displayArea.x + displayArea.width - contentSize.width &&
        tooltipOrigin.y >= displayArea.y &&
        tooltipOrigin.y <=
          displayArea.y + displayArea.height - contentSize.height
      ) {
        break;
      }
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
    const {
      measurementsFinished,
      placement,
      waitingForInteractions,
      contentSize,
      adjustedContentSize
    } = this.state;
    const {
      backgroundColor,
      children,
      content,
      isVisible,
      onClose
    } = this.props;

    const sizeAvailable = contentSize.width;
    const adjustedSizeAvailable = adjustedContentSize.width;

    const contentStyle = [
      styles.content,
      adjustedSizeAvailable ? { ...adjustedContentSize } : {},
      this.props.contentStyle
    ];
    const arrowColor = StyleSheet.flatten(contentStyle).backgroundColor;
    const arrowColorStyle = this.getArrowColorStyle(arrowColor);
    const arrowDynamicStyle = this.getArrowDynamicStyle();
    const tooltipPlacementStyles = this.getTooltipPlacementStyles();

    // Special case, force the arrow rotation even if it was overriden
    let arrowStyle = [
      styles.arrow,
      arrowDynamicStyle,
      arrowColorStyle,
      this.props.arrowStyle
    ];
    const arrowTransform = (
      StyleSheet.flatten(arrowStyle).transform || []
    ).slice(0);
    arrowTransform.unshift({ rotate: this.getArrowRotation(placement) });
    arrowStyle = [...arrowStyle, { transform: arrowTransform }];

    const noChildren = !children;

    return (
      <View>
        {/* This renders the fullscreen tooltip */}
        <Modal
          transparent
          visible={isVisible && !waitingForInteractions}
          onRequestClose={onClose}
          supportedOrientations={["portrait", "landscape"]}
        >
          <TouchableWithoutFeedback onPress={onClose}>
            <View
              style={[
                styles.container,
                sizeAvailable && measurementsFinished && styles.containerVisible
              ]}
            >
              <View
                style={[
                  styles.background,
                  this.props.backgroundStyle,
                  { backgroundColor }
                ]}
              />
              <View
                style={[
                  styles.tooltip,
                  tooltipPlacementStyles,
                  this.props.tooltipStyle
                ]}
              >
                {noChildren ? null : <View style={arrowStyle} />}
                <View onLayout={this.measureContent} style={contentStyle}>
                  {content}
                </View>
              </View>
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

export default Tooltip;
