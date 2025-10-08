import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WageTrackerScreen from 'screens/WageTrackerScreen';
import { WageTrackerTabNavigatorParamList } from 'types/navigation';

const Stack = createNativeStackNavigator<WageTrackerTabNavigatorParamList>();

export default function WageTrackerTabNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="mainScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="mainScreen" component={WageTrackerScreen} />
    </Stack.Navigator>
  );
}
