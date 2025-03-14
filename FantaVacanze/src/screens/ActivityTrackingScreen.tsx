import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, Title, TextInput, Chip, FAB, Divider, List, Paragraph } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type ActivityTrackingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActivityTracking'>;
type ActivityTrackingScreenRouteProp = RouteProp<RootStackParamList, 'ActivityTracking'>;

type Props = {
  navigation: ActivityTrackingScreenNavigationProp;
  route: ActivityTrackingScreenRouteProp;
};

// Mock data for activities
const mockActivities = [
  { id: '1', name: 'Escursione in barca', points: 30, description: 'Gita in barca con visita alle grotte marine' },
  { id: '2', name: 'Snorkeling', points: 20, description: 'Esplorazione dei fondali marini' },
  { id: '3', name: 'Trekking', points: 25, description: 'Escursione sui sentieri montani' },
  { id: '4', name: 'Beach volley', points: 15, description: 'Partita di beach volley sulla spiaggia' },
  { id: '5', name: 'Serata karaoke', points: 10, description: 'Serata di karaoke con gli amici' },
  { id: '6', name: 'Degustazione vini locali', points: 15, description: 'Tour di degustazione vini della regione' },
  { id: '7', name: 'Visita museo', points: 20, description: 'Visita al museo archeologico' },
];

// Mock data for completed activities
const mockCompletedActivities = [
  { id: '1', activityId: '2', date: '17/07/2023', points: 20, photos: [] },
  { id: '2', activityId: '5', date: '20/07/2023', points: 10, photos: [] },
];

const ActivityTrackingScreen = ({ navigation, route }: Props) => {
  const { vacationId } = route.params;
  const [activities, setActivities] = useState(mockActivities);
  const [completedActivities, setCompletedActivities] = useState(mockCompletedActivities);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityPoints, setNewActivityPoints] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');

  // In a real app, you would fetch the activities from your MySQL database
  useEffect(() => {
    // Simulating data fetching
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Here you would fetch the actual activities data based on vacationId
      // For now, we're using mock data
    }, 1000);
  }, [vacationId]);

  const handleCompleteActivity = () => {
    if (!selectedActivity) return;

    const activity = activities.find(a => a.id === selectedActivity);
    if (!activity) return;

    const newCompletedActivity = {
      id: Date.now().toString(),
      activityId: activity.id,
      date: new Date().toLocaleDateString('it-IT'),
      points: activity.points,
      photos: [],
    };

    setCompletedActivities([...completedActivities, newCompletedActivity]);
    setSelectedActivity(null);

    // Here you would normally save this to your MySQL database via an API
  };

  const handleAddActivity = () => {
    if (!newActivityName || !newActivityPoints) return;

    const newActivity = {
      id: Date.now().toString(),
      name: newActivityName,
      points: parseInt(newActivityPoints, 10),
      description: newActivityDescription,
    };

    setActivities([...activities, newActivity]);
    setNewActivityName('');
    setNewActivityPoints('');
    setNewActivityDescription('');
    setShowAddForm(false);

    // Here you would normally save this to your MySQL database via an API
  };

  const getActivityName = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    return activity ? activity.name : 'Attività sconosciuta';
  };

  const renderActivity = ({ item }: { item: typeof activities[0] }) => (
    <Chip
      selected={selectedActivity === item.id}
      onPress={() => setSelectedActivity(item.id)}
      style={styles.activityChip}
      mode="outlined"
    >
      {item.name} ({item.points} pts)
    </Chip>
  );

  const renderCompletedActivity = ({ item }: { item: typeof completedActivities[0] }) => (
    <Card style={styles.completedCard}>
      <Card.Content>
        <Title style={styles.completedTitle}>{getActivityName(item.activityId)}</Title>
        <Paragraph>Data: {item.date}</Paragraph>
        <Paragraph style={styles.completedPoints}>+{item.points} punti</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.title}>Attività Disponibili</Title>
            <Paragraph style={styles.subtitle}>Seleziona un'attività che hai completato per guadagnare punti</Paragraph>
            
            <View style={styles.activitiesContainer}>
              <FlatList
                data={activities}
                renderItem={renderActivity}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipContainer}
              />
            </View>
            
            {selectedActivity && (
              <Button 
                mode="contained" 
                onPress={handleCompleteActivity}
                style={styles.completeButton}
              >
                Registra Attività Completata
              </Button>
            )}
          </Card.Content>
        </Card>

        {showAddForm ? (
          <Card style={styles.formCard}>
            <Card.Content>
              <Title style={styles.formTitle}>Aggiungi Nuova Attività</Title>
              
              <TextInput
                label="Nome Attività"
                value={newActivityName}
                onChangeText={setNewActivityName}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Punti"
                value={newActivityPoints}
                onChangeText={setNewActivityPoints}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />
              
              <TextInput
                label="Descrizione"
                value={newActivityDescription}
                onChangeText={setNewActivityDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              
              <View style={styles.buttonRow}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowAddForm(false)}
                  style={[styles.formButton, styles.cancelButton]}
                >
                  Annulla
                </Button>
                
                <Button 
                  mode="contained" 
                  onPress={handleAddActivity}
                  style={styles.formButton}
                  disabled={!newActivityName || !newActivityPoints}
                >
                  Aggiungi
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Attività Completate</Title>
          
          {completedActivities.length > 0 ? (
            <FlatList
              data={completedActivities}
              renderItem={renderCompletedActivity}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.completedContainer}
            />
          ) : (
            <Text style={styles.emptyText}>Non hai ancora completato attività</Text>
          )}
        </View>
      </ScrollView>
      
      {!showAddForm && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setShowAddForm(true)}
          label="Nuova Attività"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  activitiesContainer: {
    marginTop: 8,
  },
  chipContainer: {
    paddingVertical: 8,
  },
  activityChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  completeButton: {
    marginTop: 16,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  completedContainer: {
    paddingBottom: 16,
  },
  completedCard: {
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 16,
  },
  completedPoints: {
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  formCard: {
    margin: 16,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  formButton: {
    flex: 0.48,
  },
  cancelButton: {
    borderColor: '#757575',
  },
});

export default ActivityTrackingScreen;