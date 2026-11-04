import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { MiniPlayer } from '@/components/mini-player';
import { LibraryProvider, useLibrary } from '@/lib/library';
import { PlayerProvider, positionOf } from '@/lib/player';

SplashScreen.preventAutoHideAsync();

/**
 * Root: Library (follows + episodes + progress) -> Player (single persistent
 * audio session) -> Theme -> Tabs with a floating MiniPlayer above them.
 */
export default function RootLayout() {
  return (
    <LibraryProvider>
      <AppShell />
    </LibraryProvider>
  );
}

/**
 * Glue between Library and Player: the player needs to read stored positions
 * when starting an episode and push progress updates back into the library.
 * Everything lives INSIDE PlayerProvider so screens can call usePlayer().
 */
function AppShell() {
  const colorScheme = useColorScheme();
  const { positions, setEpisodePosition } = useLibrary();

  return (
    <PlayerProvider
      getPosition={(episodeId) => positionOf(positions, episodeId)}
      onProgress={setEpisodePosition}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <View style={{ flex: 1 }}>
          <AppTabs />
          <MiniPlayer />
        </View>
      </ThemeProvider>
    </PlayerProvider>
  );
}