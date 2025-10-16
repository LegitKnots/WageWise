import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Wallet, Settings } from 'lucide-react-native';

import { TabNavigatorParamList } from 'types/navigation';
import { useTheme } from 'context/ThemeContext';
import HomeTabNavigator from '../tabBar/Home';
import WageTrackerTabNavigator from '../tabBar/WageTracker';
import SettingsTabNavigator from '../tabBar/Settings';

const Tab = createBottomTabNavigator<TabNavigatorParamList>();

export default function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator 
      initialRouteName="HomeTabNavigator" 
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: 34, // Account for iOS home indicator
          paddingTop: 8,
          height: 88, // Increased height to accommodate home indicator
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
      }}
    >
      <Tab.Screen
        name="HomeTabNavigator"
        component={HomeTabNavigator}
        options={{ 
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="WageTrackerTabNavigator"
        component={WageTrackerTabNavigator}
        options={{ 
          tabBarLabel: 'Wage Tracker',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="SettingsTabNavigator"
        component={SettingsTabNavigator}
        options={{ 
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
