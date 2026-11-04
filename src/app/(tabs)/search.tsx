import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLibrary } from '@/lib/library';
import { useTheme } from '@/hooks/use-theme';
import { searchPodcasts, type ItunesResult } from '@/lib/itunes';
import type { Show } from '@/lib/types';

/** Debounce delay for search-as-you-type (iTunes rate limit is ~20 req/min) */
const DEBOUNCE_MS = 600;

export default function SearchScreen() {
  const theme = useTheme();
  const { isFollowed, toggleFollow } = useLibrary();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ItunesResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** bumping this remounts the (uncontrolled) input, clearing the native text field */
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setSearching(false);
        setError(null);
        return;
      }
      setSearching(true);
      try {
        const found = await searchPodcasts(query);
        setResults(found);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [query]);

  const onToggle = async (result: ItunesResult) => {
    const show: Show = {
      id: result.id,
      title: result.title,
      artist: result.artist,
      feedUrl: result.feedUrl,
      artwork: result.artwork,
      language: guessLanguage(result),
      addedAt: Date.now(),
    };
    await toggleFollow(show);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Search</ThemedText>
          <ThemedView type="backgroundElement" style={styles.searchBar}>
            {/* Uncontrolled: the OS field owns its buffer, so re-renders from the
                debounced search can never reset or block composition mid-typing */}
            <TextInput
              key={inputKey}
              style={[styles.input, { color: theme.text }]}
              placeholder="Podcast name or topic…"
              placeholderTextColor={theme.textSecondary}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {/* Fixed-width slot: no layout shift when the spinner appears */}
            <View style={styles.spinnerSlot} pointerEvents="none">
              {searching && <ActivityIndicator size="small" />}
            </View>
            <Pressable
              onPress={() => {
                setInputKey((k) => k + 1);
                setQuery('');
                setResults([]);
                setError(null);
              }}
              hitSlop={8}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <ThemedText type="small" themeColor="textSecondary">
                ✕
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ResultRow result={item} followed={isFollowed(item.id)} onToggle={onToggle} />}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !searching && query.trim().length >= 2 && !error ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                No results. Try another spelling.
              </ThemedText>
            ) : undefined
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function ResultRow({
  result,
  followed,
  onToggle,
}: {
  result: ItunesResult;
  followed: boolean;
  onToggle: (result: ItunesResult) => void;
}) {
  return (
    <View style={styles.resultRow}>
      <Image source={{ uri: result.artwork }} style={styles.artwork} contentFit="cover" />
      <View style={styles.textCol}>
        <ThemedText type="default" numberOfLines={2}>
          {result.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {result.artist}
        </ThemedText>
      </View>
      <Pressable
        onPress={() => onToggle(result)}
        style={({ pressed }) => [styles.followButton, followed && styles.following, pressed && { opacity: 0.7 }]}
      >
        <ThemedText type="smallBold" style={followed && styles.followingText}>
          {followed ? '✓ Following' : '+ Follow'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

/**
 * Weak language guess from Apple metadata (storefront country + genres).
 * The feed's own <language> tag overrides this on refresh — see LibraryProvider.
 */
function guessLanguage(result: ItunesResult): string {
  const jaHint = result.country === 'JP' || /日本|japanese/i.test(result.title + result.artist);
  if (jaHint) return 'ja';
  const frHint = result.country === 'FR' || /français|french/i.test(result.title + result.artist);
  if (frHint) return 'fr';
  return '';
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
    gap: Spacing.two,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  spinnerSlot: {
    width: 24,
    alignItems: 'center',
  },
  error: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  listContent: {
    paddingBottom: 120,
  },
  resultRow: {
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
  followButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
});