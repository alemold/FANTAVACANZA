import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { Text, Card, Button, Title, Paragraph, List, Checkbox, Divider, Chip } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { groupService } from '../services/api';

type ChallengeSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChallengeSelection'>;
type ChallengeSelectionScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeSelection'>;

type Props = {
  navigation: ChallengeSelectionScreenNavigationProp;
  route: ChallengeSelectionScreenRouteProp;
};

// Challenge category interface
interface ChallengeCategory {
  id: string;
  name: string;
  challenges: Challenge[];
}

// Challenge interface
interface Challenge {
  id: string;
  description: string;
  points: number;
  category_id: string;
  is_active: boolean;
  status?: string; // Added status field from database schema
}

// No mock data - we'll fetch everything from the database

const ChallengeSelectionScreen = ({ navigation, route }: Props) => {
  const { groupName, groupId } = route.params;
  const [categories, setCategories] = useState<ChallengeCategory[]>([]);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Fetch challenge categories from the database
  useEffect(() => {
    const fetchChallengeCategories = async () => {
      try {
        setLoading(true);
        // Fetch real data from the database
        const response = await groupService.getChallengeCategories();
        if (response && response.categories) {
          setCategories(response.categories);
          
          // Expand the first category by default if there are categories
          if (response.categories.length > 0) {
            setExpandedCategories([response.categories[0].id]);
          }
        } else {
          setError('Nessuna categoria di sfide trovata.');
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError('Errore nel caricamento delle sfide. Riprova più tardi.');
        console.error(err);
      }
    };

    fetchChallengeCategories();
  }, []);


  // Toggle a challenge selection
  const toggleChallengeSelection = (challengeId: string) => {
    setSelectedChallenges(prevSelected => {
      if (prevSelected.includes(challengeId)) {
        return prevSelected.filter(id => id !== challengeId);
      } else {
        return [...prevSelected, challengeId];
      }
    });
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prevExpanded => {
      if (prevExpanded.includes(categoryId)) {
        return prevExpanded.filter(id => id !== categoryId);
      } else {
        return [...prevExpanded, categoryId];
      }
    });
  };

  // Handle saving selected challenges
  const handleSaveSelectedChallenges = async () => {
    if (selectedChallenges.length === 0) {
      setError('Per favore, seleziona almeno una sfida');
      return;
    }

    try {
      setLoading(true);
      
      // Save the selected challenges to the database
      await groupService.saveGroupChallenges(groupId, selectedChallenges);
      
      // Navigate to the Home screen after successful creation
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      
    } catch (err) {
      setLoading(false);
      setError('Errore durante il salvataggio delle sfide. Riprova più tardi.');
      console.error(err);
    }
  };

  // Render a challenge item
  const renderChallengeItem = (challenge: Challenge) => {
    // Determine if points should be displayed with a plus or minus sign based on status
    const pointsDisplay = challenge.status === 'negative' ? 
      `-${challenge.points} punti` : 
      `+${challenge.points} punti`;
    
    // Determine the color based on status
    const pointsColor = challenge.status === 'negative' ? 
      '#FF5252' : // Red for negative points
      '#4CAF50'; // Green for positive points
    
    return (
      <List.Item
        key={challenge.id}
        title={challenge.description}
        description={() => (
          <Text style={{ color: pointsColor, fontWeight: 'bold' }}>
            {pointsDisplay}
          </Text>
        )}
        left={props => (
          <Checkbox
            status={selectedChallenges.includes(challenge.id) ? 'checked' : 'unchecked'}
            onPress={() => toggleChallengeSelection(challenge.id)}
          />
        )}
        style={styles.challengeItem}
        onPress={() => toggleChallengeSelection(challenge.id)}
      />
    );
  };

  // Render a category with its challenges
  const renderCategory = (category: ChallengeCategory) => {
    const isExpanded = expandedCategories.includes(category.id);
    const selectedCount = category.challenges.filter(challenge => 
      selectedChallenges.includes(challenge.id)
    ).length;

    return (
      <Card key={category.id} style={styles.categoryCard}>
        <List.Accordion
          title={category.name}
          description={`${selectedCount} sfide selezionate`}
          expanded={isExpanded}
          onPress={() => toggleCategoryExpansion(category.id)}
          style={styles.categoryHeader}
          titleStyle={styles.categoryTitle}
          left={props => <List.Icon {...props} icon="trophy" />}
        >
          {category.challenges.map(challenge => renderChallengeItem(challenge))}
        </List.Accordion>
      </Card>
    );
  };

  if (loading && categories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Caricamento sfide...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <CustomHeader title="Seleziona Sfide" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Seleziona le Sfide</Title>
          <Paragraph style={styles.subtitle}>
            Scegli le sfide per il tuo gruppo "{groupName}"
          </Paragraph>
          
          {/* Selected challenges count */}
          <Chip icon="check" style={styles.selectedChip}>
            {selectedChallenges.length} sfide selezionate
          </Chip>
        </View>

        <View style={styles.categoriesContainer}>
          {categories.map(category => renderCategory(category))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleSaveSelectedChallenges}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Salva e Continua
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  selectedChip: {
    marginTop: 8,
    backgroundColor: '#e3f2fd',
  },
  categoriesContainer: {
    padding: 16,
  },
  categoryCard: {
    marginBottom: 12,
    elevation: 2,
  },
  categoryHeader: {
    backgroundColor: '#fff',
  },
  categoryTitle: {
    fontWeight: 'bold',
  },
  challengeItem: {
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  button: {
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 6,
    alignSelf: 'center',
    width: '60%',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default ChallengeSelectionScreen;