import {
  Size,
  Rect,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry,
} from '../src/geom';

const options1 = {
  displayArea: new Rect(0, 0, 375, 667),
  childRect: new Rect(24, 350, 64, 64),
  contentSize: new Size(200, 100),
  arrowSize: new Size(16, 8),
};

const options2 = {
  displayArea: new Rect(0, 0, 375, 667),
  childRect: new Rect(240, 350, 64, 64),
  contentSize: new Size(150, 200),
  arrowSize: new Size(7, 18),
};

const options3 = {
  displayArea: new Rect(0, 0, 375, 667),
  childRect: new Rect(24, 35, 150, 200),
  contentSize: new Size(300, 500),
  arrowSize: new Size(16, 8),
};

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
    expect(computeLeftGeometry(options1)).toMatchSnapshot();
    expect(computeLeftGeometry(options2)).toMatchSnapshot();
    expect(computeLeftGeometry(options3)).toMatchSnapshot();
  });

  it('correctly calculates right geometry', () => {
    expect(computeRightGeometry(options1)).toMatchSnapshot();
    expect(computeRightGeometry(options2)).toMatchSnapshot();
    expect(computeRightGeometry(options3)).toMatchSnapshot();
  });
});
