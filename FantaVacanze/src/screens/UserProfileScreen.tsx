import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Avatar, ActivityIndicator } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userService, authService } from '../services/api';

type UserProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;
type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

type Props = {
  navigation: UserProfileScreenNavigationProp;
  route: UserProfileScreenRouteProp;
};

// User data interface
interface UserData {
  id: string;
  username: string;
  total_points: number;
  completed_challenges: number; // Aggiunto questo campo
  avatar_url?: string;
  group_count: number; // Added field for groups count
}

const UserProfileScreen = ({ navigation, route }: Props) => {
  const { userId, groupId } = route.params;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Check if this is the current user
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser && currentUser.id === userId) {
          setIsCurrentUser(true);
          // If it's the current user, redirect to the regular profile page
          navigation.replace('Profile');
          return;
        }
        
        // Fetch the user data from the API
        const response = await userService.getProfile(userId);
            if (response && response.user) {
          setUserData(response.user);
        } else {
          setError('Errore nel caricamento dei dati utente');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Errore nel caricamento dei dati utente');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Caricamento profilo...</Text>
      </View>
    );
  }

  if (!userData && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Nessun dato utente disponibile'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title={`Profilo di ${userData?.username}`} />
      <ScrollView>
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            {userData?.avatar_url ? (
              <Avatar.Image 
                size={80} 
                source={{ uri: userData.avatar_url }} 
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text 
                size={80} 
                label={userData?.username.split(' ').map(n => n[0]).join('') || ''} 
                style={styles.avatar}
              />
            )}
            
            <View style={styles.profileInfo}>
              <Title style={styles.name}>{userData?.username}</Title>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Statistiche</Title>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.total_points || 0}</Text>
                <Text style={styles.statLabel}>Punti Totali</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.completed_challenges || 0}</Text>
                <Text style={styles.statLabel}>Attività Completate</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userData?.group_count || 0}</Text>
                <Text style={styles.statLabel}>Gruppi</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
});

export default UserProfileScreen;
