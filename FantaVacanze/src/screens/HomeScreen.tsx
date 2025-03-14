import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Button, FAB, Title, Paragraph } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

// Mock data for vacation groups
const mockVacationGroups = [
  {
    id: '1',
    name: 'Vacanza in Sardegna',
    location: 'Sardegna, Italia',
    startDate: '15/07/2023',
    endDate: '22/07/2023',
    participants: 5,
    points: 120,
  },
  {
    id: '2',
    name: 'Weekend a Roma',
    location: 'Roma, Italia',
    startDate: '10/08/2023',
    endDate: '13/08/2023',
    participants: 3,
    points: 75,
  },
];

const HomeScreen = ({ navigation }: Props) => {
  const [vacationGroups, setVacationGroups] = useState(mockVacationGroups);
  const [loading, setLoading] = useState(false);

  // In a real app, you would fetch the vacation groups from your MySQL database
  useEffect(() => {
    // Simulating data fetching
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const renderVacationGroup = ({ item }: { item: typeof mockVacationGroups[0] }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('VacationGroup', { groupId: item.id })}
      style={styles.cardContainer}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>{item.name}</Title>
          <Paragraph style={styles.location}>{item.location}</Paragraph>
          <View style={styles.detailsRow}>
            <Text style={styles.dates}>{item.startDate} - {item.endDate}</Text>
            <Text style={styles.participants}>Partecipanti: {item.participants}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Le tue Vacanze</Title>
      </View>
      
      {vacationGroups.length > 0 ? (
        <FlatList
          data={vacationGroups}
          renderItem={renderVacationGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Non hai ancora gruppi vacanza</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('CreateVacation')}
            style={styles.createButton}
          >
            Crea il tuo primo gruppo
          </Button>
        </View>
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CreateVacation')}
        label="Nuova Vacanza"
      />
      
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.profileButtonText}>Profilo</Text>
      </TouchableOpacity>
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
  location: {
    color: '#757575',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dates: {
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
  emptyText: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 20,
  },
  createButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  profileButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen;