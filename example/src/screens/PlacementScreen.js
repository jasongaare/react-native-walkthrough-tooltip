import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Tip from '../Tip';
import {
  Block,
  Bubble,
  Field,
  Plate,
  Readout,
  ScreenTitle,
  Segmented,
} from '../ui';
import { colors, hairline, space } from '../theme';

// Plates sit at the corners and edges on purpose. Those are the anchors whose
// bubbles have to be pushed back inside displayInsets instead of overflowing,
// which is where the geometry breaks first.
const COLUMNS = [1, 2, 3];
const ROWS = [1, 2, 3];

const PLACEMENTS = [
  { label: 'top', value: 'top' },
  { label: 'bottom', value: 'bottom' },
  { label: 'left', value: 'left' },
  { label: 'right', value: 'right' },
];

const INSETS = [
  { label: '0', value: 0 },
  { label: '24', value: 24 },
  { label: '64', value: 64 },
];

export default function PlacementScreen({ index }) {
  const [placement, setPlacement] = useState('top');
  const [inset, setInset] = useState(24);
  const [live, setLive] = useState(null);

  const displayInsets = {
    top: inset,
    bottom: inset,
    left: inset,
    right: inset,
  };

  return (
    <View style={styles.container}>
      <ScreenTitle
        title="placement"
        note="Nine anchors across the screen. Corner plates prove the bubble is pushed back inside the insets rather than running off the edge."
      />

      <Block>
        <Segmented
          label="placement"
          options={PLACEMENTS}
          value={placement}
          onChange={next => {
            setLive(null);
            setPlacement(next);
          }}
        />
        <Segmented
          label="displayInsets"
          options={INSETS}
          value={inset}
          onChange={next => {
            setLive(null);
            setInset(next);
          }}
        />
      </Block>

      <Field style={styles.grid}>
        {ROWS.map(row => (
          <View key={row} style={styles.row}>
            <View style={styles.baseline} />
            {COLUMNS.map(column => {
              const id = `${column},${row}`;
              return (
                <Tip
                  key={id}
                  isVisible={live === id}
                  placement={placement}
                  displayInsets={displayInsets}
                  onClose={() => setLive(null)}
                  content={
                    <Bubble
                      meta={`anchor ${id}`}
                      title={`Asked for ${placement}`}
                      body="If that side has no room, the bubble flips to the opposite one rather than covering the anchor."
                    />
                  }
                >
                  <Plate
                    label={id}
                    live={live === id}
                    onPress={() => setLive(id)}
                  />
                </Tip>
              );
            })}
          </View>
        ))}
      </Field>

      <Readout
        index={index}
        pairs={[
          ['placement', placement],
          ['insets', String(inset)],
          ['anchor', live ?? '—'],
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
  grid: {
    justifyContent: 'space-between',
  },
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: hairline,
    backgroundColor: colors.ruleFaint,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
