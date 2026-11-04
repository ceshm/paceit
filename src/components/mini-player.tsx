import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePlayer } from '@/lib/player';
import { useTheme } from '@/hooks/use-theme';

/**
 * Compact persistent player floating above the tab bar.
 * Controls: skip back 15s, play/pause, speed cycle. Progress bar on top.
 */
export function MiniPlayer() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { nowPlaying, status, rate, togglePlay, seekBy, cycleRate } = usePlayer();

  // Hide while the full-screen player modal is open (it's a sibling of the
  // Stack here, so on Android it would otherwise float on top of the modal).
  if (!nowPlaying || pathname === '/player') return null;

  const { currentTime, duration } = status ?? { currentTime: 0, duration: 0 };
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.container,
        {
          // Tab bar top edge: ~insets.bottom + 43 (iOS) / measured on Android
          bottom: Math.max(insets.bottom, 0) + (Platform.OS === 'ios' ? 54 : 82),
          shadowColor: theme.text,
        },
      ]}
    >
      <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.progressFill, { backgroundColor: theme.text, width: `${progress * 100}%` }]} />
      </View>

      <Pressable style={styles.info} onPress={() => router.push('/player')}>
        <Image source={{ uri: nowPlaying.episode.showArtwork }} style={styles.artwork} contentFit="cover" />
        <View style={styles.textCol}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {nowPlaying.episode.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {nowPlaying.episode.showTitle}
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.controls}>
        <Pressable onPress={() => seekBy(-15)} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ↺15
          </ThemedText>
        </Pressable>
        <Pressable onPress={togglePlay} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <ThemedText type="subtitle" style={styles.playIcon}>
            {status?.playing ? '❚❚' : '▶'}
          </ThemedText>
        </Pressable>
        <Pressable onPress={cycleRate} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <ThemedText type="smallBold" style={styles.rateText}>
            {rate}×
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    borderRadius: 16,
    // Extra bottom room so controls (esp. the rate button) sit clear of the
    // home-indicator / gesture bar — swiping home must not fight the player.
    padding: Spacing.two,
    paddingBottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  progressFill: {
    height: '100%',
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  textCol: {
    flex: 1,
    gap: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  playIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  rateText: {
    minWidth: 38,
    textAlign: 'center',
  },
});