import { enableScreens } from 'react-native-screens';
enableScreens();

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from 'navigation/main/MainNavigator';
import ErrorBoundary from 'components/ErrorBoundary';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <MainNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
