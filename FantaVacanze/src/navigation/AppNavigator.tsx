import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';
import VacationGroupScreen from '../screens/VacationGroupScreen';
import CreateVacationScreen from '../screens/CreateVacationScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import ChallengeSelectionScreen from '../screens/ChallengeSelectionScreen';
import ChallengeCompletionScreen from '../screens/ChallengeCompletionScreen';
import ActivityTrackingScreen from '../screens/ActivityTrackingScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupSettingsScreen from '../screens/GroupSettingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

// Define the stack navigator parameter list
export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Login: undefined;
  Register: undefined;
  VacationGroup: { groupId: string };
  CreateVacation: undefined;
  CreateGroup: undefined;
  ChallengeSelection: { groupId: string, groupName: string };
  ChallengeCompletion: { groupId: string };
  ActivityTracking: { vacationId: string };
  Leaderboard: { groupId: string };
  Profile: undefined;
  GroupSettings: { groupId: string, groupName: string };
  UserProfile: { userId: string; groupId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false, // Hide the default header for all screens
          cardStyle: { backgroundColor: '#e8e1f0' } // Updated to match the new background color
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
        />
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
          name="ChallengeCompletion" 
          component={ChallengeCompletionScreen} 
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
        <Stack.Screen 
          name="UserProfile" 
          component={UserProfileScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;