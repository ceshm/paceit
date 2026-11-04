import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLibrary } from '@/lib/library';
import type { Show } from '@/lib/types';

/** Language codes for the user's learning goals */
const LANG_LABELS: Record<string, string> = {
  ja: '日本語',
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

export default function FollowingScreen() {
  const { shows, episodesByShow, toggleFollow, refresh, refreshing, loading } = useLibrary();

  const rows = useMemo(
    () =>
      [...shows]
        .sort((a, b) => b.addedAt - a.addedAt)
        .map((show) => ({ show, episodeCount: episodesByShow[show.id]?.length ?? 0 })),
    [shows, episodesByShow],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Shows</ThemedText>
        </ThemedView>

        <FlatList
          data={rows}
          keyExtractor={(row) => row.show.id}
          renderItem={({ item }) => <ShowRow show={item.show} episodeCount={item.episodeCount} onUnfollow={toggleFollow} />}
          onRefresh={refresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="default">{loading ? 'Loading…' : 'No shows yet.'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Use the Search tab to follow podcasts via RSS.
              </ThemedText>
            </ThemedView>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function ShowRow({
  show,
  episodeCount,
  onUnfollow,
}: {
  show: Show;
  episodeCount: number;
  onUnfollow: (show: Show) => void;
}) {
  const langLabel = LANG_LABELS[show.language];
  const onOpen = () => {
    router.push({
      pathname: '/following/show/[id]',
      params: {
        id: show.id,
        title: show.title,
        artist: show.artist,
        artwork: show.artwork,
        feedUrl: show.feedUrl,
      },
    });
  };
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Image source={{ uri: show.artwork }} style={styles.artwork} contentFit="cover" />
      <View style={styles.textCol}>
        <ThemedText type="default" numberOfLines={2}>
          {show.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {show.artist}
        </ThemedText>
        <View style={styles.metaRow}>
          {langLabel ? (
            <ThemedView type="backgroundElement" style={styles.badge}>
              <ThemedText type="small" themeColor="textSecondary">
                {langLabel}
              </ThemedText>
            </ThemedView>
          ) : null}
          {episodeCount > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {episodeCount} episodes
            </ThemedText>
          )}
        </View>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onUnfollow(show);
        }}
        hitSlop={8}
        style={({ pressed }) => [styles.unfollowButton, pressed && { opacity: 0.6 }]}
      >
        <ThemedText type="small" themeColor="textSecondary">
          Unfollow
        </ThemedText>
      </Pressable>
    </Pressable>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  listContent: {
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  artwork: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 2,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unfollowButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  emptyCard: {
    margin: Spacing.three,
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.two,
  },
});