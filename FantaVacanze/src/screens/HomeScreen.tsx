import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions, Animated, Keyboard, KeyboardEvent, Platform, Easing, Clipboard, ScrollView } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { Text, Card, Button, FAB, Title, Paragraph, Portal, TextInput, ActivityIndicator, Snackbar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { groupService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

// Group data interface
interface GroupData {
  id: string;
  name: string;
  participants: number;
  points: number; // Punti totali del gruppo
  user_points: number; // Punti dell'utente in questo gruppo
  created_at: string;
}

const HomeScreen = ({ navigation }: Props) => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Add keyboard state variables
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Animation values for modals
  const confirmModalAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const createModalAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const joinModalAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  // Add new animation value for background overlay opacity
  const overlayOpacityAnim = React.useRef(new Animated.Value(0)).current;
  
  // Fetch groups from the database when component mounts
  useFocusEffect(
    useCallback(() => {
      const fetchGroups = async () => {
        try {
          setLoading(true);
          const response = await groupService.getUserGroups();
          if (response && response.groups) {
            setGroups(response.groups);
          }
        } catch (err) {
          console.error('Error fetching groups:', err);
          setError('Errore nel caricamento dei gruppi');
        } finally {
          setLoading(false);
        }
      };
    
      fetchGroups();
      
      // Return a cleanup function if needed
      return () => {
        // Any cleanup code here
      };
    }, [])  // Empty dependency array means this will run on each focus
  );
  
  const handleCreateGroup = async () => {
    // Reset error state
    setError('');
    
    // Basic validation
    if (!groupName) {
      setError('Per favore, inserisci il nome del gruppo');
      return;
    }
  
    try {
      setCreateLoading(true);
      
      // Create group in the database via our API service
      const result = await groupService.createGroup(groupName);
      
      // Close the modal and reset form
      setShowCreateGroupModal(false);
      setGroupName('');
      
      // Refresh groups list by fetching the updated list
      const response = await groupService.getUserGroups();
      if (response && response.groups) {
        setGroups(response.groups);
      }
      
      setCreateLoading(false);
      
    } catch (err) {
      setCreateLoading(false);
      setError('Errore durante la creazione del gruppo. Riprova più tardi.');
      console.error(err);
    }
  };
  
  // Updated join group function to use group code
  const handleJoinGroup = async () => {
    // Reset error state
    setError('');
    
    // Basic validation
    if (!groupId) {
      setError('Per favore, inserisci l\'ID del gruppo');
      return;
    }
    
    console.log('Tentativo di join con ID:', groupId);
  
    try {
      setJoinLoading(true);
      
      // Join group using the group code
      const response = await groupService.joinGroupByCode(groupId);
      console.log('Risposta dal server:', response);
      
      // Close the modal and reset form
      setShowJoinGroupModal(false);
      setGroupId('');
      
      // Show success message
      setSnackbarMessage('Ti sei unito al gruppo con successo!');
      setSnackbarVisible(true);
      
      // Refresh groups list with a slight delay to ensure backend has updated
      setTimeout(async () => {
        try {
          const updatedGroups = await groupService.getUserGroups();
          if (updatedGroups && updatedGroups.groups) {
            setGroups(updatedGroups.groups);
          }
        } catch (refreshErr) {
          console.error('Error refreshing groups:', refreshErr);
        }
      }, 500);
      
      setJoinLoading(false);
      
    } catch (err: any) {
      setJoinLoading(false);
      setError(err.message || 'Errore durante l\'accesso al gruppo. Verifica l\'ID e riprova.');
      console.error('Errore join gruppo:', err);
    }
  };
  
  // Function to show the create group modal with animation
  const showCreateGroupModalWithAnimation = () => {
    setShowCreateGroupModal(true);
    
    // Reset the animation value and animate up
    createModalAnim.setValue(Dimensions.get('window').height);
    // Reset opacity animation value
    overlayOpacityAnim.setValue(0);
    
    // Get keyboard animation duration from platform settings
    // iOS typically uses 250ms, Android varies but often around 300ms
    const animationDuration = Platform.OS === 'ios' ? 250 : 300;
    
    // Run animations in parallel with easing for a smoother slide
    Animated.parallel([
      Animated.timing(createModalAnim, {
        toValue: 0,
        duration: animationDuration,
        easing: Easing.out(Easing.cubic), // Add easing for smoother animation
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true
      })
    ]).start();
  };
  
  // Function to show the join group modal with animation
  const showJoinGroupModalWithAnimation = () => {
    setShowJoinGroupModal(true);
    
    // Reset the animation value and animate up
    joinModalAnim.setValue(Dimensions.get('window').height);
    // Reset opacity animation value
    overlayOpacityAnim.setValue(0);
    
    // Get keyboard animation duration from platform settings
    // iOS typically uses 250ms, Android varies but often around 300ms
    const animationDuration = Platform.OS === 'ios' ? 250 : 300;
    
    // Run animations in parallel with easing for a smoother slide
    Animated.parallel([
      Animated.timing(joinModalAnim, {
        toValue: 0,
        duration: animationDuration,
        easing: Easing.out(Easing.cubic), // Add easing for smoother animation
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true
      })
    ]).start();
  };
  
  
  // Add keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
  
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
  
    // Cleanup listeners on component unmount
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);
  
  const openCreateGroupFlow = () => {
    // First show the confirmation modal
    setShowConfirmModal(true);
    
    // Reset the animation values
    confirmModalAnim.setValue(Dimensions.get('window').height);
    overlayOpacityAnim.setValue(0);
    
    // Get keyboard animation duration from platform settings
    // iOS typically uses 250ms, Android varies but often around 300ms
    const animationDuration = Platform.OS === 'ios' ? 250 : 300;
    
    // Run animations in parallel with easing for a smoother slide
    Animated.parallel([
      Animated.timing(confirmModalAnim, {
        toValue: 0,
        duration: animationDuration,
        easing: Easing.out(Easing.cubic), // Add easing for smoother animation
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true
      })
    ]).start();
  };
  
  const renderGroup = ({ item }: { item: GroupData }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('VacationGroup', { groupId: item.id })}
      style={styles.cardContainer}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.cardTitle}>{item.name}</Title>
          <View style={styles.detailsRow}>
            <Text style={styles.participants}>Partecipanti: {item.participants}</Text>
            <Text style={styles.points}>{item.user_points} punti</Text>
          </View>
          <Text style={styles.date}>Creato il: {item.created_at}</Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  const { height } = Dimensions.get('window');
  
  return (
    <View style={styles.container}>
      <CustomHeader />
      
      {groups.length > 0 ? (
        <>
          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
          <View style={styles.newGroupButtonContainer}>
            <Button 
              mode="contained" 
              onPress={openCreateGroupFlow}
              style={styles.newGroupButton}
              labelStyle={styles.newGroupButtonLabel}
              icon="plus"
            >
              Nuovo Gruppo
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={showJoinGroupModalWithAnimation}
              style={[styles.newGroupButton, styles.joinGroupButton, {marginTop: 10}]}
              labelStyle={styles.newGroupButtonLabel}
              icon="account-group"
            >
              Unisciti a un gruppo
            </Button>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Button 
            mode="contained" 
            onPress={openCreateGroupFlow}
            style={styles.createGroupButton}
            labelStyle={styles.createGroupButtonLabel}
          >
            CREA UN GRUPPO
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={showJoinGroupModalWithAnimation}
            style={styles.joinGroupButton}
          >
            Unisciti a un gruppo
          </Button>
        </View>
      )}
      
      {/* FAB removed and replaced with centered button above */}
      
      {/* Profile button moved to CustomHeader */}

      {/* Confirmation Modal */}
      <Portal>
        <Modal
          visible={showConfirmModal}
          onDismiss={() => {
            // Get keyboard animation duration from platform settings
            const animationDuration = Platform.OS === 'ios' ? 250 : 300;
            
            // Animate the modal sliding down and overlay fading out before closing
            Animated.parallel([
              Animated.timing(confirmModalAnim, {
                toValue: Dimensions.get('window').height,
                duration: animationDuration,
                easing: Easing.in(Easing.cubic), // Reverse easing for closing
                useNativeDriver: true
              }),
              Animated.timing(overlayOpacityAnim, {
                toValue: 0,
                duration: animationDuration,
                useNativeDriver: true
              })
            ]).start(() => setShowConfirmModal(false));
          }}
          style={styles.modalContainer}
          animationType="none"
          transparent={true}
        >
          <Animated.View style={[styles.modalOverlay, {opacity: overlayOpacityAnim}]}>
            {/* Close button positioned above the modal */}
            <TouchableOpacity
              style={styles.closeButtonContainer}
              onPress={() => {
                // Get keyboard animation duration from platform settings
                const animationDuration = Platform.OS === 'ios' ? 250 : 300;
                
                // Animate the modal sliding down and overlay fading out before closing
                Animated.parallel([
                  Animated.timing(confirmModalAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: animationDuration,
                    easing: Easing.in(Easing.cubic), // Reverse easing for closing
                    useNativeDriver: true
                  }),
                  Animated.timing(overlayOpacityAnim, {
                    toValue: 0,
                    duration: animationDuration,
                    useNativeDriver: true
                  })
                ]).start(() => setShowConfirmModal(false));
              }}
            >
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </TouchableOpacity>

            <Animated.View 
              style={[styles.modalContent, {transform: [{translateY: confirmModalAnim}]}]}>

              <Title style={styles.modalTitle}>Nuovo Gruppo?</Title>
              <Paragraph style={styles.modalDescription}>
                Crea un gruppo per ogni vacanza e sfida i tuoi amici a completare attività divertenti!
                Guadagna punti, scala la classifica e diventa il campione della vacanza.
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => {
                  // Get keyboard animation duration from platform settings
                  const animationDuration = Platform.OS === 'ios' ? 250 : 300;
                  
                  // Animate the modal sliding down before navigating
                  Animated.timing(confirmModalAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: animationDuration,
                    easing: Easing.in(Easing.cubic), // Reverse easing for closing
                    useNativeDriver: true
                  }).start(() => {
                    setShowConfirmModal(false);
                    navigation.navigate('CreateGroup');
                  });
                }}
                style={styles.modalButton}
                labelStyle={styles.modalButtonLabel}
              >
                Crea Gruppo
              </Button>
            </Animated.View>
          </Animated.View>
        </Modal>
      </Portal>

      {/* Create Group Form Modal */}
      <Portal>
        <Modal
          visible={showCreateGroupModal}
          onDismiss={() => {
            // Get keyboard animation duration from platform settings
            const animationDuration = Platform.OS === 'ios' ? 250 : 300;
            
            // Animate the modal sliding down and overlay fading out before closing
            Animated.parallel([
              Animated.timing(createModalAnim, {
                toValue: Dimensions.get('window').height,
                duration: animationDuration,
                easing: Easing.in(Easing.cubic), // Reverse easing for closing
                useNativeDriver: true
              }),
              Animated.timing(overlayOpacityAnim, {
                toValue: 0,
                duration: animationDuration,
                useNativeDriver: true
              })
            ]).start(() => setShowCreateGroupModal(false));
          }}
          style={styles.modalContainer}
          animationType="none"
          transparent={true}
        >
          <Animated.View style={[styles.modalOverlay, {opacity: overlayOpacityAnim}]}>
            {/* Close button positioned above the modal */}
            <TouchableOpacity
              style={styles.closeButtonContainer}
              onPress={() => {
                // Get keyboard animation duration from platform settings
                const animationDuration = Platform.OS === 'ios' ? 250 : 300;
                
                // Animate the modal sliding down and overlay fading out before closing
                Animated.parallel([
                  Animated.timing(createModalAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: animationDuration,
                    easing: Easing.in(Easing.cubic), // Reverse easing for closing
                    useNativeDriver: true
                  }),
                  Animated.timing(overlayOpacityAnim, {
                    toValue: 0,
                    duration: animationDuration,
                    useNativeDriver: true
                  })
                ]).start(() => setShowCreateGroupModal(false));
              }}
            >
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </TouchableOpacity>

            <Animated.View 
              style={[styles.modalContent, {transform: [{translateY: createModalAnim}]}]}>
              <Title style={styles.modalTitle}>Crea un Nuovo Gruppo</Title>
              <Text style={styles.modalSubtitle}>Inserisci il nome del tuo gruppo vacanza</Text>
              
              <TextInput
                label="Nome del Gruppo *"
                value={groupName}
                onChangeText={setGroupName}
                mode="outlined"
                style={styles.input}
              />
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <Button
                mode="contained"
                onPress={handleCreateGroup}
                loading={createLoading}
                disabled={createLoading}
                style={styles.createButton}
                labelStyle={styles.createButtonLabel}
              >
                Crea Gruppo
              </Button>
            </Animated.View>
          </Animated.View>
        </Modal>
      </Portal>

      {/* Join Group Modal */}
      <Portal>
        <Modal
          visible={showJoinGroupModal}
          onDismiss={() => {
            // Get keyboard animation duration from platform settings
            const animationDuration = Platform.OS === 'ios' ? 250 : 300;
            
            // Animate the modal sliding down and overlay fading out before closing
            Animated.parallel([
              Animated.timing(joinModalAnim, {
                toValue: Dimensions.get('window').height,
                duration: animationDuration,
                easing: Easing.in(Easing.cubic), // Reverse easing for closing
                useNativeDriver: true
              }),
              Animated.timing(overlayOpacityAnim, {
                toValue: 0,
                duration: animationDuration,
                useNativeDriver: true
              })
            ]).start(() => setShowJoinGroupModal(false));
          }}
          style={styles.modalContainer}
          animationType="none"
          transparent={true}
        >
          <Animated.View style={[styles.modalOverlay, {opacity: overlayOpacityAnim}]}>
            {/* Close button positioned above the modal */}
            <TouchableOpacity
              style={styles.closeButtonContainer}
              onPress={() => {
                // Get keyboard animation duration from platform settings
                const animationDuration = Platform.OS === 'ios' ? 250 : 300;
                
                // Animate the modal sliding down and overlay fading out before closing
                Animated.parallel([
                  Animated.timing(joinModalAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: animationDuration,
                    easing: Easing.in(Easing.cubic), // Reverse easing for closing
                    useNativeDriver: true
                  }),
                  Animated.timing(overlayOpacityAnim, {
                    toValue: 0,
                    duration: animationDuration,
                    useNativeDriver: true
                  })
                ]).start(() => setShowJoinGroupModal(false));
              }}
            >
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </TouchableOpacity>

            <Animated.View 
              style={[
                styles.modalContent, 
                {
                  transform: [{translateY: joinModalAnim}],
                  // Adjust the position when keyboard is visible
                  marginBottom: keyboardVisible ? keyboardHeight : 0
                }
              ]}>
              <Title style={styles.modalTitle}>Unisciti a un Gruppo</Title>
              <Text style={styles.modalSubtitle}>Inserisci l'ID del gruppo a cui vuoi unirti</Text>
              
              <TextInput
                label="ID del Gruppo *"
                value={groupId}
                onChangeText={setGroupId}
                mode="outlined"
                style={styles.input}
                right={<TextInput.Icon 
                  icon="content-paste" 
                  onPress={async () => {
                    try {
                      const clipboardContent = await Clipboard.getString();
                      if (clipboardContent) {
                        setGroupId(clipboardContent);
                        setError('');
                        // Show a temporary success message
                        setError('ID incollato dagli appunti!');
                        // Clear the message after 2 seconds
                        setTimeout(() => setError(''), 2000);
                      }
                    } catch (err) {
                      console.error('Error pasting from clipboard:', err);
                      setError('Errore durante l\'incollaggio dagli appunti');
                    }
                  }} 
                />}
              />
              
              {error ? <Text style={[styles.errorText, error.includes('incollato') ? styles.successText : null]}>{error}</Text> : null}
              
              <Button
                mode="contained"
                onPress={handleJoinGroup}
                loading={joinLoading}
                disabled={joinLoading}
                style={styles.createButton}
                labelStyle={styles.createButtonLabel}
              >
                Unisciti
              </Button>
            </Animated.View>
          </Animated.View>
        </Modal>
      </Portal>

      {/* Add Snackbar for feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8e1f0', // Lighter shade of purple to match the header
  },
  listContainer: {
    padding: 16,
  },
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    elevation: 3,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  participants: {
    fontSize: 13,
    color: '#555',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createGroupButton: {
    marginBottom: 20,
    paddingVertical: 10,
    width: '80%',
  },
  createGroupButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  joinGroupButton: {
    width: '60%',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  /* Profile button styles moved to CustomHeader */
  // Modal styles
  modalContainer: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height / 2,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2 - 60, // Reverted back to original position
    alignSelf: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.7)', // Semi-transparent gray
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalHeader: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newGroupButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  newGroupButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '60%',
    borderRadius: 25,
  },
  newGroupButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    margin: 0,
    padding: 0,
    elevation: 5,
    width: 100,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    marginTop: 10,
    alignSelf: 'center',
    width: '40%',
  },
  modalButtonLabel: {
    fontSize: 14,
  },
  input: {
    marginBottom: 15,
  },
  createButton: {
    marginTop: 10,
    paddingVertical: 6,
    alignSelf: 'center',
    width: '60%',
  },
  createButtonLabel: {
    fontSize: 14,
  },
  errorText: {
    color: '#FF5252',
    marginVertical: 8,
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
    marginVertical: 8,
    textAlign: 'center',
  },
  snackbar: {
    bottom: 20,
  },
});

export default HomeScreen;