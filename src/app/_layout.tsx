import { Archivo_900Black } from '@expo-google-fonts/archivo';
import { Sora_400Regular, Sora_600SemiBold, useFonts } from '@expo-google-fonts/sora';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { color } from '@/constants/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ Archivo_900Black, Sora_400Regular, Sora_600SemiBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // On web the page renders at once (static HTML stays readable); the faces swap in when loaded.
  if (!loaded && !error && Platform.OS !== 'web') return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.ground } }} />
    </>
  );
}
