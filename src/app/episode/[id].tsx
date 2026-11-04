import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDate, formatDuration } from '@/components/episode-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { positionOf, usePlayer } from '@/lib/player';
import { useLibrary } from '@/lib/library';
import { fetchEpisodes } from '@/lib/rss';
import type { Episode, Show } from '@/lib/types';

/**
 * Episode details: artwork, title, show, publish date, progress, description.
 * Reached by tapping an episode row. Works for episodes of unfollowed shows
 * too — the row passes the show's feedUrl so we can fetch the feed and find
 * the episode there.
 */
export default function EpisodeDetailsScreen() {
  const { id, feedUrl } = useLocalSearchParams<{ id: string; feedUrl?: string }>();
  const { episodesByShow, positions, shows } = useLibrary();
  const { nowPlaying, status, playEpisode, togglePlay } = usePlayer();

  // The router param may be percent-encoded (RSS guids often contain `&` or `=`)
  const decodedId = typeof id === 'string' ? decodeURIComponent(id) : '';
  const cached = Object.values(episodesByShow)
    .flat()
    .find((ep) => ep.id === decodedId);

  // Fallback for episodes of unfollowed shows: fetch the feed and locate it.
  const [remoteEpisode, setRemoteEpisode] = useState<Episode | null>(null);
  const [remoteState, setRemoteState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');

  useEffect(() => {
    if (cached || !feedUrl) return;
    let cancelled = false;
    (async () => {
      setRemoteState('loading');
      try {
        const result = await fetchEpisodes(feedUrl, { id: 'lookup', title: '', artwork: '' });
        if (cancelled) return;
        const found = result.episodes.find((ep) => ep.id === decodedId) ?? null;
        setRemoteEpisode(found);
        setRemoteState(found ? 'done' : 'error');
      } catch {
        if (cancelled) return;
        setRemoteState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cached, decodedId, feedUrl]);

  const episode = cached ?? remoteEpisode;

  if (!episode) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {remoteState === 'loading' ? (
            <ActivityIndicator style={styles.spinner} />
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              {remoteState === 'error'
                ? "Couldn't load this episode."
                : 'Episode not found. It may have been removed from the feed.'}
            </ThemedText>
          )}
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isCurrent = nowPlaying?.episode.id === episode.id;
  const isPlaying = isCurrent && status?.playing;
  const position = positionOf(positions, episode.id);
  const show = shows.find((s) => s.id === episode.showId);

  // Transient Show for playback of episodes from unfollowed shows
  const playbackShow: Show = show ?? {
    id: episode.showId,
    title: episode.showTitle,
    artist: '',
    feedUrl: feedUrl ?? '',
    artwork: episode.showArtwork,
    language: '',
    addedAt: 0,
  };

  const onPlay = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playEpisode(episode, playbackShow);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={16}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <ThemedText type="subtitle" themeColor="textSecondary" style={styles.close}>
              ‹
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.headerTitle}>
            EPISODE
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: episode.showArtwork }} style={styles.artwork} contentFit="cover" />

          <View style={styles.meta}>
            <ThemedText type="subtitle" style={styles.title} numberOfLines={4}>
              {episode.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {episode.showTitle}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {[formatDate(episode.pubDate), formatDuration(episode.durationSec)]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
            {position > 30 && episode.durationSec > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {formatDuration(Math.max(0, episode.durationSec - position))} remaining
              </ThemedText>
            )}
          </View>

          <Pressable
            onPress={onPlay}
            style={({ pressed }) => [styles.playButton, pressed && { opacity: 0.7 }]}
          >
            <ThemedText type="smallBold">{isPlaying ? '❚❚ Pause' : '▶ Play'}</ThemedText>
          </Pressable>

          {episode.description ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
              {episode.description}
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.one,
    paddingHorizontal: Spacing.three,
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
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  artwork: {
    width: '55%',
    aspectRatio: 1,
    maxWidth: 240,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  meta: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  playButton: {
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  description: {
    width: '100%',
    lineHeight: 20,
    marginTop: Spacing.two,
  },
  spinner: {
    marginTop: Spacing.six,
  },
  hint: {
    padding: Spacing.four,
    textAlign: 'center',
  },
});
