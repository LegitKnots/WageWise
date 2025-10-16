import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from 'screens/SettingsScreen';
import DataManagementScreen from 'screens/DataManagementScreen';
import NotificationsScreen from 'screens/NotificationsScreen';
import ThemeScreen from 'screens/ThemeScreen';
import NameEditScreen from 'screens/NameEditScreen';
import { SettingsTabNavigatorParamList } from 'types/navigation';

const Stack = createNativeStackNavigator<SettingsTabNavigatorParamList>();

export default function SettingsTabNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="mainScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="mainScreen" component={SettingsScreen} />
      <Stack.Screen name="DataManagement" component={DataManagementScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Theme" component={ThemeScreen} />
      <Stack.Screen name="NameEdit" component={NameEditScreen} />
    </Stack.Navigator>
  );
}
