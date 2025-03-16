import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions } from 'react-native';
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

  const openCreateGroupFlow = () => {
    // First show the confirmation modal
    setShowConfirmModal(true);
  };

  const renderGroup = ({ item }: { item: GroupData }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('VacationGroup', { groupId: item.id })}
      style={styles.cardContainer}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>{item.name}</Title>
          <View style={styles.detailsRow}>
            <Text style={styles.participants}>Partecipanti: {item.participants}</Text>
            <Text style={styles.date}>Creato il: {item.created_at}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.points}>{item.points} punti</Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Leaderboard', { groupId: item.id })}>Classifica</Button>
          <Button onPress={() => navigation.navigate('ActivityTracking', { vacationId: item.id })}>Attività</Button>
        </Card.Actions>
      </Card>
    </TouchableOpacity>
  );

  const { height } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <CustomHeader />
      <View style={styles.header}>
        <Title style={styles.headerTitle}>I tuoi Gruppi</Title>
      </View>
      
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
          onDismiss={() => setShowConfirmModal(false)}
          style={styles.modalContainer}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Title style={styles.modalTitle}>Nuovo Gruppo?</Title>
              <Paragraph style={styles.modalDescription}>
                Crea un gruppo per ogni vacanza e sfida i tuoi amici a completare attività divertenti!
                Guadagna punti, scala la classifica e diventa il campione della vacanza.
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => {
                  setShowConfirmModal(false);
                  navigation.navigate('CreateGroup');
                }}
                style={styles.modalButton}
                labelStyle={styles.modalButtonLabel}
              >
                Crea Gruppo
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Create Group Form Modal */}
      <Portal>
        <Modal
          visible={showCreateGroupModal}
          onDismiss={() => setShowCreateGroupModal(false)}
          style={styles.modalContainer}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
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
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
  },
  listContainer: {
    padding: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    elevation: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  date: {
    fontSize: 14,
    color: '#555',
  },
  participants: {
    fontSize: 14,
    color: '#555',
  },
  pointsContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 18,
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