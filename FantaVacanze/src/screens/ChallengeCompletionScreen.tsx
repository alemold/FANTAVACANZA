import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Title, TextInput, Chip, Divider, List, Paragraph, ActivityIndicator, IconButton } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { groupService } from '../services/api';
import { challengeCompletionService } from '../services/challengeCompletionService';
import * as ImagePicker from 'expo-image-picker';
import CustomHeader from '../components/CustomHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChallengeCompletionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChallengeCompletion'>;
type ChallengeCompletionScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeCompletion'>;

type Props = {
  navigation: ChallengeCompletionScreenNavigationProp;
  route: ChallengeCompletionScreenRouteProp;
};

interface Challenge {
  id: string;
  description: string;
  points: number;
  category_id: string;
  is_active: boolean;
  status?: string; // positive or negative
  category_name?: string;
  ripetibile?: string; // 'y' or 'n'
}

interface ChallengeCompletion {
  id: string;
  group_id: string;
  user_id: string;
  challenge_id: string;
  completion_date: string;
  evidence_url?: string;
  points: number;
  notes?: string;
  challenge_description?: string;
  category_name?: string;
  username?: string;
  avatar_url?: string;
  approved?: number;
}

const ChallengeCompletionScreen = ({ navigation, route }: Props) => {
  const { groupId } = route.params;
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'completed'>('available');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch challenges and completions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch group challenges
        const challengesResponse = await groupService.getGroupChallenges(groupId);
        
        // MODIFICA: Fetch tutti i completamenti per il gruppo
        const completionsResponse = await challengeCompletionService.getGroupCompletions(groupId);
        
        if (challengesResponse.challenges) {
          setChallenges(challengesResponse.challenges);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(challengesResponse.challenges.map((c: Challenge) => c.category_id))
          ).map(categoryId => {
            const challenge = challengesResponse.challenges.find((c: Challenge) => c.category_id === categoryId);
            return {
              id: categoryId as string,
              name: challenge?.category_name || 'Altre sfide'
            };
          });
          
          setCategories(uniqueCategories);
        }
        
        if (completionsResponse.completions) {
          setCompletions(completionsResponse.completions);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [groupId]);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso negato', 'È necessario concedere il permesso alla fotocamera per caricare le prove.');
      }
    })();
  }, []);

  // Carica utente corrente da AsyncStorage
  useEffect(() => {
    (async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    })();
  }, []);

  // Handle challenge selection
  const handleSelectChallenge = (challengeId: string) => {
    setSelectedChallenge(selectedChallenge === challengeId ? null : challengeId);
    // Reset evidence and notes when selecting a new challenge
    if (selectedChallenge !== challengeId) {
      setEvidenceImage(null);
      setNotes('');
    }
  };

  // Take a photo as evidence
  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEvidenceImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Errore', 'Si è verificato un errore durante l\'acquisizione della foto.');
    }
  };

  // Pick an image from gallery as evidence
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEvidenceImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Errore', 'Si è verificato un errore durante la selezione dell\'immagine.');
    }
  };

  // Submit challenge completion, set approved as 0
  const handleSubmitCompletion = async () => {
    if (!selectedChallenge) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      // TODO: Upload evidence image to server if needed
      // For now, we'll just pass the local URI
      
      const response = await challengeCompletionService.recordCompletion(
        groupId,
        selectedChallenge,
        evidenceImage || undefined,
        notes || undefined
      );
      
      if (response.success) {
        // Add the new completion to the list
        const challenge = challenges.find(c => c.id === selectedChallenge);
        if (challenge) {
          const newCompletion: ChallengeCompletion = {
            id: response.completion_id.toString(),
            group_id: groupId,
            user_id: currentUser?.id || '',
            challenge_id: selectedChallenge,
            completion_date: new Date().toISOString(),
            evidence_url: evidenceImage || undefined,
            points: challenge.points, // Use challenge points directly instead of response.points
            notes: notes || undefined,
            challenge_description: challenge.description,
            category_name: challenge.category_name,
            approved: 0
          };
          
          setCompletions([newCompletion, ...completions]);
        }
        
        // Reset form
        setSelectedChallenge(null);
        setEvidenceImage(null);
        setNotes('');
        
        // Show success message
        Alert.alert('Successo', 'Sfida completata con successo! Hai guadagnato ' + response.points + ' punti.');
        
        // Switch to pending tab instead of completed
        setActiveTab('pending');
      }
    } catch (err: any) {
      console.error('Error submitting completion:', err);
      setError(err.message || 'Errore durante la registrazione del completamento');
      Alert.alert('Errore', err.message || 'Errore durante la registrazione del completamento');
    } finally {
      setSubmitting(false);
    }
  };

  // Funzione per approvare un completamento
  const handleApproveCompletion = async (completionId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`http://192.168.1.11:3001/api/challenge-completions/${completionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver_id: currentUser.id })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Successo', 'Sfida approvata con successo');
        // Aggiorna il listato dei completamenti
        setCompletions(prev =>
          prev.map(comp =>
            comp.id === completionId ? { ...comp, approved: 1 } : comp
          )
        );
      } else {
        Alert.alert('Errore', data.error || 'Errore nell approvazione della sfida');
      }
    } catch (err) {
      console.error('Error approving completion:', err);
      Alert.alert('Errore', 'Errore nell approvazione della sfida');
    }
  };

  // Filter challenges by category
  const getFilteredChallenges = () => {
    if (!filterCategory) return challenges;
    return challenges.filter(challenge => challenge.category_id === filterCategory);
  };

  // Check if a challenge has been completed and is not repeatable
  const isChallengeCompleted = (challengeId: string) => {
    const isCompleted = completions.some(completion => completion.challenge_id === challengeId);
    if (!isCompleted) return false;
    
    const challenge = challenges.find(c => c.id === challengeId);
    return isCompleted && challenge?.ripetibile !== 'y';
  };

  // Render a challenge item
  const renderChallengeItem = ({ item }: { item: Challenge }) => {
    const isCompleted = isChallengeCompleted(item.id);
    const isSelected = selectedChallenge === item.id;
    
    // Determine if points should be displayed with a plus or minus sign based on status
    const pointsDisplay = item.status === 'negative' ? 
      `-${item.points} punti` : 
      `+${item.points} punti`;
    
    // Determine the color based on status
    const pointsColor = item.status === 'negative' ? 
      '#FF5252' : // Red for negative points
      '#4CAF50'; // Green for positive points
    
    return (
      <Card 
        style={[styles.challengeCard, isSelected && styles.selectedCard, isCompleted && styles.completedCard]}
        onPress={() => !isCompleted && handleSelectChallenge(item.id)}
      >
        <Card.Content>
          <View style={styles.challengeHeader}>
            <Title style={styles.challengeTitle}>{item.description}</Title>
            {item.ripetibile === 'y' && (
              <IconButton
                icon="repeat"
                size={20}
                style={styles.repeatIcon}
              />
            )}
          </View>
          {item.category_name && <Paragraph style={styles.categoryName}>{item.category_name}</Paragraph>}
          <Paragraph style={[styles.challengePoints, { color: pointsColor }]}>{pointsDisplay}</Paragraph>
          
          {isCompleted && (
            <Chip icon="check" style={styles.completedChip}>Completata</Chip>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render per completamenti in attesa con pulsante Approva
  const renderPendingItem = ({ item }: { item: ChallengeCompletion }) => {
    // Check if current user is the one who completed the challenge
    const isOwnCompletion = currentUser && item.user_id === currentUser.id;
    
    return (
      <Card style={styles.completionCard}>
        <Card.Content>
          <Title style={styles.completionTitle}>{item.challenge_description}</Title>
          <Paragraph style={styles.completionDate}>
            Completata il: {new Date(item.completion_date).toLocaleString()}
          </Paragraph>
          <Paragraph style={styles.completionPoints}>
            +{item.points} punti (in attesa)
          </Paragraph>
          {item.evidence_url && (
            <View style={styles.evidenceContainer}>
              <Image source={{ uri: item.evidence_url }} style={styles.evidenceImage} />
            </View>
          )}
          {/* MODIFICA: mostra il pulsante Approva per tutti i completamenti pending */}
          {item.approved === 0 && (
            <Button 
              mode="contained" 
              onPress={() => handleApproveCompletion(item.id)}
              disabled={isOwnCompletion}
              style={isOwnCompletion ? styles.disabledButton : undefined}
            >
              {isOwnCompletion ? "In attesa di approvazione" : "Approva"}
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render a completion item
  const renderCompletionItem = ({ item }: { item: ChallengeCompletion }) => {
    const date = new Date(item.completion_date);
    const formattedDate = date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <Card style={styles.completionCard}>
        <Card.Content>
          <Title style={styles.completionTitle}>{item.challenge_description}</Title>
          <Paragraph style={styles.completionDate}>Completata il: {formattedDate}</Paragraph>
          <Paragraph style={styles.completionPoints}>+{item.points} punti</Paragraph>
          
          {item.notes && (
            <Paragraph style={styles.completionNotes}>{item.notes}</Paragraph>
          )}
          
          {item.evidence_url && (
            <View style={styles.evidenceContainer}>
              <Image source={{ uri: item.evidence_url }} style={styles.evidenceImage} />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // Render category filter chips
  const renderCategoryFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFiltersContainer}>
      <Chip 
        selected={filterCategory === null}
        onPress={() => setFilterCategory(null)}
        style={styles.categoryChip}
        mode="outlined"
      >
        Tutte le categorie
      </Chip>
      
      {categories.map(category => (
        <Chip
          key={category.id}
          selected={filterCategory === category.id}
          onPress={() => setFilterCategory(category.id)}
          style={styles.categoryChip}
          mode="outlined"
        >
          {category.name}
        </Chip>
      ))}
    </ScrollView>
  );

  const pendingCount = completions.filter(c => c.approved === 0).length;
  const completedCount = completions.filter(c => c.approved === 1).length;

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Caricamento sfide...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Completamento Sfide" />
      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        <Button 
          mode={activeTab === 'available' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('available')}
          style={[styles.tabButton, activeTab === 'available' && styles.activeTabButton]}
        >
          Sfide Disponibili
        </Button>
        <Button
          mode={activeTab === 'pending' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('pending')}
          style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]}
        >
          <View style={styles.tabButtonContent}>
            <Text>In Attesa</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          </View>
        </Button>
        <Button 
          mode={activeTab === 'completed' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('completed')}
          style={[styles.tabButton, activeTab === 'completed' && styles.activeTabButton]}
        >
          <View style={styles.tabButtonContent}>
            <Text>Completate</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{completedCount}</Text>
            </View>
          </View>
        </Button>
      </View>
      
      <ScrollView>
        {activeTab === 'available' ? (
          <>
            {renderCategoryFilters()}
            <View style={styles.challengesContainer}>
              {getFilteredChallenges().length > 0 ? (
                <FlatList
                  data={getFilteredChallenges()}
                  renderItem={renderChallengeItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>
                  {filterCategory ? 'Nessuna sfida disponibile in questa categoria' : 'Nessuna sfida disponibile'}
                </Text>
              )}
            </View>
            {selectedChallenge && (
              <Card style={styles.formCard}>
                <Card.Content>
                  <Title style={styles.formTitle}>Registra Completamento</Title>
                  
                  <View style={styles.evidenceButtons}>
                    <Button 
                      mode="outlined" 
                      icon="camera"
                      onPress={handleTakePhoto}
                      style={styles.evidenceButton}
                    >
                      Scatta Foto
                    </Button>
                    
                    <Button 
                      mode="outlined" 
                      icon="image"
                      onPress={handlePickImage}
                      style={styles.evidenceButton}
                    >
                      Galleria
                    </Button>
                  </View>
                  
                  {evidenceImage && (
                    <View style={styles.evidencePreviewContainer}>
                      <Image source={{ uri: evidenceImage }} style={styles.evidencePreview} />
                      <IconButton
                        icon="close-circle"
                        size={24}
                        style={styles.removeImageButton}
                        onPress={() => setEvidenceImage(null)}
                      />
                    </View>
                  )}
                  
                  <TextInput
                    label="Note (opzionale)"
                    value={notes}
                    onChangeText={setNotes}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                  />
                  
                  <Button 
                    mode="contained" 
                    onPress={handleSubmitCompletion}
                    loading={submitting}
                    disabled={submitting}
                    style={styles.submitButton}
                  >
                    Registra Completamento
                  </Button>
                </Card.Content>
              </Card>
            )}
          </>
        ) : activeTab === 'pending' ? (
          <FlatList
            data={completions.filter(c => c.approved === 0)}
            renderItem={renderPendingItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={completions.filter(c => c.approved === 1)}
            renderItem={renderCompletionItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: '#2196F3',
  },
  categoryFiltersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  challengesContainer: {
    padding: 16,
  },
  challengeCard: {
    marginBottom: 12,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  completedCard: {
    opacity: 0.7,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 16,
    flex: 1,
  },
  repeatIcon: {
    marginLeft: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#757575',
  },
  challengePoints: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  completedChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
  },
  formCard: {
    margin: 16,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  evidenceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  evidenceButton: {
    flex: 0.48,
  },
  evidencePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  evidencePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  notesInput: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  completionsContainer: {
    padding: 16,
  },
  completionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  completionTitle: {
    fontSize: 16,
  },
  completionDate: {
    fontSize: 14,
    color: '#757575',
  },
  completionPoints: {
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  completionNotes: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  evidenceContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    marginLeft: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC', // Gray color for disabled button
    opacity: 0.7,
  },
});

export default ChallengeCompletionScreen;