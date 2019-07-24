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
  const tooltipOrigin = new Point(
    Math.max(
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

  const adjustedContentSize = new Size(contentSize.width, contentSize.height);
  const topPlacementBottomBound = anchorPoint.y - arrowSize.height;

  if (
    tooltipOrigin.x + contentSize.width >
    windowDims.width - (displayInsets.left + displayInsets.right)
  ) {
    adjustedContentSize.width =
      windowDims.width - displayInsets.right - tooltipOrigin.x;
  }

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
  displayArea,
  childRect,
  contentSize,
  arrowSize
}) => {
  const tooltipOrigin = new Point(
    Math.min(
      displayArea.x + displayArea.width - contentSize.width,
      Math.max(
        displayArea.x,
        childRect.x + (childRect.width - contentSize.width) / 2
      )
    ),
    childRect.y + childRect.height + arrowSize.height
  );
  const anchorPoint = new Point(
    childRect.x + childRect.width / 2.0,
    childRect.y + childRect.height
  );

  // compute bound content size
  const boundTooltipOrigin = new Point(tooltipOrigin.x, tooltipOrigin.y);
  const boundContentSize = new Size(contentSize.width, contentSize.height);
  const bounds = getBoundsForDisplayArea(displayArea);

  if (tooltipOrigin.x < bounds.x.min) {
    boundTooltipOrigin.x = bounds.x.min;
  }

  if (boundTooltipOrigin.x + contentSize.width > bounds.x.max) {
    boundContentSize.width = bounds.x.max - boundTooltipOrigin.x;
  }

  if (boundTooltipOrigin.y + contentSize.height > bounds.y.max) {
    boundContentSize.height = bounds.y.max - boundTooltipOrigin.y;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: "bottom",
    boundContentSize,
    boundTooltipOrigin
  };
};

const computeLeftGeometry = ({
  displayArea,
  childRect,
  contentSize,
  arrowSize
}) => {
  const tooltipOrigin = new Point(
    childRect.x - contentSize.width - arrowSize.width,
    Math.min(
      displayArea.y + displayArea.height - contentSize.height,
      Math.max(
        displayArea.y,
        childRect.y + (childRect.height - contentSize.height) / 2
      )
    )
  );
  const anchorPoint = new Point(
    childRect.x,
    childRect.y + childRect.height / 2.0
  );

  // compute bound content size
  const boundTooltipOrigin = new Point(tooltipOrigin.x, tooltipOrigin.y);
  const boundContentSize = new Size(contentSize.width, contentSize.height);
  const bounds = getBoundsForDisplayArea(displayArea);

  const leftPlacementRightBound = anchorPoint.x - arrowSize.width;

  if (tooltipOrigin.x < bounds.x.min) {
    boundTooltipOrigin.x = bounds.x.min;
  }

  if (tooltipOrigin.y < bounds.y.min) {
    boundTooltipOrigin.y = bounds.y.min;
  }

  if (boundTooltipOrigin.x + contentSize.width > leftPlacementRightBound) {
    boundContentSize.width = leftPlacementRightBound - boundTooltipOrigin.x;
  }

  if (boundTooltipOrigin.y + contentSize.height > bounds.y.max) {
    boundContentSize.height = bounds.y.max - boundTooltipOrigin.y;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: "left",
    boundContentSize,
    boundTooltipOrigin
  };
};

const computeRightGeometry = ({
  displayArea,
  childRect,
  contentSize,
  arrowSize
}) => {
  const tooltipOrigin = new Point(
    childRect.x + childRect.width + arrowSize.width,
    Math.min(
      displayArea.y + displayArea.height - contentSize.height,
      Math.max(
        displayArea.y,
        childRect.y + (childRect.height - contentSize.height) / 2
      )
    )
  );
  const anchorPoint = new Point(
    childRect.x + childRect.width,
    childRect.y + childRect.height / 2.0
  );

  // compute bound content size
  const boundTooltipOrigin = new Point(tooltipOrigin.x, tooltipOrigin.y);
  const boundContentSize = new Size(contentSize.width, contentSize.height);
  const bounds = getBoundsForDisplayArea(displayArea);

  const rightPlacementLeftBound = anchorPoint.x + arrowSize.width;

  if (tooltipOrigin.x < rightPlacementLeftBound) {
    boundTooltipOrigin.x = rightPlacementLeftBound;
  }

  if (tooltipOrigin.y < bounds.y.min) {
    boundTooltipOrigin.y = bounds.y.min;
  }

  if (boundTooltipOrigin.x + contentSize.width > bounds.x.max) {
    boundContentSize.width = bounds.x.max - boundTooltipOrigin.x;
  }

  if (boundTooltipOrigin.y + contentSize.height > bounds.y.max) {
    boundContentSize.height = bounds.y.max - boundTooltipOrigin.y;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: "right",
    boundContentSize,
    boundTooltipOrigin
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
