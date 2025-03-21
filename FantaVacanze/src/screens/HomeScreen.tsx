import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { Text, Card, Button, FAB, Title, Paragraph, Portal, TextInput, ActivityIndicator } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { groupService } from '../services/api';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

// Group data interface
interface GroupData {
  id: string;
  name: string;
  participants: number;
  points: number;
  created_at: string;
}

const HomeScreen = ({ navigation }: Props) => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  
  // Animation values for modals
  const confirmModalAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const createModalAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  // Add new animation value for background overlay opacity
  const overlayOpacityAnim = React.useRef(new Animated.Value(0)).current;

  // Fetch groups from the database when component mounts
  useEffect(() => {
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
  }, []);

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

  // Function to show the create group modal with animation
  const showCreateGroupModalWithAnimation = () => {
    setShowCreateGroupModal(true);
    
    // Reset the animation value and animate up
    createModalAnim.setValue(Dimensions.get('window').height);
    // Reset opacity animation value
    overlayOpacityAnim.setValue(0);
    
    // Run animations in parallel
    Animated.parallel([
      Animated.timing(createModalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: 300, // Faster duration for the background overlay
        useNativeDriver: true
      })
    ]).start();
  };
  
  const openCreateGroupFlow = () => {
    // First show the confirmation modal
    setShowConfirmModal(true);
    
    // Reset the animation values
    confirmModalAnim.setValue(Dimensions.get('window').height);
    overlayOpacityAnim.setValue(0);
    
    // Run animations in parallel
    Animated.parallel([
      Animated.timing(confirmModalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacityAnim, {
        toValue: 1,
        duration: 300, // Faster duration for the background overlay
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
            <Text style={styles.points}>{item.points} punti</Text>
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
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
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
            onPress={() => console.log('Unisciti a un gruppo')}
            style={styles.joinGroupButton}
          >
            Unisciti a un gruppo
          </Button>
        </View>
      )}
      
      {groups.length > 0 && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={openCreateGroupFlow}
          label="Nuovo Gruppo"
        />
      )}
      
      {/* Profile button moved to CustomHeader */}

      {/* Confirmation Modal */}
      <Portal>
        <Modal
          visible={showConfirmModal}
          onDismiss={() => {
            // Animate the modal sliding down and overlay fading out before closing
            Animated.parallel([
              Animated.timing(confirmModalAnim, {
                toValue: Dimensions.get('window').height,
                duration: 300,
                useNativeDriver: true
              }),
              Animated.timing(overlayOpacityAnim, {
                toValue: 0,
                duration: 300, // Changed from 500 to 300
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
                // Animate the modal sliding down and overlay fading out before closing
                Animated.parallel([
                  Animated.timing(confirmModalAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: 300,
                    useNativeDriver: true
                  }),
                  Animated.timing(overlayOpacityAnim, {
                    toValue: 0,
                    duration: 300, // Changed from 500 to 300 to match modal animation
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
                  // Animate the modal sliding down before navigating
                  Animated.timing(confirmModalAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: 300,
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
            // Animate the modal sliding down and overlay fading out before closing
            Animated.parallel([
              Animated.timing(createModalAnim, {
                toValue: Dimensions.get('window').height,
                duration: 300,
                useNativeDriver: true
              }),
              Animated.timing(overlayOpacityAnim, {
                toValue: 0,
                duration: 300, // Changed from 500 to 300 to match modal animation
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
                // Animate the modal sliding down and overlay fading out before closing
                Animated.parallel([
                  Animated.timing(createModalAnim, {
                    toValue: Dimensions.get('window').height,
                    duration: 300,
                    useNativeDriver: true
                  }),
                  Animated.timing(overlayOpacityAnim, {
                    toValue: 0,
                    duration: 500, // Slightly faster fade-out
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
    width: '100%',
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
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default HomeScreen;