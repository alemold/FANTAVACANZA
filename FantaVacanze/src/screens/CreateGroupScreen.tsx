import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { groupService } from '../services/api';

type CreateGroupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateGroup'>;

type Props = {
  navigation: CreateGroupScreenNavigationProp;
};

const CreateGroupScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleCreateGroup = async () => {
    // Reset error state
    setError('');
    
    // Basic validation
    if (!name) {
      setError('Per favore, inserisci il nome del gruppo');
      return;
    }

    try {
      setLoading(true);
      
      // Connect to the MySQL database via our API service
      const result = await groupService.createGroup(name);
      
      setLoading(false);
      
      // Navigate to the Challenge Selection screen after successful creation
      if (result && result.group && result.group.id) {
        navigation.navigate('ChallengeSelection', {
          groupId: result.group.id,
          groupName: name
        });
      } else {
        throw new Error('Risposta dal server non valida');
      }
      
    } catch (err) {
      setLoading(false);
      setError('Errore durante la creazione del gruppo. Riprova più tardi.');
      console.error(err);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <CustomHeader title="Crea un Nuovo Gruppo" />


      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Crea un Nuovo Gruppo</Title>
          <Text style={styles.subtitle}>Inserisci il nome del tuo gruppo vacanza</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Nome del Gruppo *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            loading={loading}
            disabled={loading}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            Crea Gruppo
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const { height } = Dimensions.get('window');

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
  button: {
    marginTop: 10,
    paddingVertical: 6,
    alignSelf: 'center',
    width: '60%',
  },
  buttonLabel: {
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },

});

export default CreateGroupScreen;