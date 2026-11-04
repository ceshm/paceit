import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MiniPlayer } from '@/components/mini-player';
import { LibraryProvider, useLibrary } from '@/lib/library';
import { PlayerProvider, positionOf } from '@/lib/player';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <LibraryProvider>
      <AppShell />
    </LibraryProvider>
  );
}

/**
 * Glue between Library and Player: the player needs to read stored positions
 * when starting an episode, push progress updates back into the library, and
 * auto-advance to the next episode of the same show when one finishes.
 * Everything lives INSIDE PlayerProvider so screens can call usePlayer().
 */
function AppShell() {
  const colorScheme = useColorScheme();
  const { positions, setEpisodePosition, episodesByShow } = useLibrary();

  return (
    <PlayerProvider
      getPosition={(episodeId) => positionOf(positions, episodeId)}
      getNextEpisode={(showId, episodeId) => {
        const episodes = [...(episodesByShow[showId] ?? [])].sort((a, b) => b.pubDate - a.pubDate);
        const index = episodes.findIndex((e) => e.id === episodeId);
        return index >= 0 && index + 1 < episodes.length ? episodes[index + 1] : null;
      }}
      onProgress={setEpisodePosition}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="player" options={{ presentation: 'modal' }} />
          </Stack>
          <MiniPlayer />
        </View>
      </ThemeProvider>
    </PlayerProvider>
  );
}