import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TabNavigatorParamList } from 'types/navigation';
import HomeTabNavigator from '../tabBar/Home';

const Tab = createBottomTabNavigator<TabNavigatorParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator initialRouteName="HomeTabNavigator" screenOptions={{headerShown: false}}>
      <Tab.Screen
        name="HomeTabNavigator"
        component={HomeTabNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="SettingsTabNavigator"
        component={HomeTabNavigator}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
