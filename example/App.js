import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from '@expo-google-fonts/archivo';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import PlacementScreen from './src/screens/PlacementScreen';
import WalkthroughScreen from './src/screens/WalkthroughScreen';
import StylingScreen from './src/screens/StylingScreen';
import BehaviorScreen from './src/screens/BehaviorScreen';
import { SeedRule } from './src/ui';
import { colors, font, hairline, space, tracking, type } from './src/theme';

// Four screens, one per 16-character quarter of the seed.
const SCREENS = [
  { key: 'placement', label: 'placement', Screen: PlacementScreen },
  { key: 'walkthrough', label: 'tour', Screen: WalkthroughScreen },
  { key: 'styling', label: 'styling', Screen: StylingScreen },
  { key: 'behavior', label: 'behavior', Screen: BehaviorScreen },
];

function Shell() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(0);
  const { Screen } = SCREENS[active];

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.tight }]}>
      <StatusBar style="dark" />

      <SeedRule activeIndex={active} />

      {/* Remounted per screen so tooltips always start closed. */}
      <View style={styles.body}>
        <Screen key={SCREENS[active].key} index={active} />
      </View>

      <View style={[styles.index, { paddingBottom: insets.bottom + space.tight }]}>
        {SCREENS.map((screen, position) => {
          const selected = position === active;
          return (
            <Pressable
              key={screen.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setActive(position)}
              style={({ pressed }) => [
                styles.indexItem,
                position > 0 && styles.indexDivided,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[styles.indexText, selected && styles.indexTextActive]}
              >
                {screen.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  body: {
    flex: 1,
  },
  index: {
    flexDirection: 'row',
    paddingTop: space.unit,
    borderTopWidth: hairline,
    borderTopColor: colors.ink,
  },
  indexItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.hair,
  },
  indexDivided: {
    borderLeftWidth: hairline,
    borderLeftColor: colors.ruleFaint,
  },
  indexText: {
    fontFamily: font.mono,
    fontSize: type.base,
    letterSpacing: tracking,
    color: colors.inkMuted,
  },
  indexTextActive: {
    fontFamily: font.monoMedium,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.62,
  },
});
