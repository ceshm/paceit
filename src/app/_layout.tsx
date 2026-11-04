import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { MiniPlayer } from '@/components/mini-player';
import { LibraryProvider, useLibrary } from '@/lib/library';
import { PlayerProvider, positionOf } from '@/lib/player';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LibraryProvider>
        <AppShell />
      </LibraryProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Glue between Library and Player: the player needs to read stored positions
 * when starting an episode, push progress updates back into the library, and
 * auto-advance to the next episode of the same show when one finishes.
 * Everything lives INSIDE PlayerProvider so screens can call usePlayer().
 *
 * Detail screens are NOT here — they live inside each tab's own Stack
 * (see src/app/(tabs)/<tab>/_layout.tsx), so the native tab bar stays
 * visible when pushing show/episode details. Only /player stays at the
 * root, presented as a formSheet that covers everything.
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
            <Stack.Screen
              name="player"
              options={{
                // Native sheet on both platforms: iOS UIModalPresentationFormSheet
                // (card) + Android Material BottomSheetBehavior — native swipe-to-
                // dismiss and scrim included. Keep headerShown false; nested
                // navigators/headers inside a formSheet screen are unsupported.
                presentation: 'formSheet',
                headerShown: false,
              }}
            />
          </Stack>
          <MiniPlayer />
        </View>
      </ThemeProvider>
    </PlayerProvider>
  );
}