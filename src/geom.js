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

const getBoundsForDisplayArea = displayArea => ({
  x: {
    min: displayArea.x,
    max: displayArea.x + displayArea.width,
  },
  y: {
    min: displayArea.y,
    max: displayArea.y + displayArea.height,
  },
});

const computerBoundContentSize = ({
  displayArea,
  tooltipOrigin,
  anchorPoint,
  arrowSize,
  contentSize,
}) => {
  const boundTooltipOrigin = new Point(tooltipOrigin.x, tooltipOrigin.y);
  const boundContentSize = new Size(contentSize.width, contentSize.height);
  const bounds = getBoundsForDisplayArea(displayArea);

  // adjust width to bounds
  if (tooltipOrigin.x < bounds.x.min) {
    boundContentSize.width = anchorPoint.x - arrowSize.width - bounds.x.min;
    boundTooltipOrigin.x = bounds.x.min;
  } else if (tooltipOrigin.x + contentSize.width > bounds.x.max) {
    boundContentSize.width = bounds.x.max - tooltipOrigin.x;
  }

  // adjust height to bounds
  if (tooltipOrigin.y < bounds.y.min) {
    boundContentSize.height = anchorPoint.y - arrowSize.height - bounds.y.min;
    boundTooltipOrigin.y = bounds.y.min;
  } else if (tooltipOrigin.y + contentSize.height > bounds.y.max) {
    boundContentSize.height = bounds.y.max - tooltipOrigin.y;
  }

  return {
    boundContentSize,
    boundTooltipOrigin,
  };
};

const computeTopGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
  const tooltipOrigin = new Point(
    Math.min(
      displayArea.x + displayArea.width - contentSize.width,
      Math.max(displayArea.x, childRect.x + (childRect.width - contentSize.width) / 2),
    ),
    childRect.y - contentSize.height - arrowSize.height,
  );
  const anchorPoint = new Point(childRect.x + childRect.width / 2.0, childRect.y);

  const { boundContentSize, boundTooltipOrigin } = computerBoundContentSize({
    displayArea,
    tooltipOrigin,
    anchorPoint,
    contentSize,
    arrowSize,
  });

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'top',
    boundContentSize,
    boundTooltipOrigin,
  };
};

const computeBottomGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
  const tooltipOrigin = new Point(
    Math.min(
      displayArea.x + displayArea.width - contentSize.width,
      Math.max(displayArea.x, childRect.x + (childRect.width - contentSize.width) / 2),
    ),
    childRect.y + childRect.height + arrowSize.height,
  );
  const anchorPoint = new Point(
    childRect.x + childRect.width / 2.0,
    childRect.y + childRect.height,
  );

  const { boundContentSize, boundTooltipOrigin } = computerBoundContentSize({
    displayArea,
    tooltipOrigin,
    anchorPoint,
    contentSize,
    arrowSize,
  });

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'bottom',
    boundContentSize,
    boundTooltipOrigin,
  };
};

const computeLeftGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
  const tooltipOrigin = new Point(
    childRect.x - contentSize.width - arrowSize.width,
    Math.min(
      displayArea.y + displayArea.height - contentSize.height,
      Math.max(displayArea.y, childRect.y + (childRect.height - contentSize.height) / 2),
    ),
  );
  const anchorPoint = new Point(childRect.x, childRect.y + childRect.height / 2.0);

  const { boundContentSize, boundTooltipOrigin } = computerBoundContentSize({
    displayArea,
    tooltipOrigin,
    anchorPoint,
    contentSize,
    arrowSize,
  });

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'left',
    boundContentSize,
    boundTooltipOrigin,
  };
};

const computeRightGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
  const tooltipOrigin = new Point(
    childRect.x + childRect.width + arrowSize.width,
    Math.min(
      displayArea.y + displayArea.height - contentSize.height,
      Math.max(displayArea.y, childRect.y + (childRect.height - contentSize.height) / 2),
    ),
  );
  const anchorPoint = new Point(
    childRect.x + childRect.width,
    childRect.y + childRect.height / 2.0,
  );

  const { boundContentSize, boundTooltipOrigin } = computerBoundContentSize({
    displayArea,
    tooltipOrigin,
    anchorPoint,
    contentSize,
    arrowSize,
  });

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'right',
    boundContentSize,
    boundTooltipOrigin,
  };
};

export {
  Point,
  Size,
  Rect,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry,
};
