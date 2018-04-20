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

const computeTopGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
  const tooltipOrigin = new Point(
    Math.min(displayArea.x + displayArea.width - contentSize.width,
      Math.max(displayArea.x, childRect.x + (childRect.width - contentSize.width) / 2)),
    childRect.y - contentSize.height - arrowSize.height);
  const anchorPoint = new Point(childRect.x + childRect.width / 2.0, childRect.y);

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'top',
  };
};

const computeBottomGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
  const tooltipOrigin = new Point(
    Math.min(displayArea.x + displayArea.width - contentSize.width,
      Math.max(displayArea.x, childRect.x + (childRect.width - contentSize.width) / 2)),
    childRect.y + childRect.height + arrowSize.height);
  const anchorPoint = new Point(
    childRect.x + childRect.width / 2.0,
    childRect.y + childRect.height
  );

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'bottom',
  };
};

const computeLeftGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
  const tooltipOrigin = new Point(childRect.x - contentSize.width - arrowSize.width,
    Math.min(displayArea.y + displayArea.height - contentSize.height,
      Math.max(displayArea.y, childRect.y + (childRect.height - contentSize.height) / 2)));
  const anchorPoint = new Point(childRect.x, childRect.y + childRect.height / 2.0);

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'left',
  };
};

const computeRightGeometry = ({ displayArea, childRect, contentSize, arrowSize }) => {
  const tooltipOrigin = new Point(childRect.x + childRect.width + arrowSize.width,
    Math.min(displayArea.y + displayArea.height - contentSize.height,
      Math.max(displayArea.y, childRect.y + (childRect.height - contentSize.height) / 2)));
  const anchorPoint = new Point(
    childRect.x + childRect.width,
    childRect.y + childRect.height / 2.0
  );

  return {
    tooltipOrigin,
    anchorPoint,
    placement: 'right',
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
}
