import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import * as storage from './storage';
import { fetchEpisodes } from './rss';
import type { Episode, PlaybackPosition, Show } from './types';

type LibraryState = {
  /** followed shows, oldest first */
  shows: Show[];
  /** episodes by showId (cached + refreshed) */
  episodesByShow: Record<string, Episode[]>;
  /** true while first load is in flight */
  loading: boolean;
  /** true while feed refresh is in flight */
  refreshing: boolean;
  /** flat list of episodes across all shows, newest first */
  recentEpisodes: Episode[];
  /** playback positions keyed by episodeId */
  positions: Record<string, PlaybackPosition>;
  isFollowed: (showId: string) => boolean;
  toggleFollow: (show: Show) => Promise<void>;
  setEpisodePosition: (episodeId: string, position: number, duration: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const LibraryContext = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [shows, setShows] = useState<Show[]>([]);
  const [episodesByShow, setEpisodesByShow] = useState<Record<string, Episode[]>>({});
  const [positions, setPositions] = useState<Record<string, PlaybackPosition>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initial load from storage, then refresh feeds in the background
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedShows, storedPositions] = await Promise.all([storage.loadFollows(), storage.loadPositions()]);
      if (cancelled) return;
      setShows(storedShows);
      setPositions(storedPositions);

      const cached = await Promise.all(storedShows.map((s) => storage.loadEpisodes(s.id)));
      if (cancelled) return;
      setEpisodesByShow(Object.fromEntries(storedShows.map((s, i) => [s.id, cached[i]])));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const results = await Promise.allSettled(
      shows.map(async (show) => {
        const { episodes, language } = await fetchEpisodes(show.feedUrl, show);
        return { show, episodes, language };
      }),
    );
    setRefreshing(false);

    const nextEpisodes: Record<string, Episode[]> = {};
    const languageUpdates: { show: Show; language: string }[] = [];
    for (const result of results) {
      if (result.status === 'rejected') continue;
      const { show, episodes, language } = result.value;
      nextEpisodes[show.id] = episodes;
      void storage.saveEpisodes(show.id, episodes);
      if (language && language !== show.language) {
        languageUpdates.push({ show: { ...show, language }, language });
      }
    }
    setEpisodesByShow((prev) => ({ ...prev, ...nextEpisodes }));
    if (languageUpdates.length > 0) {
      const updated = languageUpdates.map((u) => u.show);
      setShows((prev) => prev.map((s) => updated.find((u) => u.id === s.id) ?? s));
      void storage.saveFollows(updated);
    }
  }, [shows]);

  // Refresh feeds once after initial load
  const didInitialRefresh = useRef(false);
  useEffect(() => {
    if (loading || didInitialRefresh.current) return;
    didInitialRefresh.current = true;
    void refresh();
  }, [loading, refresh]);

  const isFollowed = useCallback((showId: string) => shows.some((s) => s.id === showId), [shows]);

  // Ref mirror of `shows` so toggleFollow stays stable without stale closures
  const showsRef = useRef<Show[]>([]);
  useEffect(() => {
    showsRef.current = shows;
  }, [shows]);

  const toggleFollow = useCallback(async (show: Show) => {
    const followed = showsRef.current.some((s) => s.id === show.id);
    const nextShows = followed
      ? showsRef.current.filter((s) => s.id !== show.id)
      : [...showsRef.current, show];

    showsRef.current = nextShows;
    setShows(nextShows);

    if (followed) {
      setEpisodesByShow((prev) => {
        const next = { ...prev };
        delete next[show.id];
        return next;
      });
      void storage.saveFollows(nextShows);
      return;
    }

    // Fetch episodes immediately so the new show appears on Home,
    // and tag the show with the feed's own language.
    try {
      const { episodes, language } = await fetchEpisodes(show.feedUrl, show);
      const taggedShow = language ? { ...show, language } : show;
      const updated = nextShows.map((s) => (s.id === show.id ? taggedShow : s));
      showsRef.current = updated;
      setShows(updated);
      setEpisodesByShow((prev) => ({ ...prev, [show.id]: episodes }));
      void storage.saveEpisodes(show.id, episodes);
      void storage.saveFollows(updated);
    } catch {
      // Keep the follow even if the feed fetch failed; refresh can retry
      void storage.saveFollows(nextShows);
    }
  }, []);

  const setEpisodePosition = useCallback(
    async (episodeId: string, position: number, duration: number) => {
      const entry = { episodeId, position, duration, updatedAt: Date.now() };
      setPositions((prev) => ({ ...prev, [episodeId]: entry }));
      await storage.savePosition(entry);
    },
    [],
  );

  const recentEpisodes = useMemo(
    () =>
      Object.values(episodesByShow)
        .flat()
        .sort((a, b) => b.pubDate - a.pubDate),
    [episodesByShow],
  );

  const value = useMemo(
    () => ({
      shows,
      episodesByShow,
      recentEpisodes,
      positions,
      loading,
      refreshing,
      isFollowed,
      toggleFollow,
      setEpisodePosition,
      refresh,
    }),
    [shows, episodesByShow, recentEpisodes, positions, loading, refreshing, isFollowed, toggleFollow, setEpisodePosition, refresh],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryState {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}