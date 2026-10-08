import { StyleSheet } from 'react-native';
import styleGenerator from '../src/styles';

const absoluteFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styleGeneratorProps = {
  adjustedContentSize: { width: 200, height: 100 },
  anchorPoint: { x: 56, y: 382 },
  arrowSize: { width: 16, height: 8 },
  displayInsets: { top: 24, bottom: 24, left: 24, right: 24 },
  measurementsFinished: true,
  ownProps: { backgroundColor: 'rgba(0,0,0,0.5)' },
  placement: 'top',
  tooltipOrigin: { x: 24, y: 274 },
  topAdjustment: 0,
};

describe('testing styling', () => {
  it('shows generated styles are as expected', () => {
    expect(styleGenerator(styleGeneratorProps)).toMatchSnapshot();
  });

  // the container and background must fill the screen for the tooltip to
  // position itself and for taps outside the tooltip to be caught
  it('fills the screen with the container and background', () => {
    const { backgroundStyle, containerStyle } = styleGenerator(
      styleGeneratorProps,
    );

    expect(StyleSheet.flatten(containerStyle)).toMatchObject(absoluteFill);
    expect(StyleSheet.flatten(backgroundStyle)).toMatchObject(absoluteFill);
  });
});
