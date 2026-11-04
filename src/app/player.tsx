import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Scrubber } from '@/components/scrubber';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePlayer } from '@/lib/player';
import { useTheme } from '@/hooks/use-theme';

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${m}:${String(ss).padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const theme = useTheme();
  const { nowPlaying, status, rate, togglePlay, seekBy, seekTo, cycleRate } = usePlayer();

  if (!nowPlaying) {
    // Opened without anything playing — bounce back
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ThemedText type="subtitle" style={styles.close}>
              ⌄
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Nothing playing.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const { currentTime, duration, playing } = status ?? { currentTime: 0, duration: 0, playing: false };

  const content = (
    <ThemedView style={styles.container}>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={16} style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <ThemedText type="subtitle" themeColor="textSecondary" style={styles.close}>
              ⌄
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.headerTitle}>
            NOW PLAYING
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.artworkWrap}>
          <Image
            source={{ uri: nowPlaying.episode.showArtwork }}
            style={[styles.artwork, { shadowColor: theme.text }]}
            contentFit="cover"
          />
        </View>

        <View style={styles.meta}>
          <ThemedText type="default" style={styles.episodeTitle} numberOfLines={3}>
            {nowPlaying.episode.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {nowPlaying.episode.showTitle}
          </ThemedText>
        </View>

        <View style={styles.scrubSection}>
          <Scrubber value={currentTime} max={duration} onSeek={seekTo} />
          <View style={styles.timeRow}>
            <ThemedText type="code" themeColor="textSecondary">
              {formatTime(currentTime)}
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              -{formatTime(Math.max(0, duration - currentTime))}
            </ThemedText>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={() => seekBy(-15)} hitSlop={16} style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <ThemedText type="smallBold" style={styles.skipButton}>
              ↺15
            </ThemedText>
          </Pressable>

          <Pressable onPress={togglePlay} hitSlop={16} style={({ pressed }) => pressed && { opacity: 0.8 }}>
            <ThemedText type="title" style={styles.playButton}>
              {playing ? '❚❚' : '▶'}
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => seekBy(15)} hitSlop={16} style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <ThemedText type="smallBold" style={styles.skipButton}>
              15↻
            </ThemedText>
          </Pressable>
        </View>

        <Pressable onPress={cycleRate} style={({ pressed }) => [styles.rateButton, pressed && { opacity: 0.7 }]}>
          <ThemedText type="smallBold">{rate}×</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            tap to change speed
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    // Extra room so the rate button and skip controls stay clear of the
    // home-indicator / gesture bar — the screen is dismissable by a bottom
    // swipe (formSheet), so interactive elements must not sit at the edge.
    paddingBottom: Spacing.five,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  headerTitle: {
    letterSpacing: 1.5,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34,
  },
  close: {
    fontSize: 28,
    lineHeight: 34,
  },
  artworkWrap: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: '100%',
    width: '100%',
    alignItems: 'center',
  },
  artwork: {
    width: '88%',
    aspectRatio: 1,
    maxWidth: 340,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  meta: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  episodeTitle: {
    textAlign: 'center',
    fontWeight: '700',
  },
  scrubSection: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    marginBottom: Spacing.four,
  },
  skipButton: {
    fontSize: 17,
    minWidth: 44,
    textAlign: 'center',
  },
  playButton: {
    fontSize: 44,
    lineHeight: 52,
    minWidth: 80,
    textAlign: 'center',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  emptyText: {
    padding: Spacing.four,
  },
});