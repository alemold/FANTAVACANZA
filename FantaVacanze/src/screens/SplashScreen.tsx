import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/api';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

type Props = {
  navigation: SplashScreenNavigationProp;
};

const SplashScreen = ({ navigation }: Props) => {
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // Add a small delay to show the splash screen
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if user data exists in AsyncStorage
        const userData = await authService.getCurrentUser();
        
        // Make sure userData is valid and contains an id
        if (userData && userData.id) {
          console.log('Valid user found, navigating to Home');
          // User is already logged in, navigate to Home screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else {
          console.log('No valid user found, navigating to Login');
          // No user data found, navigate to Login screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        // If there's an error, navigate to Login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    checkUserSession();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/splash-icon.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      <Text style={styles.title}>FantaVacanze</Text>
      <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;