import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainNavigatorParamList } from 'types/navigation';

import TabNavigator from './TabNavigator';

import { UserProvider } from 'context/user';
import { WageTrackerProvider } from 'context/wageTracker';

const Stack = createNativeStackNavigator<MainNavigatorParamList>();

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <UserProvider>
        <WageTrackerProvider>
          <Stack.Navigator
            initialRouteName="TabNavigator"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="TabNavigator" component={TabNavigator} />
          </Stack.Navigator>
        </WageTrackerProvider>
      </UserProvider>
    </NavigationContainer>
  );
}
