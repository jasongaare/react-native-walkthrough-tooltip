import React from 'react';
import { Modal, Text } from 'react-native';
import { shallow } from 'enzyme';
import Tooltip from '../src/tooltip';
import { Size, Rect } from '../src/geom';

// Model React Native versions that no longer export InteractionManager.
jest.mock('react-native', () =>
  Object.defineProperty(
    Object.create(require.requireActual('react-native')),
    'InteractionManager',
    { value: undefined },
  ),
);

const windowDims = { width: 375, height: 667 };

describe('Tooltip deferred measurement', () => {
  let wrapper;
  let measure;

  beforeEach(() => {
    jest.useFakeTimers();
    wrapper = shallow(<Tooltip isVisible useInteractionManager />);
    measure = jest.fn();
    wrapper.instance().childWrapper.current = { measure };
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('defers measurement and reveals the tooltip when measurement completes', () => {
    wrapper.instance().measureChildRect();
    expect(measure).not.toHaveBeenCalled();
    expect(wrapper.find(Modal).prop('visible')).toBe(false);

    jest.runAllImmediates();
    expect(measure).toHaveBeenCalledTimes(1);
    measure.mock.calls[0][0](0, 0, 64, 32, 100, 200);
    expect(wrapper.state().childRect).toEqual(new Rect(100, 200, 64, 32));
    wrapper.update();
    expect(wrapper.find(Modal).prop('visible')).toBe(true);
  });

  it('only measures once when pending work is replaced', () => {
    measure.mockImplementation(callback => callback(0, 0, 64, 32, 100, 200));
    wrapper.instance().measureChildRect();
    wrapper.instance().measureChildRect();
    jest.runAllImmediates();
    expect(measure).toHaveBeenCalledTimes(1);
    expect(wrapper.state().childRect).toEqual(new Rect(100, 200, 64, 32));
  });

  it('cancels pending measurement on unmount', () => {
    wrapper.instance().measureChildRect();
    wrapper.unmount();
    wrapper = null;
    jest.runAllImmediates();
    expect(measure).not.toHaveBeenCalled();
  });

  it('measures synchronously when deferral is disabled', () => {
    wrapper.setProps({ useInteractionManager: false });
    wrapper.instance().measureChildRect();
    expect(measure).toHaveBeenCalledTimes(1);
  });
});

// Renders a tooltip, feeds it the measurements it would normally get from
// layout, and returns the state produced by computeGeometry.
const computeFor = ({ placement, childRect, contentSize, children }) => {
  const wrapper = shallow(
    <Tooltip
      isVisible={false}
      placement={placement}
      content={<Text>content</Text>}
      onClose={() => {}}
    >
      {children === undefined ? <Text>child</Text> : children}
    </Tooltip>,
  );
  wrapper.setState({ windowDims, childRect, contentSize });
  wrapper.instance().computeGeometry();
  return wrapper.state();
};

describe('Tooltip placement flipping', () => {
  it('keeps the requested side when the content fits', () => {
    const state = computeFor({
      placement: 'top',
      childRect: new Rect(140, 350, 64, 64),
      contentSize: new Size(200, 100),
    });
    expect(state.placement).toBe('top');
    expect(state.renderedPlacement).toBe('top');
  });

  it('flips top to bottom when there is no room above the child', () => {
    const state = computeFor({
      placement: 'top',
      childRect: new Rect(140, 40, 64, 64),
      contentSize: new Size(200, 100),
    });
    expect(state.placement).toBe('top');
    expect(state.renderedPlacement).toBe('bottom');
    expect(state.adjustedContentSize.height).toBe(100);
  });

  it('flips bottom to top when there is no room below the child', () => {
    const state = computeFor({
      placement: 'bottom',
      childRect: new Rect(140, 580, 64, 64),
      contentSize: new Size(200, 100),
    });
    expect(state.renderedPlacement).toBe('top');
  });

  it('flips left to right when the child hugs the left edge', () => {
    const state = computeFor({
      placement: 'left',
      childRect: new Rect(24, 350, 64, 64),
      contentSize: new Size(200, 100),
    });
    expect(state.renderedPlacement).toBe('right');
    expect(state.adjustedContentSize.width).toBeGreaterThan(0);
  });

  it('flips right to left when the child hugs the right edge', () => {
    const state = computeFor({
      placement: 'right',
      childRect: new Rect(287, 350, 64, 64),
      contentSize: new Size(200, 100),
    });
    expect(state.renderedPlacement).toBe('left');
  });

  it('picks the side that overflows less when neither fits', () => {
    const state = computeFor({
      placement: 'top',
      childRect: new Rect(24, 35, 150, 200),
      contentSize: new Size(300, 500),
    });
    expect(state.renderedPlacement).toBe('bottom');
  });

  it('stays put when the opposite side is even worse', () => {
    const state = computeFor({
      placement: 'bottom',
      childRect: new Rect(24, 35, 150, 200),
      contentSize: new Size(300, 500),
    });
    expect(state.renderedPlacement).toBe('bottom');
  });

  it('draws "center" with children on top, like "top"', () => {
    const state = computeFor({
      placement: 'center',
      childRect: new Rect(140, 350, 64, 64),
      contentSize: new Size(200, 100),
    });
    expect(state.placement).toBe('center');
    expect(state.renderedPlacement).toBe('top');
    // 350 - 100 content - 8 arrow - 4 spacing: arrow is not swapped
    expect(state.tooltipOrigin.y).toBe(238);
  });

  it('flips "center" with children to bottom when there is no room above', () => {
    const state = computeFor({
      placement: 'center',
      childRect: new Rect(140, 40, 64, 64),
      contentSize: new Size(200, 100),
    });
    expect(state.renderedPlacement).toBe('bottom');
    expect(state.adjustedContentSize.height).toBe(100);
  });

  it('does not flip childless tooltips', () => {
    const state = computeFor({
      placement: 'top',
      childRect: new Rect(187.5, 643, 1, 1),
      contentSize: new Size(200, 700),
      children: null,
    });
    // childless "top" is inverted to "bottom" and never flipped back
    expect(state.placement).toBe('bottom');
    expect(state.renderedPlacement).toBe('bottom');
  });

  it('resets the rendered side when the placement prop changes', () => {
    const wrapper = shallow(
      <Tooltip
        isVisible={false}
        placement="top"
        content={<Text>content</Text>}
        onClose={() => {}}
      >
        <Text>child</Text>
      </Tooltip>,
    );
    wrapper.setState({
      windowDims,
      childRect: new Rect(140, 40, 64, 64),
      contentSize: new Size(200, 100),
    });
    wrapper.instance().computeGeometry();
    expect(wrapper.state().renderedPlacement).toBe('bottom');

    wrapper.setProps({ placement: 'left' });
    expect(wrapper.state().placement).toBe('left');
    expect(wrapper.state().renderedPlacement).toBe('left');
  });
});
