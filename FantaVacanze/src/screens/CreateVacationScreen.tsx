import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Title, Chip, Divider, HelperText } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type CreateVacationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateVacation'>;

type Props = {
  navigation: CreateVacationScreenNavigationProp;
};

const CreateVacationScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addFriend = () => {
    if (friendEmail && !invitedFriends.includes(friendEmail)) {
      setInvitedFriends([...invitedFriends, friendEmail]);
      setFriendEmail('');
    }
  };

  const removeFriend = (email: string) => {
    setInvitedFriends(invitedFriends.filter(friend => friend !== email));
  };

  const handleCreateVacation = async () => {
    // Reset error state
    setError('');
    
    // Basic validation
    if (!name || !location || !startDate || !endDate) {
      setError('Per favore, compila tutti i campi obbligatori');
      return;
    }

    try {
      setLoading(true);
      
      // Here you would normally connect to your MySQL database via an API
      // For now, we'll simulate a successful creation
      setTimeout(() => {
        setLoading(false);
        // Navigate to the Home screen after successful creation
        navigation.navigate('Home');
      }, 1000);
      
    } catch (err) {
      setLoading(false);
      setError('Errore durante la creazione della vacanza. Riprova più tardi.');
      console.error(err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Crea una Nuova Vacanza</Title>
          <Text style={styles.subtitle}>Inserisci i dettagli della tua vacanza e invita i tuoi amici!</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Nome della Vacanza *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Località *"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.input}
          />
          
          <View style={styles.dateContainer}>
            <TextInput
              label="Data Inizio *"
              value={startDate}
              onChangeText={setStartDate}
              mode="outlined"
              style={[styles.input, styles.dateInput]}
              placeholder="GG/MM/AAAA"
            />
            
            <TextInput
              label="Data Fine *"
              value={endDate}
              onChangeText={setEndDate}
              mode="outlined"
              style={[styles.input, styles.dateInput]}
              placeholder="GG/MM/AAAA"
            />
          </View>
          
          <TextInput
            label="Descrizione"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Invita Amici</Title>
          
          <View style={styles.inviteContainer}>
            <TextInput
              label="Email Amico"
              value={friendEmail}
              onChangeText={setFriendEmail}
              mode="outlined"
              style={[styles.input, styles.emailInput]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <Button 
              mode="contained" 
              onPress={addFriend}
              style={styles.addButton}
              disabled={!friendEmail}
            >
              Aggiungi
            </Button>
          </View>
          
          <View style={styles.chipsContainer}>
            {invitedFriends.map((friend, index) => (
              <Chip
                key={index}
                onClose={() => removeFriend(friend)}
                style={styles.chip}
              >
                {friend}
              </Chip>
            ))}
          </View>
          
          {error ? <HelperText type="error">{error}</HelperText> : null}
          
          <Button
            mode="contained"
            onPress={handleCreateVacation}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Crea Vacanza
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  formContainer: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 0.48,
  },
  divider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  inviteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    marginTop: -8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  chip: {
    margin: 4,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
});

export default CreateVacationScreen;