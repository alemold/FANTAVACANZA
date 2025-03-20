import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme, Avatar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type CustomHeaderProps = {
  title?: string;
  isGroupScreen?: boolean;
  groupId?: string;
  groupName?: string;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, isGroupScreen = false, groupId, groupName }) => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  
  // Determine if we're on the home screen
  const isHomeScreen = route.name === 'Home';
  
  // Navigate to profile screen or group settings based on context
  const handleProfilePress = () => {
    if (isGroupScreen && groupId && groupName) {
      navigation.navigate('GroupSettings', { groupId, groupName });
    } else {
      navigation.navigate('Profile');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
      {isHomeScreen ? (
        // Logo for Home screen
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>FantaVacanze</Text>
          
          {/* Profile icon */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <Avatar.Icon 
              size={40} 
              icon="account"
              color="white"
              style={styles.profileIcon}
            />
          </TouchableOpacity>
        </View>
      ) : isGroupScreen ? (
        // Back button and title for group screens with settings icon
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title || route.name}</Text>
          
          {/* Group settings icon */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <Avatar.Icon 
              size={40} 
              icon="cog"
              color="white"
              style={styles.profileIcon}
            />
          </TouchableOpacity>
        </View>
      ) : (
        // Back button for other screens
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title || route.name}</Text>
        </View>
      )}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44, // Added padding for iOS notch
    paddingBottom: 8, // Added padding at the bottom to expand the header
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 1000,
  },
  header: {
    height: Platform.OS === 'ios' ? 55 : 60, // Increased height for better visibility
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    height: '100%',
    paddingLeft: 10, // Added padding to move logo and text to the right
  },
  logo: {
    width: 28, // Slightly larger logo
    height: 28,
    marginRight: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18, // Increased font size
    fontWeight: 'bold',
    flex: 1,
  },
  profileButton: {
    padding: 8,
    marginLeft: 10, // Added right margin to move the profile icon more to the right
  },
  profileIcon: {
    backgroundColor: 'transparent',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default CustomHeader;