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

const swapSizeDimmensions = size => new Size(size.height, size.width);

const nonNegativeContentHeight = (adjustedContentSize, contentSize) =>
  adjustedContentSize.height > 0
    ? adjustedContentSize.height
    : contentSize.height;

const nonNegativeContentWidth = (adjustedContentSize, contentSize) =>
  adjustedContentSize.width > 0 ? adjustedContentSize.width : contentSize.width;

const adjustedContentMeasured = (adjustedContentSize, contentSize) => {
  console.log({ adjustedContentSize, contentSize });

  // this content is bounded in width, but can grow in height
  const adjustedWidthFinished =
    adjustedContentSize.width > 0 &&
    adjustedContentSize.height === -1 &&
    adjustedContentSize.width === contentSize.width;

  // this content is bounded in height, but can grow in width
  const adjustedHeightFinished =
    adjustedContentSize.height > 0 &&
    adjustedContentSize.width === -1 &&
    adjustedContentSize.height === contentSize.height;

  // this content is either bounded in both dimensions,
  // or fits inside the displayInsets with adjustment
  const contentEqualsAdjusted =
    adjustedContentSize.height === contentSize.height &&
    adjustedContentSize.width === contentSize.width;

  // special centered case where neight dimension is bounded and the view
  // fits with center justification and alignment
  const unboundedCenteredFinished =
    adjustedContentSize.width === -1 && adjustedContentSize.height === -1;

  return (
    adjustedWidthFinished ||
    adjustedHeightFinished ||
    contentEqualsAdjusted ||
    unboundedCenteredFinished
  );
};

const makeChildlessRect = ({ displayInsets, windowDims, placement }) => {
  switch (placement) {
    case 'bottom':
      return new Rect(windowDims.width / 2, displayInsets.top, 1, 1);

    case 'right':
      return new Rect(displayInsets.left, windowDims.height / 2, 1, 1);

    case 'left':
      return new Rect(
        windowDims.width - displayInsets.right,
        windowDims.height / 2,
        1,
        1,
      );
    case 'top':
    default:
      return new Rect(
        windowDims.width / 2,
        windowDims.height - displayInsets.bottom,
        1,
        1,
      );
  }
};

const computeCenterGeometry = ({
  childRect,
  contentSize,
  displayInsets,
  windowDims,
}) => {
  const maxWidth =
    windowDims.width - (displayInsets.left + displayInsets.right);
  const maxHeight =
    windowDims.height - (displayInsets.top + displayInsets.bottom);

  const adjustedContentSize = new Size(
    contentSize.width >= maxWidth ? maxWidth : -1,
    contentSize.height >= maxHeight ? maxHeight : -1,
  );

  const tooltipOrigin = new Point(
    adjustedContentSize.width === -1
      ? (maxWidth - contentSize.width) / 2 + displayInsets.left
      : displayInsets.left,
    adjustedContentSize.height === -1
      ? (maxHeight - contentSize.height) / 2 + displayInsets.top
      : displayInsets.top,
  );

  const anchorPoint = new Point(
    childRect.x + childRect.width / 2.0,
    childRect.y,
  );

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'center',
    adjustedContentSize,
  };
};

const computeTopGeometry = ({
  childRect,
  contentSize,
  arrowSize,
  displayInsets,
  windowDims,
  childContentSpacing,
}) => {
  const maxWidth =
    windowDims.width - (displayInsets.left + displayInsets.right);

  const adjustedContentSize = new Size(
    Math.min(maxWidth, contentSize.width),
    contentSize.height,
  );

  const tooltipOrigin = new Point(
    contentSize.width >= maxWidth
      ? displayInsets.left
      : Math.max(
          displayInsets.left,
          childRect.x +
            (childRect.width -
              nonNegativeContentWidth(adjustedContentSize, contentSize)) /
              2,
        ),
    Math.max(
      displayInsets.top - childContentSpacing,
      childRect.y - contentSize.height - arrowSize.height - childContentSpacing,
    ),
  );

  const anchorPoint = new Point(
    childRect.x + childRect.width / 2.0,
    childRect.y - childContentSpacing,
  );

  // make sure arrow does not extend beyond displayInsets
  if (
    anchorPoint.x + arrowSize.width >
    windowDims.width - displayInsets.right
  ) {
    anchorPoint.x =
      windowDims.width -
      displayInsets.right -
      Math.abs(arrowSize.width - arrowSize.height) -
      8;
  } else if (anchorPoint.x - arrowSize.width < displayInsets.left) {
    anchorPoint.x =
      displayInsets.left + Math.abs(arrowSize.width - arrowSize.height) + 8;
  }

  const topPlacementBottomBound = anchorPoint.y - arrowSize.height;

  if (tooltipOrigin.y + contentSize.height > topPlacementBottomBound) {
    adjustedContentSize.height = topPlacementBottomBound - tooltipOrigin.y;
  }

  if (tooltipOrigin.x + contentSize.width > maxWidth) {
    tooltipOrigin.x =
      displayInsets.left +
      (maxWidth - nonNegativeContentWidth(adjustedContentSize, contentSize)) /
        2;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'top',
    adjustedContentSize,
  };
};

const computeBottomGeometry = ({
  childRect,
  contentSize,
  arrowSize,
  displayInsets,
  windowDims,
  childContentSpacing,
}) => {
  const maxWidth =
    windowDims.width - (displayInsets.left + displayInsets.right);

  const adjustedContentSize = new Size(
    Math.min(maxWidth, contentSize.width),
    contentSize.height,
  );

  const tooltipOrigin = new Point(
    contentSize.width >= maxWidth
      ? displayInsets.left
      : Math.max(
          displayInsets.left,
          childRect.x +
            (childRect.width -
              nonNegativeContentWidth(adjustedContentSize, contentSize)) /
              2,
        ),
    Math.min(
      windowDims.height - displayInsets.bottom + childContentSpacing,
      childRect.y + childRect.height + arrowSize.height + childContentSpacing,
    ),
  );
  const anchorPoint = new Point(
    childRect.x + childRect.width / 2.0,
    childRect.y + childRect.height + childContentSpacing,
  );

  // make sure arrow does not extend beyond displayInsets
  if (
    anchorPoint.x + arrowSize.width >
    windowDims.width - displayInsets.right
  ) {
    anchorPoint.x =
      windowDims.width -
      displayInsets.right -
      Math.abs(arrowSize.width - arrowSize.height) -
      8;
  } else if (anchorPoint.x - arrowSize.width < displayInsets.left) {
    anchorPoint.x =
      displayInsets.left + Math.abs(arrowSize.width - arrowSize.height) + 8;
  }

  if (
    tooltipOrigin.y + contentSize.height >
    windowDims.height - displayInsets.bottom
  ) {
    adjustedContentSize.height =
      windowDims.height - displayInsets.bottom - tooltipOrigin.y;
  }

  if (tooltipOrigin.x + contentSize.width > maxWidth) {
    tooltipOrigin.x =
      displayInsets.left +
      (maxWidth - nonNegativeContentWidth(adjustedContentSize, contentSize)) /
        2;
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'bottom',
    adjustedContentSize,
  };
};

const computeLeftGeometry = ({
  childRect,
  contentSize,
  arrowSize,
  displayInsets,
  windowDims,
  childContentSpacing,
}) => {
  const maxHeight =
    windowDims.height - (displayInsets.top + displayInsets.bottom);

  const adjustedContentSize = new Size(
    contentSize.width,
    contentSize.height >= maxHeight ? maxHeight : -1,
  );

  const tooltipOrigin = new Point(
    Math.max(
      displayInsets.left - childContentSpacing,
      childRect.x - contentSize.width - arrowSize.width - childContentSpacing,
    ),
    contentSize.height >= maxHeight
      ? displayInsets.top
      : Math.max(
          displayInsets.top,
          childRect.y + (childRect.height - contentSize.height) / 2,
        ),
  );

  const anchorPoint = new Point(
    childRect.x - childContentSpacing,
    childRect.y + childRect.height / 2.0,
  );

  // make sure arrow does not extend beyond displayInsets
  if (
    anchorPoint.y + arrowSize.width >
    windowDims.height - displayInsets.bottom
  ) {
    anchorPoint.y =
      windowDims.height -
      displayInsets.bottom -
      Math.abs(arrowSize.height - arrowSize.width) -
      8;
  } else if (anchorPoint.y - arrowSize.height < displayInsets.top) {
    anchorPoint.y =
      displayInsets.top + Math.abs(arrowSize.height - arrowSize.width) + 8;
  }

  const leftPlacementRightBound = anchorPoint.x - arrowSize.width;

  if (tooltipOrigin.x + contentSize.width > leftPlacementRightBound) {
    adjustedContentSize.width = leftPlacementRightBound - tooltipOrigin.x;
  }

  if (tooltipOrigin.y + contentSize.height > maxHeight) {
    tooltipOrigin.y =
      windowDims.height -
      displayInsets.bottom -
      nonNegativeContentHeight(adjustedContentSize, contentSize);
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'left',
    adjustedContentSize,
  };
};

const computeRightGeometry = ({
  childRect,
  contentSize,
  arrowSize,
  displayInsets,
  windowDims,
  childContentSpacing,
}) => {
  const maxHeight =
    windowDims.height - (displayInsets.top + displayInsets.bottom);

  const adjustedContentSize = new Size(
    contentSize.width,
    contentSize.height >= maxHeight ? maxHeight : -1,
  );

  const tooltipOrigin = new Point(
    Math.min(
      windowDims.width - displayInsets.right + childContentSpacing,
      childRect.x + childRect.width + arrowSize.width + childContentSpacing,
    ),
    contentSize.height >= maxHeight
      ? displayInsets.top
      : Math.max(
          displayInsets.top,
          childRect.y + (childRect.height - contentSize.height) / 2,
        ),
  );

  const anchorPoint = new Point(
    childRect.x + childRect.width + childContentSpacing,
    childRect.y + childRect.height / 2.0,
  );

  // make sure arrow does not extend beyond displayInsets
  if (
    anchorPoint.y + arrowSize.width >
    windowDims.height - displayInsets.bottom
  ) {
    anchorPoint.y =
      windowDims.height -
      displayInsets.bottom -
      Math.abs(arrowSize.height - arrowSize.width) -
      8;
  } else if (anchorPoint.y - arrowSize.height < displayInsets.top) {
    anchorPoint.y =
      displayInsets.top + Math.abs(arrowSize.height - arrowSize.width) + 8;
  }

  if (
    tooltipOrigin.x + contentSize.width >
    windowDims.width - displayInsets.right
  ) {
    adjustedContentSize.width =
      windowDims.width - displayInsets.right - tooltipOrigin.x;
  }

  if (tooltipOrigin.y + contentSize.height > maxHeight) {
    tooltipOrigin.y =
      windowDims.height -
      displayInsets.bottom -
      nonNegativeContentHeight(adjustedContentSize, contentSize);
  }

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'right',
    adjustedContentSize,
  };
};

export {
  Point,
  Size,
  Rect,
  swapSizeDimmensions,
  makeChildlessRect,
  adjustedContentMeasured,
  computeCenterGeometry,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry,
};
