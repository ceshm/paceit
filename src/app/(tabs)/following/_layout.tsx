import { Stack } from 'expo-router';

/**
 * Shows tab stack, nested inside NativeTabs. Pushed screens (show/episode
 * details) keep the native tab bar visible and get a native header with a
 * back button. The tab root renders its own header, so it hides ours.
 */
export default function FollowingStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="show/[id]"
        options={{ headerShown: true, title: 'Show', headerBackButtonDisplayMode: 'minimal' }}
      />
      <Stack.Screen
        name="episode/[id]"
        options={{ headerShown: true, title: 'Episode', headerBackButtonDisplayMode: 'minimal' }}
      />
    </Stack>
  );
}
