import { useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { EpisodeRow } from '@/components/episode-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { positionOf, usePlayer } from '@/lib/player';
import { useLibrary } from '@/lib/library';

/**
 * Home: the Google-Podcasts-style triage screen.
 * "Continue" (in-progress) pinned on top, then newest episodes from followed shows.
 */
export default function HomeScreen() {
  const { recentEpisodes, shows, positions, loading } = useLibrary();
  const { nowPlaying } = usePlayer();

  const inProgress = useMemo(
    () =>
      recentEpisodes
        .filter((ep) => {
          const pos = positionOf(positions, ep.id);
          return pos > 30 && (!positions[ep.id]?.duration || pos < positions[ep.id]!.duration * 0.98);
        })
        .slice(0, 5),
    [recentEpisodes, positions],
  );

  const feed = useMemo(() => {
    // Don't duplicate an episode that's already in "Continue"
    const continueIds = new Set(inProgress.map((e) => e.id));
    return recentEpisodes.filter((e) => !continueIds.has(e.id));
  }, [recentEpisodes, inProgress]);

  const showById = useMemo(() => new Map(shows.map((s) => [s.id, s])), [shows]);

  const renderHeader = () => (
    <>
      {inProgress.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            CONTINUE
          </ThemedText>
          {inProgress.map((ep) => (
            <EpisodeRow key={ep.id} episode={ep} show={showById.get(ep.showId)} />
          ))}
        </ThemedView>
      )}
      <ThemedView style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
          LATEST EPISODES
        </ThemedText>
      </ThemedView>
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
          Loading your library…
        </ThemedText>
      );
    }
    return (
      <ThemedView type="backgroundElement" style={styles.emptyCard}>
        <ThemedText type="default">Nothing here yet.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Follow a few shows and their latest episodes will show up on this screen.
        </ThemedText>
        <Link href="/search" style={styles.link}>
          <ThemedText type="smallBold">Find shows →</ThemedText>
        </Link>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={feed}
          keyExtractor={(ep, i) => `${ep.id}-${i}`}
          renderItem={({ item }) => <EpisodeRow episode={item} show={showById.get(item.showId)} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          extraData={[nowPlaying?.episode.id, positions]}
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
  listContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  sectionTitle: {
    letterSpacing: 1,
    marginBottom: Spacing.one,
  },
  emptyText: {
    padding: Spacing.four,
  },
  emptyCard: {
    margin: Spacing.three,
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  link: {
    marginTop: Spacing.one,
  },
});