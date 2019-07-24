class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Size {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
}

class Rect {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

const getBoundsForDisplayArea = (displayArea) => ({
  x: {
    min: displayArea.x,
    max: displayArea.x + displayArea.width
  },
  y: {
    min: displayArea.y,
    max: displayArea.y + displayArea.height
  }
});

const computeTopGeometry = ({
  childRect,
  contentSize,
  arrowSize,
  displayInsets,
  windowDims
}) => {
  const maxWidth =
    windowDims.width - (displayInsets.left + displayInsets.right);

  const adjustedContentSize = new Size(
    Math.min(maxWidth, contentSize.width),
    contentSize.height
  );

  const tooltipOrigin = new Point(
    contentSize.width >= maxWidth
      ? displayInsets.left
      : Math.max(
          displayInsets.left,
          childRect.x + (childRect.width - contentSize.width) / 2
        ),
    Math.max(
      displayInsets.top,
      childRect.y - contentSize.height - arrowSize.height
    )
  );
  const anchorPoint = new Point(
    childRect.x + childRect.width / 2.0,
    childRect.y
  );

  const topPlacementBottomBound = anchorPoint.y - arrowSize.height;

  if (tooltipOrigin.y + contentSize.height > topPlacementBottomBound) {
    adjustedContentSize.height = topPlacementBottomBound - tooltipOrigin.y;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: "top",
    adjustedContentSize
  };
};

const computeBottomGeometry = ({
  childRect,
  contentSize,
  arrowSize,
  displayInsets,
  windowDims
}) => {
  const maxWidth =
    windowDims.width - (displayInsets.left + displayInsets.right);

  const adjustedContentSize = new Size(
    Math.min(maxWidth, contentSize.width),
    contentSize.height
  );

  const tooltipOrigin = new Point(
    contentSize.width >= maxWidth
      ? displayInsets.left
      : Math.max(
          displayInsets.left,
          childRect.x + (childRect.width - contentSize.width) / 2
        ),
    Math.min(
      windowDims.height - displayInsets.bottom,
      childRect.y + childRect.height + arrowSize.height
    )
  );
  const anchorPoint = new Point(
    childRect.x + childRect.width / 2.0,
    childRect.y + childRect.height
  );

  if (
    tooltipOrigin.y + contentSize.height >
    windowDims.height - displayInsets.bottom
  ) {
    adjustedContentSize.height =
      windowDims.height - displayInsets.bottom - tooltipOrigin.y;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: "bottom",
    adjustedContentSize
  };
};

const computeLeftGeometry = ({
  childRect,
  contentSize,
  arrowSize,
  displayInsets,
  windowDims
}) => {
  const maxHeight =
    windowDims.height - (displayInsets.top + displayInsets.bottom);

  const adjustedContentSize = new Size(
    contentSize.width,
    Math.min(maxHeight, contentSize.height)
  );

  const tooltipOrigin = new Point(
    Math.max(
      displayInsets.left,
      childRect.x - contentSize.width - arrowSize.width
    ),
    contentSize.height >= maxHeight
      ? displayInsets.top
      : Math.max(
          displayInsets.top,
          childRect.y + (childRect.height - contentSize.height) / 2
        )
  );

  const anchorPoint = new Point(
    childRect.x,
    childRect.y + childRect.height / 2.0
  );

  const leftPlacementRightBound = anchorPoint.x - arrowSize.width;

  if (tooltipOrigin.x + contentSize.width > leftPlacementRightBound) {
    adjustedContentSize.width = leftPlacementRightBound - tooltipOrigin.x;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: "left",
    adjustedContentSize
  };
};

const computeRightGeometry = ({
  childRect,
  contentSize,
  arrowSize,
  displayInsets,
  windowDims
}) => {
  const maxHeight =
    windowDims.height - (displayInsets.top + displayInsets.bottom);

  const adjustedContentSize = new Size(
    contentSize.width,
    Math.min(maxHeight, contentSize.height)
  );

  const tooltipOrigin = new Point(
    Math.min(
      windowDims.width - displayInsets.right,
      childRect.x + childRect.width + arrowSize.width
    ),
    contentSize.height >= maxHeight
      ? displayInsets.top
      : Math.max(
          displayInsets.top,
          childRect.y + (childRect.height - contentSize.height) / 2
        )
  );

  const anchorPoint = new Point(
    childRect.x + childRect.width,
    childRect.y + childRect.height / 2.0
  );

  if (
    tooltipOrigin.x + contentSize.width >
    windowDims.width - displayInsets.right
  ) {
    adjustedContentSize.width =
      windowDims.width - displayInsets.right - tooltipOrigin.x;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: "right",
    adjustedContentSize
  };
};

export {
  Point,
  Size,
  Rect,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry
};
