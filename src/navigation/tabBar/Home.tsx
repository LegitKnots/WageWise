import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from 'screens/HomeScreen';
import HourTrackingScreen from 'screens/HourTrackingScreen';
import BudgetPlannerScreen from 'screens/BudgetPlannerScreen';
import { HomeTabNavigatorParamList } from 'types/navigation';

const Stack = createNativeStackNavigator<HomeTabNavigatorParamList>();

export default function HomeTabNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="mainScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="mainScreen" component={HomeScreen} />
      <Stack.Screen name="HourTracking" component={HourTrackingScreen} />
      <Stack.Screen name="BudgetPlanner" component={BudgetPlannerScreen} />
    </Stack.Navigator>
  );
}
