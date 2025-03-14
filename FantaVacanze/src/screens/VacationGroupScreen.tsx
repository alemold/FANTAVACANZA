import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Avatar, List, Divider } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type VacationGroupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VacationGroup'>;
type VacationGroupScreenRouteProp = RouteProp<RootStackParamList, 'VacationGroup'>;

type Props = {
  navigation: VacationGroupScreenNavigationProp;
  route: VacationGroupScreenRouteProp;
};

// Mock data for a vacation group
const mockVacationGroup = {
  id: '1',
  name: 'Vacanza in Sardegna',
  location: 'Sardegna, Italia',
  startDate: '15/07/2023',
  endDate: '22/07/2023',
  description: 'Una settimana di relax e divertimento in Sardegna con gli amici!',
  participants: [
    { id: '1', name: 'Marco Rossi', points: 120, avatar: null },
    { id: '2', name: 'Laura Bianchi', points: 95, avatar: null },
    { id: '3', name: 'Giulia Verdi', points: 150, avatar: null },
    { id: '4', name: 'Paolo Neri', points: 80, avatar: null },
    { id: '5', name: 'Anna Gialli', points: 110, avatar: null },
  ],
  activities: [
    { id: '1', name: 'Escursione in barca', points: 30, date: '16/07/2023' },
    { id: '2', name: 'Snorkeling', points: 20, date: '17/07/2023' },
    { id: '3', name: 'Trekking', points: 25, date: '18/07/2023' },
    { id: '4', name: 'Beach volley', points: 15, date: '19/07/2023' },
    { id: '5', name: 'Serata karaoke', points: 10, date: '20/07/2023' },
  ],
};

const VacationGroupScreen = ({ navigation, route }: Props) => {
  const { groupId } = route.params;
  const [vacationGroup, setVacationGroup] = useState(mockVacationGroup);
  const [loading, setLoading] = useState(false);

  // In a real app, you would fetch the vacation group details from your MySQL database
  useEffect(() => {
    // Simulating data fetching
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Here you would fetch the actual vacation group data based on groupId
      // For now, we're using mock data
    }, 1000);
  }, [groupId]);

  const renderParticipant = ({ item }: { item: typeof vacationGroup.participants[0] }) => (
    <List.Item
      title={item.name}
      description={`${item.points} punti`}
      left={props => (
        <Avatar.Text 
          {...props} 
          size={40} 
          label={item.name.split(' ').map(n => n[0]).join('')} 
        />
      )}
      right={props => (
        <Text {...props} style={styles.participantRank}>
          {vacationGroup.participants.sort((a, b) => b.points - a.points).findIndex(p => p.id === item.id) + 1}°
        </Text>
      )}
    />
  );

  const renderActivity = ({ item }: { item: typeof vacationGroup.activities[0] }) => (
    <Card style={styles.activityCard}>
      <Card.Content>
        <Title style={styles.activityTitle}>{item.name}</Title>
        <Paragraph>Data: {item.date}</Paragraph>
        <Paragraph style={styles.activityPoints}>{item.points} punti</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.title}>{vacationGroup.name}</Title>
          <Paragraph style={styles.location}>{vacationGroup.location}</Paragraph>
          <Paragraph style={styles.dates}>
            {vacationGroup.startDate} - {vacationGroup.endDate}
          </Paragraph>
          <Paragraph style={styles.description}>{vacationGroup.description}</Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Partecipanti</Title>
        <FlatList
          data={vacationGroup.participants.sort((a, b) => b.points - a.points)}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Attività</Title>
        <FlatList
          data={vacationGroup.activities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activitiesContainer}
        />
      </View>

      <View style={styles.buttonsContainer}>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Leaderboard', { groupId })}
          style={styles.button}
        >
          Classifica Completa
        </Button>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('ActivityTracking', { vacationId: groupId })}
          style={styles.button}
        >
          Registra Attività
        </Button>
      </View>
    </ScrollView>
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 4,
  },
  dates: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  description: {
    marginTop: 8,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  participantRank: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  activitiesContainer: {
    paddingRight: 16,
  },
  activityCard: {
    width: 200,
    marginRight: 12,
    marginVertical: 8,
  },
  activityTitle: {
    fontSize: 16,
  },
  activityPoints: {
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    flex: 0.48,
  },
});

export default VacationGroupScreen;