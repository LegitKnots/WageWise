import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Wallet, Settings } from 'lucide-react-native';

import { TabNavigatorParamList } from 'types/navigation';
import { useTheme } from 'context/ThemeContext';
import ErrorBoundary from 'components/ErrorBoundary';
import { safeThemeAccess } from 'utils/safeAccess';
import HomeTabNavigator from '../tabBar/Home';
import WageTrackerTabNavigator from '../tabBar/WageTracker';
import SettingsTabNavigator from '../tabBar/Settings';

const Tab = createBottomTabNavigator<TabNavigatorParamList>();

export default function MainTabNavigator() {
  const { colors } = useTheme();

  // Safe theme access with fallbacks
  const safeColors = {
    tabBarBackground: safeThemeAccess(colors, 'tabBarBackground', '#FFFFFF'),
    tabBarBorder: safeThemeAccess(colors, 'tabBarBorder', '#DEE2E6'),
    tabBarActive: safeThemeAccess(colors, 'tabBarActive', '#007AFF'),
    tabBarInactive: safeThemeAccess(colors, 'tabBarInactive', '#6C757D'),
  };

  return (
    <ErrorBoundary>
      <Tab.Navigator 
        initialRouteName="HomeTabNavigator" 
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: safeColors.tabBarBackground,
            borderTopWidth: 1,
            borderTopColor: safeColors.tabBarBorder,
            paddingBottom: 34, // Account for iOS home indicator
            paddingTop: 8,
            height: 88, // Increased height to accommodate home indicator
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarActiveTintColor: safeColors.tabBarActive,
          tabBarInactiveTintColor: safeColors.tabBarInactive,
        }}
      >
        <Tab.Screen
          name="HomeTabNavigator"
          component={HomeTabNavigator}
          options={{ 
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size || 24} color={color || safeColors.tabBarInactive} />
          }}
        />
        <Tab.Screen
          name="WageTrackerTabNavigator"
          component={WageTrackerTabNavigator}
          options={{ 
            tabBarLabel: 'Wage Tracker',
            tabBarIcon: ({ color, size }) => <Wallet size={size || 24} color={color || safeColors.tabBarInactive} />
          }}
        />
        <Tab.Screen
          name="SettingsTabNavigator"
          component={SettingsTabNavigator}
          options={{ 
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings size={size || 24} color={color || safeColors.tabBarInactive} />
          }}
        />
      </Tab.Navigator>
    </ErrorBoundary>
  );
}
