import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from 'screens/SettingsScreen';
import { SettingsTabNavigatorParamList } from 'types/navigation';

const Stack = createNativeStackNavigator<SettingsTabNavigatorParamList>();

export default function SettingsTabNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="mainScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="mainScreen" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
