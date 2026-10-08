import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shallow } from 'enzyme';
import Tooltip from '../src/tooltip';
import { Size, Rect } from '../src/geom';

const windowDims = { width: 375, height: 667 };

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

describe('Tooltip content changes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resizes to fit new content', () => {
    const wrapper = shallow(
      <Tooltip
        isVisible
        placement="top"
        content={<Text>short</Text>}
        onClose={() => {}}
      >
        <Text>child</Text>
      </Tooltip>,
    );
    const layout = (width, height) => ({
      nativeEvent: { layout: { width, height } },
    });
    // the view whose layout is reported as the content size
    const contentStyle = () => {
      const { measureContent } = wrapper.instance();
      const style = wrapper
        .update()
        .find(View)
        .filterWhere(node => node.prop('onLayout') === measureContent)
        .prop('style');
      return StyleSheet.flatten(style);
    };

    wrapper.setState({ windowDims });
    wrapper.instance().onChildMeasurementComplete(new Rect(140, 350, 64, 64));
    wrapper.instance().measureContent(layout(200, 50));
    expect(contentStyle()).toMatchObject({ width: 200, height: 50 });

    wrapper.setProps({ content: <Text>a much longer message</Text> });

    // the old size is dropped so the new content can be laid out and measured
    expect(contentStyle().height).toBeUndefined();
    expect(contentStyle().width).toBeUndefined();

    wrapper.instance().measureContent(layout(200, 120));
    expect(contentStyle()).toMatchObject({ width: 200, height: 120 });
  });

  it('keeps its size when re-rendered with the same content', () => {
    const wrapper = shallow(
      <Tooltip
        isVisible
        placement="top"
        content={<Text>same</Text>}
        onClose={() => {}}
      >
        <Text>child</Text>
      </Tooltip>,
    );
    wrapper.setProps({ content: <Text>same</Text> });
    expect(wrapper.state().measuringContent).toBe(false);
  });
});
