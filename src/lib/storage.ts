import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Episode, PlaybackPosition, Show } from './types';

const KEYS = {
  follows: '@paceit/follows',
  episodes: (showId: string) => `@paceit/episodes/${showId}`,
  positions: '@paceit/positions',
  rate: '@paceit/rate',
} as const;

export async function loadFollows(): Promise<Show[]> {
  const raw = await AsyncStorage.getItem(KEYS.follows);
  return raw ? (JSON.parse(raw) as Show[]) : [];
}

export async function saveFollows(shows: Show[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.follows, JSON.stringify(shows));
}

export async function loadEpisodes(showId: string): Promise<Episode[]> {
  const raw = await AsyncStorage.getItem(KEYS.episodes(showId));
  return raw ? (JSON.parse(raw) as Episode[]) : [];
}

export async function saveEpisodes(showId: string, episodes: Episode[]): Promise<void> {
  // Keep the 100 most recent per show — enough for a personal player
  const trimmed = [...episodes].sort((a, b) => b.pubDate - a.pubDate).slice(0, 100);
  await AsyncStorage.setItem(KEYS.episodes(showId), JSON.stringify(trimmed));
}

export async function loadPositions(): Promise<Record<string, PlaybackPosition>> {
  const raw = await AsyncStorage.getItem(KEYS.positions);
  return raw ? (JSON.parse(raw) as Record<string, PlaybackPosition>) : {};
}

export async function savePosition(position: PlaybackPosition): Promise<void> {
  const all = await loadPositions();
  all[position.episodeId] = position;
  await AsyncStorage.setItem(KEYS.positions, JSON.stringify(all));
}

export async function clearPosition(episodeId: string): Promise<void> {
  const all = await loadPositions();
  delete all[episodeId];
  await AsyncStorage.setItem(KEYS.positions, JSON.stringify(all));
}

export async function loadRate(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(KEYS.rate);
  return raw ? Number(raw) : null;
}

export async function saveRate(rate: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.rate, String(rate));
}