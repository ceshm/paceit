import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTabPrefix } from '@/hooks/use-tab-prefix';
import { usePlayer } from '@/lib/player';
import { useTheme } from '@/hooks/use-theme';
import type { Episode, Show } from '@/lib/types';

export function formatDuration(sec: number): string {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDate(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function EpisodeRow({ episode, show }: { episode: Episode; show?: Show | null }) {
  const theme = useTheme();
  const prefix = useTabPrefix();
  const { nowPlaying, status, playEpisode, togglePlay } = usePlayer();

  const isCurrent = nowPlaying?.episode.id === episode.id;
  const isPlaying = isCurrent && status?.playing;

  const onPlay = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playEpisode(episode, show ?? { ...episodeToShow(episode) });
    }
  };

  const onOpen = () => {
    // Detail routes live inside each tab's stack (so the tab bar stays
    // visible), so push within the current tab via its prefix. feedUrl lets
    // the details screen resolve episodes for shows that aren't followed yet.
    router.push({
      pathname: `${prefix}/episode/[id]`,
      params: { id: episode.id, feedUrl: show?.feedUrl ?? '' },
    });
  };

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Image source={{ uri: episode.showArtwork }} style={styles.artwork} contentFit="cover" />
      <View style={styles.textCol}>
        <ThemedText type="default" numberOfLines={2} style={isCurrent && styles.activeTitle}>
          {episode.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {episode.showTitle}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {[formatDate(episode.pubDate), formatDuration(episode.durationSec)].filter(Boolean).join(' · ')}
        </ThemedText>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        hitSlop={8}
        style={({ pressed }) => pressed && { opacity: 0.6 }}
      >
        <ThemedView type={isPlaying ? 'backgroundSelected' : 'backgroundElement'} style={styles.playBadge}>
          <ThemedText type="smallBold">{isPlaying ? '❚❚' : '▶'}</ThemedText>
        </ThemedView>
      </Pressable>
      <View style={[styles.border, { backgroundColor: theme.backgroundElement }]} />
    </Pressable>
  );
}

/** Episode rows on Home may not have the full Show object handy */
function episodeToShow(episode: Episode): Show {
  return {
    id: episode.showId,
    title: episode.showTitle,
    artist: '',
    feedUrl: '',
    artwork: episode.showArtwork,
    language: '',
    addedAt: 0,
  };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  activeTitle: {
    fontWeight: '700',
  },
  playBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    position: 'absolute',
    left: 88,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});