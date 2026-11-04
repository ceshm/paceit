import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EpisodeRow, formatDuration } from '@/components/episode-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLibrary } from '@/lib/library';
import { fetchEpisodes } from '@/lib/rss';
import type { Episode, Show } from '@/lib/types';

/**
 * Show details: artwork, title, follow toggle, and the show's episodes.
 * Reached from search results and episode rows ("rest of the item").
 *
 * Works for shows the user hasn't followed yet (discovery): the search screen
 * passes title/artist/artwork/feedUrl params, and we fetch the feed live to
 * list episodes and show the channel description.
 */
export default function ShowDetailsScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    artist?: string;
    artwork?: string;
    feedUrl?: string;
  }>();
  const { shows, episodesByShow, isFollowed, toggleFollow } = useLibrary();
  const navigation = useNavigation();

  const followed = isFollowed(params.id);

  // Prefer the library copy (has feed-parsed language/description); fall
  // back to the search-result params so unfollowed shows render fully.
  const show: Show | null = useMemo(() => {
    const libShow = shows.find((s) => s.id === params.id);
    if (libShow) return libShow;
    if (params.title && params.feedUrl) {
      return {
        id: params.id,
        title: params.title,
        artist: params.artist ?? '',
        feedUrl: params.feedUrl,
        artwork: params.artwork ?? '',
        language: '',
        addedAt: 0,
      };
    }
    return null;
  }, [params.id, params.title, params.artist, params.artwork, params.feedUrl, shows]);

  // Unfollowed shows aren't in episodesByShow — fetch the feed on the fly.
  const [remote, setRemote] = useState<{
    episodes: Episode[];
    description: string;
  } | null>(null);
  const [remoteState, setRemoteState] = useState<'loading' | 'error' | 'done'>('loading');

  useEffect(() => {
    if (followed || !show?.feedUrl) return;
    const currentShow = show;
    let cancelled = false;
    (async () => {
      setRemoteState('loading');
      try {
        const result = await fetchEpisodes(currentShow.feedUrl, currentShow);
        if (cancelled) return;
        setRemote({ episodes: result.episodes, description: result.description });
        setRemoteState('done');
      } catch {
        if (cancelled) return;
        setRemoteState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [followed, show]);

  const episodes = followed ? (episodesByShow[params.id] ?? []) : (remote?.episodes ?? []);
  const description = followed ? (show?.description ?? remote?.description ?? '') : (remote?.description ?? show?.description ?? '');

  useEffect(() => {
    navigation.setOptions({ title: show?.title ?? 'Show' });
  }, [navigation, show?.title]);

  if (!show) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Show not found. It may have been unfollowed.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const totalDuration = episodes.reduce((sum, ep) => sum + ep.durationSec, 0);

  const renderHeader = () => (
    <View style={styles.header}>
      <Image source={{ uri: show.artwork }} style={styles.artwork} contentFit="cover" />
      <View style={styles.headerText}>
        <ThemedText type="subtitle" numberOfLines={3}>
          {show.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {show.artist}
        </ThemedText>
        {episodes.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            {episodes.length} episodes · {formatDuration(totalDuration) || 'unknown length'}
          </ThemedText>
        )}
        {description ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Pressable
        onPress={() => void toggleFollow(show)}
        style={({ pressed }) => [styles.followButton, followed && styles.following, pressed && { opacity: 0.7 }]}
      >
        <ThemedText type="smallBold" style={followed && styles.followingText}>
          {followed ? '✓ Following' : '+ Follow'}
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={episodes}
          keyExtractor={(ep, i) => `${ep.id}-${i}`}
          renderItem={({ item }) => <EpisodeRow episode={item} show={show} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            remoteState === 'loading' ? (
              <ActivityIndicator style={styles.spinner} />
            ) : remoteState === 'error' ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                Couldn&apos;t load episodes. Check your connection and try again.
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                {followed ? 'No episodes in the feed yet.' : 'Follow to get new episodes in your Home feed.'}
              </ThemedText>
            )
          }
          contentContainerStyle={styles.listContent}
        />
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  artwork: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  description: {
    marginTop: Spacing.one,
  },
  spinner: {
    marginTop: Spacing.four,
  },
  followButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  following: {
    opacity: 0.85,
  },
  followingText: {
    color: '#3c87f7',
  },
  hint: {
    padding: Spacing.four,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 120,
  },
});
