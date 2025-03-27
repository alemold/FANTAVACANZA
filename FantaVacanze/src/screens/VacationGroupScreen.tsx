import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, ActivityIndicator, Share, Clipboard, Platform, Linking } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { Text, Card, Button, Title, Paragraph, Avatar, List, Divider, IconButton, Modal, Portal, TextInput, Snackbar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { groupService } from '../services/api';

type VacationGroupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VacationGroup'>;
type VacationGroupScreenRouteProp = RouteProp<RootStackParamList, 'VacationGroup'>;

type Props = {
  navigation: VacationGroupScreenNavigationProp;
  route: VacationGroupScreenRouteProp;
};

// Initial structure for a vacation group
interface Participant {
  id: string;
  name: string;
  points: number;
  avatar: string | null;
  isAdmin: boolean;
}

interface Challenge {
  id: string;
  description: string;
  points: number;
  category_id: string;
  is_active: boolean;
  status?: string; // positive or negative
  category_name?: string; // Added to display category name
}

interface ChallengeCategory {
  id: string;
  name: string;
  challenges: Challenge[];
}

interface VacationGroup {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  participants: Participant[];
  challenges?: Challenge[];
  challengeCategories?: ChallengeCategory[];
  groupCode?: string;
}

const VacationGroupScreen = ({ navigation, route }: Props) => {
  const { groupId } = route.params;
  const [vacationGroup, setVacationGroup] = useState<VacationGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch the vacation group details, participants, and challenges from the database
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch group details
        const groupResponse = await groupService.getGroupById(groupId);
        
        // Fetch participants
        const participantsResponse = await groupService.getGroupParticipants(groupId);
        
        // Fetch group challenges
        const challengesResponse = await groupService.getGroupChallenges(groupId);
        
        if (groupResponse.group && participantsResponse.participants) {
          // Map the participants data to match our component's expected format
          const mappedParticipants = participantsResponse.participants.map((participant: any) => ({
            id: participant.user_id.toString(),
            name: participant.username || `User ${participant.user_id}`,
            points: participant.points || 0,
            avatar: participant.avatar_url,
            isAdmin: participant.role === 'admin'
          }));
          
          // Organize challenges by category
          const challenges = challengesResponse?.challenges || [];
          const categoriesMap: Record<string, ChallengeCategory> = {};
          
          // First, create a map of categories
          challenges.forEach((challenge: Challenge) => {
            const categoryId = challenge.category_id;
            const categoryName = challenge.category_name || 'Altre sfide';
            
            if (!categoriesMap[categoryId]) {
              categoriesMap[categoryId] = {
                id: categoryId,
                name: categoryName,
                challenges: []
              };
            }
            
            categoriesMap[categoryId].challenges.push(challenge);
          });
          
          // Convert the map to an array
          const challengeCategories = Object.values(categoriesMap);
          
          // Create the vacation group object with the fetched data
          setVacationGroup({
            id: groupResponse.group.id,
            name: groupResponse.group.name,
            location: groupResponse.group.location || 'Sardegna, Italia',
            startDate: groupResponse.group.start_date || '15/07/2023',
            endDate: groupResponse.group.end_date || '22/07/2023',
            description: groupResponse.group.description || 'Una settimana di relax e divertimento in Sardegna con gli amici!',
            participants: mappedParticipants,
            challenges: challenges,
            challengeCategories: challengeCategories,
            groupCode: groupResponse.group.group_id // Store the group_id
          });
        } else {
          setError('Errore nel caricamento dei dati del gruppo');
        }
      } catch (err: any) {
        console.error('Error fetching group data:', err);
        setError(err.message || 'Errore nel caricamento dei dati del gruppo');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId]);

  const renderParticipant = ({ item }: { item: Participant }) => {
    if (!vacationGroup) return null;
    
    return (
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
  };

  // Render a challenge item
  const renderChallenge = ({ item }: { item: Challenge }) => {
    if (!vacationGroup) return null;
    
    // Determine if points should be displayed with a plus or minus sign based on status
    const pointsDisplay = item.status === 'negative' ? 
      `-${item.points} punti` : 
      `+${item.points} punti`;
    
    // Determine the color based on status
    const pointsColor = item.status === 'negative' ? 
      '#FF5252' : // Red for negative points
      '#4CAF50'; // Green for positive points
    
    return (
      <Card style={styles.challengeCard}>
        <Card.Content>
          <Title style={styles.challengeTitle}>{item.description}</Title>
          {item.category_name && <Paragraph>Categoria: {item.category_name}</Paragraph>}
          <Paragraph style={[styles.challengePoints, { color: pointsColor }]}>{pointsDisplay}</Paragraph>
        </Card.Content>
      </Card>
    );
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={[styles.containerWrapper, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Caricamento dati del gruppo...</Text>
      </View>
    );
  }

  // Show error message if there was an error
  if (error || !vacationGroup) {
    return (
      <View style={[styles.containerWrapper, styles.errorContainer]}>
        <Text style={styles.errorText}>{error || 'Errore nel caricamento dei dati'}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>Torna indietro</Button>
      </View>
    );
  }

  // Function to generate an invitation link
  const generateInviteLink = async () => {
    try {
      const response = await groupService.generateInviteLink(groupId);
      
      if (response && response.invite_code) {
        setInviteCode(response.invite_code);
        setInviteLink(response.invite_link);
        setShowInviteModal(true);
      }
    } catch (err) {
      console.error('Error generating invite link:', err);
      setSnackbarMessage('Errore nella generazione del link di invito');
      setSnackbarVisible(true);
    } finally {
      setInviteLoading(false);
    }
  };

  // Function to share the invitation link
  const shareInviteLink = async () => {
    try {
      const result = await Share.share({
        message: `Unisciti al mio gruppo "${vacationGroup?.name}" su FantaVacanze! Clicca qui: ${inviteLink}`,
        url: inviteLink, // iOS only
        title: 'Invito a FantaVacanze' // Android only
      });
      
      if (result.action === Share.sharedAction) {
        setSnackbarMessage('Link condiviso con successo!');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error sharing invite link:', error);
      setSnackbarMessage('Errore nella condivisione del link');
      setSnackbarVisible(true);
    }
  };

  // Function to copy the invitation link to clipboard
  const copyInviteLink = () => {
    Clipboard.setString(inviteLink);
    setSnackbarMessage('Link copiato negli appunti!');
    setSnackbarVisible(true);
  };

  // Function to copy the group code to clipboard
  const copyGroupCodeToClipboard = () => {
    if (vacationGroup?.groupCode) {
      Clipboard.setString(vacationGroup.groupCode);
      setSnackbarMessage('ID del gruppo copiato negli appunti!');
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.containerWrapper}>
      <CustomHeader 
        title={vacationGroup.name} 
        isGroupScreen={true} 
        groupId={groupId} 
        groupName={vacationGroup.name} 
      />
      <ScrollView style={styles.container}>
      
      {/* Invitation Modal */}
      <Portal>
        <Modal
          visible={showInviteModal}
          onDismiss={() => setShowInviteModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Invita Amici</Title>
          <Text style={styles.modalText}>
            Condividi questo link con i tuoi amici per invitarli a unirsi al gruppo "{vacationGroup?.name}".
          </Text>
          
          <TextInput
            mode="outlined"
            value={inviteLink}
            disabled
            style={styles.linkInput}
            right={<TextInput.Icon icon="content-copy" onPress={copyInviteLink} />}
          />
          
          <View style={styles.modalButtonsContainer}>
            <Button 
              mode="contained" 
              icon="share-variant" 
              onPress={shareInviteLink}
              style={styles.shareButton}
            >
              Condividi
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={() => setShowInviteModal(false)}
              style={styles.closeButton}
            >
              Chiudi
            </Button>
          </View>
        </Modal>
      </Portal>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Partecipanti</Title>
        {vacationGroup && vacationGroup.participants.length === 1 && vacationGroup.participants[0].isAdmin ? (
          <Card style={styles.inviteCard}>
            <Card.Content style={styles.inviteCardContent}>
              <Text style={styles.inviteText}>Invita i tuoi amici al tuo gruppo per iniziare a sfidarvi✌️</Text>
              <Button 
                mode="contained" 
                icon="account-plus"
                onPress={() => {
                  setInviteLoading(true);
                  generateInviteLink();
                }}
                style={styles.inviteButton}
                loading={inviteLoading}
                disabled={inviteLoading}
              >
                + invita gli amici
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            data={vacationGroup.participants.sort((a, b) => b.points - a.points)}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Add group code display for admin */}
      {vacationGroup && vacationGroup.participants.some(p => p.isAdmin) && (
        <Card style={styles.groupCodeCard}>
          <Card.Content>
            <Title style={styles.groupCodeTitle}>ID Gruppo</Title>
            <View style={styles.groupCodeContainer}>
              <Text style={styles.groupCode}>{vacationGroup.groupCode}</Text>
              <IconButton
                icon="content-copy"
                size={20}
                onPress={copyGroupCodeToClipboard}
              />
            </View>
            <Text style={styles.groupCodeHelp}>
              Condividi questo ID con i tuoi amici per farli unire al gruppo
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Sfide del Gruppo</Title>
        {vacationGroup?.challengeCategories && vacationGroup.challengeCategories.length > 0 ? (
          <View>
            {vacationGroup.challengeCategories.map((category) => (
              <View key={category.id} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <FlatList
                  data={category.challenges}
                  renderItem={renderChallenge}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.challengesContainer}
                />
                <Divider style={styles.categoryDivider} />
              </View>
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph style={styles.emptyText}>Nessuna sfida selezionata per questo gruppo.</Paragraph>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('ChallengeSelection', { groupId, groupName: vacationGroup?.name })}
                style={styles.addButton}
              >
                Aggiungi Sfide
              </Button>
            </Card.Content>
          </Card>
        )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 8,
    paddingLeft: 8,
  },
  categoryDivider: {
    marginTop: 12,
    marginBottom: 4,
    height: 1,
    backgroundColor: '#e0e0e0',
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

  challengeCard: {
    width: 250,
    marginRight: 12,
    marginVertical: 8,
  },
  challengeTitle: {
    fontSize: 16,
  },
  challengePoints: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  challengesContainer: {
    paddingRight: 16,
  },
  emptyCard: {
    marginVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  addButton: {
    marginTop: 10,
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
  inviteCard: {
    marginVertical: 16,
    backgroundColor: '#f0f8ff',
    elevation: 2,
  },
  inviteCardContent: {
    alignItems: 'center',
    padding: 16,
  },
  inviteText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  inviteButton: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2196F3',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  linkInput: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareButton: {
    flex: 0.48,
    marginRight: 8,
  },
  closeButton: {
    flex: 0.48,
    marginLeft: 8,
  },
  snackbar: {
    bottom: 20,
  },
  groupCodeCard: {
    marginTop: 10,
    marginBottom: 10,
  },
  groupCodeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
  },
  groupCode: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  groupCodeHelp: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default VacationGroupScreen;