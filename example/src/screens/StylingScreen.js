import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Tip from '../Tip';
import {
  Block,
  Bubble,
  BoolRow,
  Field,
  Plate,
  Readout,
  ScreenTitle,
  Segmented,
} from '../ui';
import { colors, radius, space } from '../theme';

const ARROWS = [
  { label: 'none', value: 'none' },
  { label: 'fine', value: 'fine' },
  { label: 'stock', value: 'stock' },
  { label: 'broad', value: 'broad' },
];

const ARROW_SIZES = {
  none: { width: 0, height: 0 },
  fine: { width: 10, height: 5 },
  stock: { width: 16, height: 8 },
  broad: { width: 30, height: 15 },
};

const SCRIMS = [
  { label: 'dim', value: colors.scrim },
  { label: 'solid', value: 'rgba(24, 35, 52, 0.94)' },
  { label: 'amber', value: 'rgba(246, 155, 9, 0.28)' },
  { label: 'clear', value: 'transparent' },
];

const SPACINGS = [
  { label: '0', value: 0 },
  { label: '4', value: 4 },
  { label: '24', value: 24 },
];

const FILLS = [
  { label: 'ink', value: 'ink' },
  { label: 'paper', value: 'paper' },
  { label: 'amber', value: 'amber' },
];

// The library tints the arrow from contentStyle.backgroundColor, so each fill
// only has to declare the surface and the type colours that sit on it.
const SURFACES = {
  ink: { fill: colors.ink, meta: colors.live, title: colors.paper, body: colors.rule },
  paper: { fill: colors.paper, meta: colors.liveInk, title: colors.ink, body: colors.inkMuted },
  amber: { fill: colors.live, meta: colors.ink, title: colors.ink, body: colors.liveInk },
};

export default function StylingScreen({ index }) {
  const [arrow, setArrow] = useState('stock');
  const [scrim, setScrim] = useState(colors.scrim);
  const [spacing, setSpacing] = useState(4);
  const [fill, setFill] = useState('ink');
  const [disableShadow, setDisableShadow] = useState(false);
  const [visible, setVisible] = useState(false);

  const arrowSize = ARROW_SIZES[arrow];
  const surface = SURFACES[fill];

  return (
    <View style={styles.container}>
      <ScreenTitle
        title="styling"
        note="Every style prop, driven live. Changing the content forces a remeasure."
      />

      <Block>
        <Segmented
          label="arrowSize"
          options={ARROWS}
          value={arrow}
          onChange={setArrow}
        />
        <Segmented
          label="backgroundColor"
          options={SCRIMS}
          value={scrim}
          onChange={setScrim}
        />
        <Segmented
          label="childContentSpacing"
          options={SPACINGS}
          value={spacing}
          onChange={setSpacing}
        />
        <Segmented
          label="contentStyle"
          options={FILLS}
          value={fill}
          onChange={setFill}
        />
        <BoolRow
          label="disableShadow"
          hint="Drops the elevation, and the iOS shadow warning with it."
          value={disableShadow}
          onChange={setDisableShadow}
        />
      </Block>

      <Field style={styles.stage}>
        <Tip
          isVisible={visible}
          placement="top"
          arrowSize={arrowSize}
          backgroundColor={scrim}
          childContentSpacing={spacing}
          disableShadow={disableShadow}
          contentStyle={{
            backgroundColor: surface.fill,
            borderRadius: radius,
            padding: 0,
          }}
          onClose={() => setVisible(false)}
          content={
            <Bubble
              width={246}
              meta={`contentStyle ${fill}`}
              title="Styled bubble"
              body="The arrow takes its colour from the content fill, so the two never come apart."
              metaColor={surface.meta}
              titleColor={surface.title}
              bodyColor={surface.body}
            />
          }
        >
          <Plate
            wide
            label={visible ? 'close' : 'measure'}
            sub={visible ? 'tap the backdrop' : 'show the tooltip'}
            live={visible}
            onPress={() => setVisible(true)}
          />
        </Tip>
      </Field>

      <Readout
        index={index}
        pairs={[
          ['arrow', `${arrowSize.width}x${arrowSize.height}`],
          ['spacing', String(spacing)],
          ['shadow', disableShadow ? 'off' : 'on'],
        ]}
      />
    </View>
  );
}

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
});
