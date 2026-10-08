import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Tip from '../Tip';
import {
  Bubble,
  BubbleButton,
  Plate,
  Readout,
  ScreenTitle,
} from '../ui';
import { colors, font, hairline, radius, space, tracking, type } from '../theme';

// A tour across one screen — the reason the library exists. Each step names
// the element it points at, so only one Tooltip is ever visible.
const STEPS = [
  {
    key: 'avatar',
    title: 'This is you',
    body: 'Your avatar opens account settings from anywhere in the app.',
    placement: 'bottom',
  },
  {
    key: 'streak',
    title: 'Keep the streak',
    body: 'Check in once a day and this number keeps climbing.',
    placement: 'bottom',
  },
  {
    key: 'share',
    title: 'Invite a friend',
    body: 'Sharing your profile gives both of you a week of Pro.',
    placement: 'top',
  },
  {
    key: 'compose',
    title: 'Start here',
    body: 'That is the tour. Write your first entry whenever you are ready.',
    placement: 'top',
  },
];

export default function WalkthroughScreen({ index }) {
  // -1 means the tour is not running.
  const [stepIndex, setStepIndex] = useState(-1);
  const step = STEPS[stepIndex];
  const running = stepIndex > -1;

  const stepProps = key => ({
    isVisible: !!step && step.key === key,
    placement: step && step.key === key ? step.placement : 'top',
    // The bubble carries its own navigation, so a tap inside it must not
    // dismiss the tour.
    closeOnContentInteraction: false,
    onClose: () => setStepIndex(-1),
    content: step ? (
      <Bubble
        width={244}
        meta={`step ${stepIndex + 1} of ${STEPS.length}`}
        title={step.title}
        body={step.body}
      >
        <View style={styles.bubbleActions}>
          <BubbleButton
            quiet
            label={stepIndex === 0 ? 'Skip' : 'Back'}
            onPress={() => setStepIndex(stepIndex === 0 ? -1 : stepIndex - 1)}
          />
          <BubbleButton
            label={stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
            onPress={() =>
              setStepIndex(stepIndex === STEPS.length - 1 ? -1 : stepIndex + 1)
            }
          />
        </View>
      </Bubble>
    ) : (
      <View />
    ),
  });

  return (
    <View style={styles.container}>
      <ScreenTitle
        title="walkthrough"
        note="Four steps across one mock screen, navigated from inside the bubble."
      />

      <View style={styles.mock}>
        <View style={styles.profileRow}>
          <Tip {...stepProps('avatar')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JG</Text>
            </View>
          </Tip>

          <View style={styles.profileCopy}>
            <Text style={styles.profileName}>Jason Gaare</Text>
            <Text style={styles.profileHandle}>@jasongaare</Text>
          </View>

          <Tip {...stepProps('share')}>
            <Pressable style={styles.share}>
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
          </Tip>
        </View>

        <View style={styles.statsRow}>
          <Stat label="entries" value="128" />
          {/* parentWrapperStyle forwards flex to the View the library wraps the
              in-place child in, so the middle stat keeps its real width. */}
          <Tip {...stepProps('streak')} parentWrapperStyle={styles.flex}>
            <Stat label="streak" value="14" />
          </Tip>
          <Stat label="followers" value="2.1k" />
        </View>

        <View style={styles.feed}>
          {['Morning pages', 'Design review notes', 'Weekend plans'].map(
            title => (
              <View key={title} style={styles.feedItem}>
                <Text style={styles.feedTitle}>{title}</Text>
              </View>
            ),
          )}
        </View>

        <View style={styles.footer}>
          <Tip {...stepProps('compose')}>
            <Pressable style={styles.compose}>
              <Text style={styles.composeText}>New entry</Text>
            </Pressable>
          </Tip>
        </View>
      </View>

      <View style={styles.startRow}>
        <Plate
          wide
          label={running ? 'Stop tour' : 'Start tour'}
          live={running}
          onPress={() => setStepIndex(running ? -1 : 0)}
          style={styles.start}
        />
      </View>

      <Readout
        index={index}
        pairs={[
          ['step', running ? `${stepIndex + 1}/${STEPS.length}` : '—'],
          ['anchor', running ? step.key : '—'],
          ['placement', running ? step.placement : '—'],
        ]}
      />
    </View>
  );
}

const Stat = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: space.unit,
  },
  flex: {
    flex: 1,
  },
  mock: {
    flex: 1,
    marginHorizontal: space.unit,
    backgroundColor: colors.field,
    padding: space.step,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    backgroundColor: colors.ink,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.monoMedium,
    fontSize: type.base,
    color: colors.paper,
  },
  profileCopy: {
    flex: 1,
    paddingHorizontal: space.unit,
  },
  profileName: {
    fontFamily: font.semibold,
    fontSize: type.mid,
    color: colors.ink,
  },
  profileHandle: {
    fontFamily: font.mono,
    fontSize: type.micro,
    letterSpacing: tracking,
    color: colors.inkMuted,
  },
  share: {
    paddingHorizontal: space.unit,
    paddingVertical: space.tight,
    borderWidth: hairline,
    borderColor: colors.ink,
    borderRadius: radius,
  },
  shareText: {
    fontFamily: font.mono,
    fontSize: type.base,
    color: colors.ink,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: space.wide,
    gap: space.tight,
  },
  stat: {
    flex: 1,
    paddingVertical: space.tight + space.hair,
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius,
  },
  statValue: {
    fontFamily: font.bold,
    fontSize: type.large,
    color: colors.ink,
  },
  statLabel: {
    marginTop: 1,
    fontFamily: font.mono,
    fontSize: type.micro,
    letterSpacing: tracking,
    color: colors.inkMuted,
  },
  feed: {
    marginTop: space.wide,
    borderTopWidth: hairline,
    borderTopColor: colors.rule,
  },
  feedItem: {
    paddingVertical: space.unit,
    borderBottomWidth: hairline,
    borderBottomColor: colors.rule,
  },
  feedTitle: {
    fontFamily: font.regular,
    fontSize: type.base,
    color: colors.ink,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  compose: {
    backgroundColor: colors.ink,
    borderRadius: radius,
    paddingVertical: space.unit,
    alignItems: 'center',
  },
  composeText: {
    fontFamily: font.medium,
    fontSize: type.base,
    color: colors.paper,
  },
  startRow: {
    paddingHorizontal: space.unit,
    paddingTop: space.unit,
  },
  start: {
    alignSelf: 'flex-start',
  },
  bubbleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.unit,
  },
});
