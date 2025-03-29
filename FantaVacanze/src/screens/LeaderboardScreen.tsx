import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, Title, Paragraph, Divider, List, Surface } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { groupService } from '../services/api'; // Add this import

type LeaderboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Leaderboard'>;
type LeaderboardScreenRouteProp = RouteProp<RootStackParamList, 'Leaderboard'>;

type Props = {
  navigation: LeaderboardScreenNavigationProp;
  route: LeaderboardScreenRouteProp;
};

// Mock data for participants
const mockParticipants = [
  { id: '1', name: 'Giulia Verdi', points: 150, activities: 5, avatar: null },
  { id: '2', name: 'Marco Rossi', points: 120, activities: 4, avatar: null },
  { id: '3', name: 'Anna Gialli', points: 110, activities: 3, avatar: null },
  { id: '4', name: 'Laura Bianchi', points: 95, activities: 3, avatar: null },
  { id: '5', name: 'Paolo Neri', points: 80, activities: 2, avatar: null },
];

const LeaderboardScreen = ({ navigation, route }: Props) => {
  const { groupId } = route.params;
  const [participants, setParticipants] = useState(mockParticipants);
  const [loading, setLoading] = useState(false);

  // Replace existing useEffect with useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const fetchParticipants = async () => {
        try {
          setLoading(true);
          // In a real implementation, fetch participants from your API
          const response = await groupService.getGroupParticipants(groupId);
          if (response && response.participants) {
            setParticipants(response.participants);
          }
        } catch (err) {
          console.error('Error fetching participants:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchParticipants();
    }, [groupId])
  );

  const renderTopThree = () => {
    const topThree = [...participants].slice(0, 3);
    
    return (
      <View style={styles.topThreeContainer}>
        {topThree.map((participant, index) => {
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;
          
          return (
            <View 
              key={participant.id} 
              style={[
                styles.podiumItem,
                isFirst ? styles.firstPlace : null,
                isSecond ? styles.secondPlace : null,
                isThird ? styles.thirdPlace : null,
              ]}
            >
              {participant.avatar ? (
                <Avatar.Image 
                  size={isFirst ? 80 : 60}
                  source={{ uri: participant.avatar }}
                  style={[
                    styles.avatar,
                    isFirst ? styles.firstAvatar : null,
                    isSecond ? styles.secondAvatar : null,
                    isThird ? styles.thirdAvatar : null,
                  ]}
                />
              ) : (
                <Avatar.Text 
                  size={isFirst ? 80 : 60} 
                  label={participant.name.split(' ').map(n => n[0]).join('')}
                  style={[
                    styles.avatar,
                    isFirst ? styles.firstAvatar : null,
                    isSecond ? styles.secondAvatar : null,
                    isThird ? styles.thirdAvatar : null,
                  ]}
                />
              )}
              <Text style={styles.podiumName}>{participant.name}</Text>
              <Surface style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{participant.points} pts</Text>
              </Surface>
              <Text style={styles.position}>{index + 1}°</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderParticipant = ({ item, index }: { item: typeof participants[0], index: number }) => {
    // Skip the top 3 participants as they are displayed in the podium
    if (index < 3) return null;
    
    return (
      <List.Item
        title={item.name}
        description={`${item.activities} attività completate`}
        left={props => (
          item.avatar ? (
            <Avatar.Image
              {...props}
              size={40}
              source={{ uri: item.avatar }}
              style={{ marginRight: 8 }}
            />
          ) : (
            <View style={styles.rankContainer}>
              <Text {...props} style={styles.rank}>{index + 1}°</Text>
            </View>
          )
        )}
        right={props => (
          <Text {...props} style={styles.listPoints}>{item.points} pts</Text>
        )}
        style={styles.listItem}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.title}>Classifica</Title>
          <Paragraph style={styles.subtitle}>Chi sarà il campione della vacanza?</Paragraph>
        </Card.Content>
      </Card>
      
      {renderTopThree()}
      
      <Divider style={styles.divider} />
      
      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
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
    marginBottom: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    position: 'relative',
  },
  firstPlace: {
    marginBottom: 0,
    zIndex: 3,
  },
  secondPlace: {
    marginBottom: 20,
    zIndex: 2,
  },
  thirdPlace: {
    marginBottom: 40,
    zIndex: 1,
  },
  avatar: {
    marginBottom: 8,
  },
  firstAvatar: {
    backgroundColor: '#FFD700', // Gold
  },
  secondAvatar: {
    backgroundColor: '#C0C0C0', // Silver
  },
  thirdAvatar: {
    backgroundColor: '#CD7F32', // Bronze
  },
  podiumName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  position: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#2196F3',
    color: 'white',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listItem: {
    backgroundColor: 'white',
    marginVertical: 4,
    borderRadius: 8,
    elevation: 2,
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  listPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    alignSelf: 'center',
  },
});

export default LeaderboardScreen;