import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VacationGroupScreen from '../screens/VacationGroupScreen';
import CreateVacationScreen from '../screens/CreateVacationScreen';
import ActivityTrackingScreen from '../screens/ActivityTrackingScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Define the stack navigator parameter list
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  VacationGroup: { groupId: string };
  CreateVacation: undefined;
  ActivityTracking: { vacationId: string };
  Leaderboard: { groupId: string };
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: 'Registrazione' }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'FantaVacanze' }}
        />
        <Stack.Screen 
          name="VacationGroup" 
          component={VacationGroupScreen} 
          options={{ title: 'Gruppo Vacanza' }}
        />
        <Stack.Screen 
          name="CreateVacation" 
          component={CreateVacationScreen} 
          options={{ title: 'Crea Vacanza' }}
        />
        <Stack.Screen 
          name="ActivityTracking" 
          component={ActivityTrackingScreen} 
          options={{ title: 'Attività' }}
        />
        <Stack.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen} 
          options={{ title: 'Classifica' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'Profilo' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;