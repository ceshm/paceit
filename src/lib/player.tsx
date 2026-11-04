import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioStatus } from 'expo-audio';
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
import type { Episode, PlaybackPosition, Show } from './types';

/** Learner-friendly speeds, cycles with each tap of the speed button */
const RATE_STEPS = [1, 0.75, 1.25, 1.5, 0.5, 2] as const;

export type NowPlaying = {
  episode: Episode;
  show: Show | null;
};

type PlayerState = {
  nowPlaying: NowPlaying | null;
  status: AudioStatus | null;
  rate: number;
  togglePlay: () => void;
  playEpisode: (episode: Episode, show?: Show | null) => void;
  seekBy: (deltaSeconds: number) => void;
  cycleRate: () => void;
  saveProgress: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({
  children,
  getPosition,
  onProgress,
}: {
  children?: ReactNode;
  /** look up a stored position for an episode (seconds) */
  getPosition: (episodeId: string) => number;
  /** called while playing, so the library can persist progress */
  onProgress: (episodeId: string, position: number, duration: number) => void;
}) {
  // The provider lives at the root for the app's whole lifetime, so this
  // player instance persists across tabs and screens.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [rate, setRate] = useState(1);

  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // Resume target applied once the new source has loaded
  const pendingSeekRef = useRef<number | null>(null);

  // Configure audio session once: background playback + lock screen ownership
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  // Persist previously chosen rate
  useEffect(() => {
    void storage.loadRate().then((saved) => {
      if (saved && RATE_STEPS.includes(saved as (typeof RATE_STEPS)[number])) {
        setRate(saved);
      }
    });
  }, []);

  // Apply the current rate to a freshly loaded source, plus any pending seek
  useEffect(() => {
    if (!status.isLoaded) return;
    if (pendingSeekRef.current != null) {
      const target = pendingSeekRef.current;
      pendingSeekRef.current = null;
      if (target > 0) {
        void player.seekTo(target);
      }
      player.setPlaybackRate(rate, 'high');
      player.play();
    }
  }, [status.isLoaded, player, rate]);

  // Mark finished episodes as fully consumed
  useEffect(() => {
    if (!status.didJustFinish || !nowPlaying) return;
    onProgressRef.current(nowPlaying.episode.id, 0, status.duration || 0);
  }, [status.didJustFinish, status.duration, nowPlaying]);

  // Save progress every 5s while playing
  useEffect(() => {
    if (!status.playing || !nowPlaying) return;
    const interval = setInterval(() => {
      onProgressRef.current(nowPlaying.episode.id, player.currentTime, player.duration);
    }, 5000);
    return () => clearInterval(interval);
  }, [status.playing, nowPlaying, player]);

  const playEpisode = useCallback(
    (episode: Episode, show?: Show | null) => {
      const target = getPosition(episode.id);
      pendingSeekRef.current = target;
      setNowPlaying({ episode, show: show ?? null });

      player.replace({ uri: episode.audioUrl });
      player.setActiveForLockScreen(true, {
        title: episode.title,
        artist: episode.showTitle,
        artworkUrl: episode.showArtwork,
      });
    },
    [getPosition, player],
  );

  const togglePlay = useCallback(() => {
    if (!nowPlaying) return;
    if (status.playing) {
      player.pause();
      onProgressRef.current(nowPlaying.episode.id, player.currentTime, player.duration);
    } else {
      player.play();
    }
  }, [nowPlaying, status.playing, player]);

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      if (!player.duration) return;
      const next = Math.min(Math.max(0, player.currentTime + deltaSeconds), player.duration);
      void player.seekTo(next);
    },
    [player],
  );

  const cycleRate = useCallback(() => {
    setRate((prev) => {
      const index = RATE_STEPS.indexOf(prev as (typeof RATE_STEPS)[number]);
      const next = RATE_STEPS[(index + 1) % RATE_STEPS.length];
      player.setPlaybackRate(next, 'high');
      void storage.saveRate(next);
      return next;
    });
  }, [player]);

  const saveProgress = useCallback(() => {
    if (!nowPlaying) return;
    onProgressRef.current(nowPlaying.episode.id, player.currentTime, player.duration);
  }, [nowPlaying, player]);

  const value = useMemo(
    () => ({
      nowPlaying,
      status,
      rate,
      togglePlay,
      playEpisode,
      seekBy,
      cycleRate,
      saveProgress,
    }),
    [nowPlaying, status, rate, togglePlay, playEpisode, seekBy, cycleRate, saveProgress],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}

export function positionOf(positions: Record<string, PlaybackPosition>, episodeId: string): number {
  return positions[episodeId]?.position ?? 0;
}