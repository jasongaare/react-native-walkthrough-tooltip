import { StyleSheet } from 'react-native';
import styleGenerator from '../src/styles';
import {
  Size,
  Rect,
  swapSizeDimmensions,
  computeTopGeometry,
  computeBottomGeometry,
  computeLeftGeometry,
  computeRightGeometry,
} from '../src/geom';

const displayInsets = { top: 24, bottom: 24, left: 24, right: 24 };
const arrowSize = new Size(16, 8);

const geometryOptions = {
  displayInsets,
  windowDims: { width: 375, height: 667 },
  childRect: new Rect(140, 300, 64, 64),
  contentSize: new Size(200, 100),
  childContentSpacing: 4,
};

const ownProps = {
  backgroundColor: 'rgba(0,0,0,0.5)',
  disableShadow: false,
};

// mirrors Tooltip.renderContentForTooltip
const generateStyles = (geom, overrides = {}) =>
  styleGenerator({
    adjustedContentSize: geom.adjustedContentSize,
    anchorPoint: geom.anchorPoint,
    arrowSize,
    displayInsets,
    measurementsFinished: true,
    ownProps,
    placement: geom.placement,
    tooltipOrigin: geom.tooltipOrigin,
    topAdjustment: 0,
    ...overrides,
  });

const flattenAll = generated =>
  Object.keys(generated).reduce(
    (acc, key) => ({ ...acc, [key]: StyleSheet.flatten(generated[key]) }),
    {},
  );

describe('testing styling', () => {
  it('generates styles for top placement', () => {
    const geom = computeTopGeometry({ ...geometryOptions, arrowSize });
    expect(flattenAll(generateStyles(geom))).toMatchSnapshot();
  });

  it('generates styles for bottom placement', () => {
    const geom = computeBottomGeometry({ ...geometryOptions, arrowSize });
    expect(flattenAll(generateStyles(geom))).toMatchSnapshot();
  });

  it('generates styles for left placement', () => {
    const geom = computeLeftGeometry({
      ...geometryOptions,
      arrowSize: swapSizeDimmensions(arrowSize),
    });
    expect(flattenAll(generateStyles(geom))).toMatchSnapshot();
  });

  it('generates styles for right placement', () => {
    const geom = computeRightGeometry({
      ...geometryOptions,
      arrowSize: swapSizeDimmensions(arrowSize),
    });
    expect(flattenAll(generateStyles(geom))).toMatchSnapshot();
  });

  it('colors the arrow to match a custom content background', () => {
    const geom = computeTopGeometry({ ...geometryOptions, arrowSize });
    const { arrowStyle } = flattenAll(
      generateStyles(geom, {
        ownProps: { ...ownProps, contentStyle: { backgroundColor: 'red' } },
      }),
    );
    expect(arrowStyle.borderTopColor).toBe('red');
  });

  it('omits the shadow when disableShadow is set', () => {
    const geom = computeTopGeometry({ ...geometryOptions, arrowSize });
    const { tooltipStyle } = flattenAll(
      generateStyles(geom, { ownProps: { ...ownProps, disableShadow: true } }),
    );
    expect(tooltipStyle.shadowColor).toBeUndefined();
  });

  it('keeps the container hidden until measurements finish', () => {
    const geom = computeTopGeometry({ ...geometryOptions, arrowSize });
    const hidden = flattenAll(
      generateStyles(geom, { measurementsFinished: false }),
    );
    const visible = flattenAll(generateStyles(geom));
    expect(hidden.containerStyle.opacity).toBe(0);
    expect(visible.containerStyle.opacity).toBe(1);
  });

  // the container and background must fill the screen for the tooltip to
  // position itself and for taps outside the tooltip to be caught
  it('fills the screen with the container and background', () => {
    const geom = computeTopGeometry({ ...geometryOptions, arrowSize });
    const { backgroundStyle, containerStyle } = flattenAll(
      generateStyles(geom),
    );

    expect(containerStyle).toMatchObject(StyleSheet.absoluteFill);
    expect(backgroundStyle).toMatchObject(StyleSheet.absoluteFill);
  });
});
