import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { Text, Card, Button, Title, TextInput, Avatar, Divider, List, ActivityIndicator } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService, userService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

type Props = {
  navigation: ProfileScreenNavigationProp;
};

// User data interface
interface UserData {
  id: string;
  username: string;
  email: string;
  total_points: number;
  completed_challenges: number; // Aggiunto questo campo
  avatar_url?: string;
  group_count: number; // Added field for groups count
  // Add other fields as needed
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  email: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  editButton: {
    marginTop: 8,
  },
  editForm: {
    width: '100%',
    marginTop: 8,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    borderColor: '#757575',
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
  actionsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
});

const ProfileScreen = ({ navigation }: Props) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isNewImage, setIsNewImage] = useState(false);

  // Fetch the user data from AsyncStorage and then from the database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user from AsyncStorage
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser && currentUser.id) {
          // Fetch the latest user data from the database
          const response = await userService.getProfile(currentUser.id);
          
          if (response && response.user) {
            setUserData(response.user);
            setName(response.user.username);
            setEmail(response.user.email);
            if (response.user.avatar_url) {
              setImage(response.user.avatar_url);
            }
          }
        } else {
          // If no user is found, redirect to login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Errore nel caricamento dei dati utente');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigation]);

  const pickImage = async () => {
    // Request permission to access the media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'È necessario concedere il permesso per accedere alla galleria');
      return;
    }

    // Launch the image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setIsNewImage(true);
    }
  };

  const takePhoto = async () => {
    // Request permission to access the camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'È necessario concedere il permesso per accedere alla fotocamera');
      return;
    }

    // Launch the camera
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setIsNewImage(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!userData) return;
      
      let updatedAvatarUrl = userData.avatar_url;
      
      // If there's a new image, upload it first
      if (isNewImage && image) {
        try {
          const uploadResponse = await userService.uploadAvatar(userData.id, image);
          if (uploadResponse && uploadResponse.avatar_url) {
            updatedAvatarUrl = uploadResponse.avatar_url;
          }
        } catch (uploadErr) {
          console.error('Error uploading avatar:', uploadErr);
          Alert.alert('Errore', 'Impossibile caricare l\'immagine del profilo. Riprova più tardi.');
          // Continue with profile update even if image upload fails
        }
      }
      
      // Update user profile in the database
      const response = await userService.updateProfile(userData.id, {
        username: name,
        email: email,
        avatar_url: updatedAvatarUrl,
      });
      
      if (response && response.user) {
        setUserData(response.user);
        setEditMode(false);
        setIsNewImage(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      
      // Navigate to the Login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  if (loading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Caricamento profilo...</Text>
      </View>
    );
  }

  // If there's no user data and we're not loading, show an error
  if (!userData && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Nessun dato utente disponibile'}</Text>
        <Button mode="contained" onPress={handleLogout} style={styles.button}>
          Torna al Login
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Profilo" />
      <ScrollView style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          {image ? (
            <TouchableOpacity onPress={editMode ? pickImage : undefined}>
              <Avatar.Image 
                size={80} 
                source={{ uri: image }} 
                style={styles.avatar}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={editMode ? pickImage : undefined}>
              <Avatar.Text 
                size={80} 
                label={userData?.username.split(' ').map(n => n[0]).join('') || ''} 
                style={styles.avatar}
              />
            </TouchableOpacity>
          )}
          
          {editMode ? (
            <View style={styles.editForm}>
              <View style={styles.imageButtonsContainer}>
                <Button 
                  mode="outlined" 
                  onPress={pickImage}
                  style={styles.imageButton}
                  icon="image"
                >
                  Galleria
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={takePhoto}
                  style={styles.imageButton}
                  icon="camera"
                >
                  Fotocamera
                </Button>
              </View>
              
              <TextInput
                label="Nome"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              
              <View style={styles.buttonRow}>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setEditMode(false);
                    setName(userData?.username || '');
                    setEmail(userData?.email || '');
                    setImage(userData?.avatar_url || null);
                    setIsNewImage(false);
                  }}
                  style={[styles.button, styles.cancelButton]}
                >
                  Annulla
                </Button>
                
                <Button 
                  mode="contained" 
                  onPress={handleSaveProfile}
                  style={styles.button}
                  loading={loading}
                  disabled={loading}
                >
                  Salva
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Title style={styles.name}>{userData?.username}</Title>
              <Text style={styles.email}>{userData?.email}</Text>
              
              <Button 
                mode="outlined" 
                onPress={() => setEditMode(true)}
                style={styles.editButton}
                icon="pencil"
              >
                Modifica Profilo
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.statsTitle}>Le tue Statistiche</Title>
          
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

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Button 
            mode="outlined" 
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
    </View>
  );
};

export default ProfileScreen;