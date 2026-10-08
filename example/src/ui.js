import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, hairline, radius, space, tracking, type } from './theme';
import { QUARTERS, TICKS, quarterRange } from './seed';

/**
 * The masthead: one tick per character of the seed, tall where that character
 * is a digit. The 16 ticks belonging to the open screen are amber, so the rule
 * doubles as a position indicator across the four screens.
 */
export const SeedRule = ({ activeIndex }) => {
  const [from, to] = quarterRange(activeIndex);
  return (
    <View style={styles.rule}>
      {TICKS.map((tall, index) => {
        const active = index >= from && index < to;
        return (
          <View key={index} style={styles.tickSlot}>
            <View
              style={[
                styles.tick,
                { height: tall ? 11 : 5 },
                active && styles.tickActive,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

/** Screen heading. Titles are prop names, so they stay lowercase. */
export const ScreenTitle = ({ title, note }) => (
  <View style={styles.titleBlock}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.note}>{note}</Text>
  </View>
);

/** Bordered control block; children are separated by drafted rules. */
export const Block = ({ children }) => {
  const cells = React.Children.toArray(children);
  return (
    <View style={styles.block}>
      {cells.map((cell, index) => (
        <View key={index}>
          {index > 0 && <View style={styles.blockDivider} />}
          <View style={styles.blockCell}>{cell}</View>
        </View>
      ))}
    </View>
  );
};

/** Flat segmented control. Selected cell fills with ink. */
export const Segmented = ({ label, options, value, onChange }) => (
  <View>
    <Text style={styles.propName}>{label}</Text>
    <View style={styles.cells}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.cell,
              index > 0 && styles.cellDivided,
              selected && styles.cellSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

/** Boolean prop, shown as the two literal values it can take. */
export const BoolRow = ({ label, hint, value, onChange }) => (
  <View style={styles.boolRow}>
    <View style={styles.boolCopy}>
      <Text style={styles.propName}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
    <View style={[styles.cells, styles.boolCells]}>
      {[false, true].map((option, index) => {
        const selected = option === value;
        return (
          <Pressable
            key={String(option)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              styles.cell,
              styles.boolCell,
              index > 0 && styles.cellDivided,
              selected && styles.cellSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
              {String(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

/**
 * A registration plate: the thing a tooltip points at. Amber fill is reserved
 * for the one plate currently being measured.
 */
export const Plate = ({ label, sub, live, onPress, style, wide }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: !!live }}
    onPress={onPress}
    style={({ pressed }) => [
      styles.plate,
      wide && styles.plateWide,
      live && styles.plateLive,
      pressed && styles.pressed,
      style,
    ]}
  >
    <Text style={[styles.plateLabel, live && styles.plateLabelLive]}>
      {label}
    </Text>
    {!!sub && (
      <Text style={[styles.plateSub, live && styles.plateSubLive]}>{sub}</Text>
    )}
  </Pressable>
);

/** The measured area, marked at its corners the way a drawing is trimmed. */
export const Field = ({ children, style }) => (
  <View style={[styles.field, style]}>
    <View style={[styles.crop, styles.cropTL]} />
    <View style={[styles.crop, styles.cropTR]} />
    <View style={[styles.crop, styles.cropBL]} />
    <View style={[styles.crop, styles.cropBR]} />
    {children}
  </View>
);

/**
 * Mono strip of the values currently in play, closed by the 16 seed characters
 * this screen owns — the same ones the masthead is lighting up.
 */
export const Readout = ({ pairs, index }) => (
  <View style={styles.readout}>
    {pairs.map(([key, value], position) => (
      <View key={key} style={styles.readoutItem}>
        {position > 0 && <View style={styles.readoutDivider} />}
        <Text style={styles.readoutKey}>{key}</Text>
        <Text style={styles.readoutValue}>{value}</Text>
      </View>
    ))}
    <View style={styles.readoutSpacer} />
    <Text style={styles.serial}>{QUARTERS[index]}</Text>
  </View>
);

/**
 * Tooltip content. Defaults to type that sits on ink; the colour overrides are
 * for the styling screen, where the fill changes under it.
 */
export const Bubble = ({
  meta,
  title,
  body,
  children,
  width,
  metaColor,
  titleColor,
  bodyColor,
}) => (
  <View style={[styles.bubble, !!width && { width }]}>
    {!!meta && (
      <Text style={[styles.bubbleMeta, !!metaColor && { color: metaColor }]}>
        {meta}
      </Text>
    )}
    {!!title && (
      <Text style={[styles.bubbleTitle, !!titleColor && { color: titleColor }]}>
        {title}
      </Text>
    )}
    {!!body && (
      <Text style={[styles.bubbleBody, !!bodyColor && { color: bodyColor }]}>
        {body}
      </Text>
    )}
    {children}
  </View>
);

export const BubbleButton = ({ label, onPress, quiet }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.bubbleButton,
      quiet && styles.bubbleButtonQuiet,
      pressed && styles.pressed,
    ]}
  >
    <Text style={[styles.bubbleButtonText, quiet && styles.bubbleButtonTextQuiet]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 11,
    paddingHorizontal: space.unit,
  },
  tickSlot: {
    flex: 1,
    alignItems: 'center',
  },
  tick: {
    width: 2,
    backgroundColor: colors.ruleFaint,
  },
  tickActive: {
    backgroundColor: colors.live,
  },

  titleBlock: {
    paddingHorizontal: space.unit,
    paddingTop: space.unit,
    paddingBottom: space.step,
  },
  title: {
    fontFamily: font.bold,
    fontSize: type.large,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  serial: {
    fontFamily: font.mono,
    fontSize: type.micro,
    letterSpacing: tracking,
    color: colors.rule,
  },
  readoutSpacer: {
    flex: 1,
  },
  note: {
    marginTop: space.hair,
    fontFamily: font.regular,
    fontSize: type.base,
    lineHeight: type.base * 1.45,
    color: colors.inkMuted,
    maxWidth: 420,
  },

  block: {
    marginHorizontal: space.unit,
    borderWidth: hairline,
    borderColor: colors.ink,
    borderRadius: radius,
    backgroundColor: colors.paper,
  },
  blockDivider: {
    height: hairline,
    backgroundColor: colors.ruleFaint,
  },
  blockCell: {
    paddingHorizontal: space.tight + space.hair,
    paddingVertical: space.tight + space.hair,
  },

  propName: {
    fontFamily: font.monoMedium,
    fontSize: type.micro,
    letterSpacing: tracking,
    color: colors.inkMuted,
  },
  hint: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: type.base,
    lineHeight: type.base * 1.35,
    color: colors.inkMuted,
  },

  cells: {
    flexDirection: 'row',
    marginTop: space.tight,
    borderWidth: hairline,
    borderColor: colors.ink,
    borderRadius: radius,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    paddingVertical: space.tight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  cellDivided: {
    borderLeftWidth: hairline,
    borderLeftColor: colors.ink,
  },
  cellSelected: {
    backgroundColor: colors.ink,
  },
  cellText: {
    fontFamily: font.mono,
    fontSize: type.base,
    color: colors.ink,
  },
  cellTextSelected: {
    fontFamily: font.monoMedium,
    color: colors.paper,
  },

  boolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boolCopy: {
    flex: 1,
    paddingRight: space.unit,
  },
  boolCells: {
    marginTop: 0,
    width: 108,
  },
  boolCell: {
    paddingVertical: space.tight - 1,
  },

  plate: {
    minWidth: 58,
    paddingHorizontal: space.tight,
    paddingVertical: space.tight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: hairline,
    borderColor: colors.ink,
    borderRadius: radius,
  },
  plateWide: {
    minWidth: 150,
  },
  plateLive: {
    backgroundColor: colors.live,
  },
  plateLabel: {
    fontFamily: font.monoMedium,
    fontSize: type.base,
    color: colors.ink,
  },
  plateLabelLive: {
    color: colors.ink,
  },
  plateSub: {
    marginTop: 1,
    fontFamily: font.mono,
    fontSize: type.micro,
    letterSpacing: tracking,
    color: colors.inkMuted,
  },
  plateSubLive: {
    color: colors.ink,
  },

  field: {
    flex: 1,
    marginHorizontal: space.unit,
    marginTop: space.unit,
    backgroundColor: colors.field,
    padding: space.unit,
  },
  crop: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderColor: colors.rule,
  },
  cropTL: { top: 0, left: 0, borderTopWidth: hairline, borderLeftWidth: hairline },
  cropTR: { top: 0, right: 0, borderTopWidth: hairline, borderRightWidth: hairline },
  cropBL: { bottom: 0, left: 0, borderBottomWidth: hairline, borderLeftWidth: hairline },
  cropBR: { bottom: 0, right: 0, borderBottomWidth: hairline, borderRightWidth: hairline },

  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.unit,
    marginTop: space.unit,
    borderTopWidth: hairline,
    borderTopColor: colors.ruleFaint,
    paddingTop: space.tight,
  },
  readoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readoutDivider: {
    width: hairline,
    height: type.base,
    marginHorizontal: space.tight + space.hair,
    backgroundColor: colors.ruleFaint,
  },
  readoutKey: {
    fontFamily: font.mono,
    fontSize: type.micro,
    letterSpacing: tracking,
    color: colors.inkMuted,
  },
  readoutValue: {
    marginLeft: 4,
    fontFamily: font.monoMedium,
    fontSize: type.micro,
    letterSpacing: tracking,
    color: colors.liveInk,
  },

  bubble: {
    padding: space.unit,
    maxWidth: 268,
  },
  bubbleMeta: {
    fontFamily: font.mono,
    fontSize: type.micro,
    letterSpacing: tracking,
    color: colors.live,
  },
  bubbleTitle: {
    marginTop: space.hair + 1,
    fontFamily: font.semibold,
    fontSize: type.mid,
    color: colors.paper,
    letterSpacing: -0.2,
  },
  bubbleBody: {
    marginTop: space.hair,
    fontFamily: font.regular,
    fontSize: type.base,
    lineHeight: type.base * 1.45,
    color: colors.rule,
  },
  bubbleButton: {
    paddingHorizontal: space.unit,
    paddingVertical: space.tight,
    backgroundColor: colors.live,
    borderRadius: radius,
  },
  bubbleButtonQuiet: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  bubbleButtonText: {
    fontFamily: font.monoMedium,
    fontSize: type.base,
    color: colors.ink,
  },
  bubbleButtonTextQuiet: {
    color: colors.rule,
  },

  pressed: {
    opacity: 0.62,
  },
});
