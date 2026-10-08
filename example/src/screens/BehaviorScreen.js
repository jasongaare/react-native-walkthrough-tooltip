import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TooltipChildrenContext } from 'react-native-walkthrough-tooltip';
import Tip from '../Tip';
import {
  Block,
  BoolRow,
  Bubble,
  BubbleButton,
  Field,
  Plate,
  Readout,
  ScreenTitle,
} from '../ui';
import { space } from '../theme';

export default function BehaviorScreen({ index }) {
  const [allowChildInteraction, setAllowChildInteraction] = useState(true);
  const [closeOnChildInteraction, setCloseOnChildInteraction] = useState(true);
  const [closeOnBackgroundInteraction, setCloseOnBackgroundInteraction] =
    useState(true);
  const [showChildInTooltip, setShowChildInTooltip] = useState(true);
  const [useReactNativeModal, setUseReactNativeModal] = useState(true);

  const [counterVisible, setCounterVisible] = useState(false);
  const [taps, setTaps] = useState(0);
  const [childlessVisible, setChildlessVisible] = useState(false);
  const [contextVisible, setContextVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScreenTitle
        title="behavior"
        note="Interaction and dismissal. Tap the counter through the backdrop to prove touches still reach the child."
      />

      <Block>
        <BoolRow
          label="allowChildInteraction"
          hint="False makes the highlighted child untouchable."
          value={allowChildInteraction}
          onChange={setAllowChildInteraction}
        />
        <BoolRow
          label="closeOnChildInteraction"
          hint="False keeps the tooltip up after the child is tapped."
          value={closeOnChildInteraction}
          onChange={setCloseOnChildInteraction}
        />
        <BoolRow
          label="closeOnBackgroundInteraction"
          hint="False makes the backdrop ignore taps."
          value={closeOnBackgroundInteraction}
          onChange={setCloseOnBackgroundInteraction}
        />
        <BoolRow
          label="showChildInTooltip"
          hint="False hides the floating copy of the child."
          value={showChildInTooltip}
          onChange={setShowChildInTooltip}
        />
        <BoolRow
          label="useReactNativeModal"
          hint="False renders an absolute view instead of a Modal."
          value={useReactNativeModal}
          onChange={setUseReactNativeModal}
        />
      </Block>

      <Field style={styles.stage}>
        <Tip
          isVisible={counterVisible}
          placement="top"
          allowChildInteraction={allowChildInteraction}
          closeOnChildInteraction={closeOnChildInteraction}
          closeOnBackgroundInteraction={closeOnBackgroundInteraction}
          showChildInTooltip={showChildInTooltip}
          useReactNativeModal={useReactNativeModal}
          onClose={() => setCounterVisible(false)}
          content={
            <Bubble
              width={246}
              meta="live child"
              title="Touches pass through"
              body="The plate floating above the backdrop is the real child, so pressing it still moves the counter."
            >
              {!closeOnBackgroundInteraction && (
                <View style={styles.bubbleActions}>
                  <BubbleButton
                    label="Close"
                    onPress={() => setCounterVisible(false)}
                  />
                </View>
              )}
            </Bubble>
          }
        >
          <Plate
            wide
            label={String(taps).padStart(3, '0')}
            sub="taps counted"
            live={counterVisible}
            onPress={() => {
              setTaps(taps + 1);
              setCounterVisible(true);
            }}
          />
        </Tip>

        <View style={styles.extras}>
          {/* No children: the bubble centres itself inside displayInsets. */}
          <Tip
            isVisible={childlessVisible}
            placement="center"
            onClose={() => setChildlessVisible(false)}
            content={
              <Bubble
                width={240}
                meta="no children"
                title="Nothing to point at"
                body="With no child and placement center, the bubble sits in the middle of the insets and draws no arrow."
              />
            }
          />
          <Plate
            label="childless"
            live={childlessVisible}
            onPress={() => setChildlessVisible(true)}
            style={styles.extra}
          />

          {/* TooltipChildrenContext tells the floating copy apart from the
              original still sitting in the layout. */}
          <Tip
            isVisible={contextVisible}
            placement="top"
            onClose={() => setContextVisible(false)}
            content={
              <Bubble
                width={240}
                meta="TooltipChildrenContext"
                title="Copy, not original"
                body="The lifted plate reads tooltipDuplicate as true, so it can tell which of the two it is."
              />
            }
          >
            <ContextPlate onPress={() => setContextVisible(true)} />
          </Tip>
        </View>
      </Field>

      <Readout
        index={index}
        pairs={[
          ['taps', String(taps)],
          ['child', allowChildInteraction ? 'live' : 'inert'],
          ['modal', useReactNativeModal ? 'on' : 'off'],
        ]}
      />
    </View>
  );
}

const ContextPlate = ({ onPress }) => (
  <TooltipChildrenContext.Consumer>
    {({ tooltipDuplicate }) => (
      <Plate
        label={tooltipDuplicate ? 'duplicate' : 'context'}
        live={tooltipDuplicate}
        onPress={onPress}
        style={styles.extra}
      />
    )}
  </TooltipChildrenContext.Consumer>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: space.unit,
  },
  stage: {
    alignItems: 'center',
    // Centred rather than bottom-aligned: the bubble opens upward into the
    // space above, so the field reads as balanced in both states.
    justifyContent: 'center',
  },
  extras: {
    flexDirection: 'row',
    gap: space.tight,
    marginTop: space.unit,
  },
  extra: {
    minWidth: 110,
  },
  bubbleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: space.unit,
  },
});
