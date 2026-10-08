import {
  Size,
  Rect,
  swapSizeDimmensions,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry,
  computeMainAxisSlack,
} from '../src/geom';

const sharedOptions = {
  displayInsets: { top: 24, bottom: 24, left: 24, right: 24 },
  windowDims: { width: 375, height: 667 },
  childContentSpacing: 4,
};

const options1 = {
  ...sharedOptions,
  childRect: new Rect(24, 350, 64, 64),
  contentSize: new Size(200, 100),
  arrowSize: new Size(16, 8),
};

const options2 = {
  ...sharedOptions,
  childRect: new Rect(240, 350, 64, 64),
  contentSize: new Size(150, 200),
  arrowSize: new Size(7, 18),
};

const options3 = {
  ...sharedOptions,
  childRect: new Rect(24, 35, 150, 200),
  contentSize: new Size(300, 500),
  arrowSize: new Size(16, 8),
};

// tooltip.js swaps arrow dimensions for left/right placements
const withSwappedArrow = options => ({
  ...options,
  arrowSize: swapSizeDimmensions(options.arrowSize),
});

describe('Testing Computing Geometry', () => {
  it('correctly calculates top geometry', () => {
    expect(computeTopGeometry(options1)).toMatchSnapshot();
    expect(computeTopGeometry(options2)).toMatchSnapshot();
    expect(computeTopGeometry(options3)).toMatchSnapshot();
  });

  it('correctly calculates bottom geometry', () => {
    expect(computeBottomGeometry(options1)).toMatchSnapshot();
    expect(computeBottomGeometry(options2)).toMatchSnapshot();
    expect(computeBottomGeometry(options3)).toMatchSnapshot();
  });

  it('correctly calculates left geometry', () => {
    expect(computeLeftGeometry(withSwappedArrow(options1))).toMatchSnapshot();
    expect(computeLeftGeometry(withSwappedArrow(options2))).toMatchSnapshot();
    expect(computeLeftGeometry(withSwappedArrow(options3))).toMatchSnapshot();
  });

  it('correctly calculates right geometry', () => {
    expect(computeRightGeometry(withSwappedArrow(options1))).toMatchSnapshot();
    expect(computeRightGeometry(withSwappedArrow(options2))).toMatchSnapshot();
    expect(computeRightGeometry(withSwappedArrow(options3))).toMatchSnapshot();
  });

  it('computes main axis slack for each placement', () => {
    expect(computeMainAxisSlack('top', options1)).toBe(214);
    expect(computeMainAxisSlack('bottom', options1)).toBe(117);
    expect(computeMainAxisSlack('left', withSwappedArrow(options1))).toBe(-212);
    expect(computeMainAxisSlack('right', withSwappedArrow(options1))).toBe(51);
    expect(computeMainAxisSlack('center', options1)).toBe(0);
  });

  it('reports which side has more room when content does not fit', () => {
    // child hugs the left edge: no room on the left, room on the right
    expect(
      computeMainAxisSlack('right', withSwappedArrow(options1)),
    ).toBeGreaterThan(computeMainAxisSlack('left', withSwappedArrow(options1)));

    // content too tall for either side: bottom is the less bad choice
    const top = computeMainAxisSlack('top', options3);
    const bottom = computeMainAxisSlack('bottom', options3);
    expect(top).toBe(-501);
    expect(bottom).toBe(-104);
  });
});
