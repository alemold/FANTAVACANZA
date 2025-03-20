import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VacationGroupScreen from '../screens/VacationGroupScreen';
import CreateVacationScreen from '../screens/CreateVacationScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import ChallengeSelectionScreen from '../screens/ChallengeSelectionScreen';
import ActivityTrackingScreen from '../screens/ActivityTrackingScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupSettingsScreen from '../screens/GroupSettingsScreen';

// Define the stack navigator parameter list
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  VacationGroup: { groupId: string };
  CreateVacation: undefined;
  CreateGroup: undefined;
  ChallengeSelection: { groupId: string, groupName: string };
  ActivityTracking: { vacationId: string };
  Leaderboard: { groupId: string };
  Profile: undefined;
  GroupSettings: { groupId: string, groupName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Hide the default header for all screens
          cardStyle: { backgroundColor: '#e8e1f0' } // Updated to match the new background color
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
        />
        <Stack.Screen 
          name="VacationGroup" 
          component={VacationGroupScreen} 
        />
        <Stack.Screen 
          name="CreateVacation" 
          component={CreateVacationScreen} 
        />
        <Stack.Screen 
          name="CreateGroup" 
          component={CreateGroupScreen} 
        />
        
        <Stack.Screen 
          name="ChallengeSelection" 
          component={ChallengeSelectionScreen} 
        />

        <Stack.Screen 
          name="ActivityTracking" 
          component={ActivityTrackingScreen} 
        />
        <Stack.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
        />
        <Stack.Screen 
          name="GroupSettings" 
          component={GroupSettingsScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;