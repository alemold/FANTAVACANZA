import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type CustomHeaderProps = {
  title?: string;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({ title }) => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  
  // Determine if we're on the home screen
  const isHomeScreen = route.name === 'Home';
  
  // Navigate to profile screen
  const handleProfilePress = () => {
    navigation.navigate('Profile');
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
          
          {/* Profile button */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <Text style={styles.profileButtonText}>Profilo</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 1000,
  },
  header: {
    height: Platform.OS === 'ios' ? 40 : 45,
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
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileButton: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default CustomHeader;