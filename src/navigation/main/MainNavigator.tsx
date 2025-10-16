import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { MainNavigatorParamList } from 'types/navigation';

import TabNavigator from './TabNavigator';
import OnboardingScreen, { ONBOARDING_KEY } from 'screens/OnboardingScreen';
import SplashScreen from 'components/SplashScreen';
import ErrorBoundary from 'components/ErrorBoundary';

import { UserProvider } from 'context/user';
import { WageTrackerProvider } from 'context/wageTracker';
import { ThemeProvider, useTheme } from 'context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator<MainNavigatorParamList>();

function LoadingScreen() {
  const { colors } = useTheme();
  
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: colors?.background || '#FFFFFF'
    }}>
      <ActivityIndicator size="large" color={colors?.primary || '#007AFF'} />
    </View>
  );
}

export default function MainNavigator() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingComplete(completed === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboardingComplete(false);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
    // Check onboarding status after splash finishes
    checkOnboardingStatus();
  };

  if (showSplash) {
    return (
      <ThemeProvider>
        <SplashScreen onFinish={handleSplashFinish} />
      </ThemeProvider>
    );
  }

  if (isOnboardingComplete === null) {
    // Loading state
    return (
      <ThemeProvider>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <NavigationContainer>
      <ThemeProvider>
        <UserProvider>
          <WageTrackerProvider>
            <ErrorBoundary>
              <Stack.Navigator
                initialRouteName={isOnboardingComplete ? "TabNavigator" : "Onboarding"}
                screenOptions={{ headerShown: false }}
              >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="TabNavigator" component={TabNavigator} />
              </Stack.Navigator>
            </ErrorBoundary>
          </WageTrackerProvider>
        </UserProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
}
