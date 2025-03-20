import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { Text, Card, Button, Title, TextInput, Divider, List, Switch, ActivityIndicator, Paragraph } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type GroupSettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GroupSettings'>;
type GroupSettingsScreenRouteProp = RouteProp<RootStackParamList, 'GroupSettings'>;

type Props = {
  navigation: GroupSettingsScreenNavigationProp;
  route: GroupSettingsScreenRouteProp;
};

const GroupSettingsScreen = ({ navigation, route }: Props) => {
  const { groupId, groupName } = route.params;
  const [loading, setLoading] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState(groupName);
  const [isPublic, setIsPublic] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [location, setLocation] = useState('Sardegna, Italia');
  const [startDate, setStartDate] = useState('15/07/2023');
  const [endDate, setEndDate] = useState('22/07/2023');
  const [description, setDescription] = useState('Una settimana di relax e divertimento in Sardegna con gli amici!');
  
  // In a real app, you would fetch the group settings from your database
  useEffect(() => {
    // Simulating data fetching
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Here you would fetch the actual group settings based on groupId
    }, 1000);
  }, [groupId]);

  const handleSaveSettings = () => {
    // In a real app, you would save the settings to your database
    Alert.alert('Impostazioni salvate', 'Le impostazioni del gruppo sono state aggiornate con successo.');
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Lascia gruppo',
      'Sei sicuro di voler lasciare questo gruppo?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Lascia',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would remove the user from the group in your database
            navigation.navigate('Home');
          },
        },
      ],
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Elimina gruppo',
      'Sei sicuro di voler eliminare questo gruppo? Questa azione non può essere annullata.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would delete the group from your database
            navigation.navigate('Home');
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Caricamento impostazioni...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Impostazioni Gruppo" />
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Informazioni Gruppo</Title>
            <TextInput
              label="Nome del Gruppo"
              value={groupNameInput}
              onChangeText={setGroupNameInput}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Località"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
            />
            
            <View style={styles.dateContainer}>
              <TextInput
                label="Data inizio"
                value={startDate}
                onChangeText={setStartDate}
                mode="outlined"
                style={[styles.input, styles.dateInput]}
              />
              <TextInput
                label="Data fine"
                value={endDate}
                onChangeText={setEndDate}
                mode="outlined"
                style={[styles.input, styles.dateInput]}
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
            
            <View style={styles.switchContainer}>
              <Text>Gruppo Pubblico</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
              />
            </View>
            <Text style={styles.helperText}>
              {isPublic ? 'Chiunque può trovare e unirsi al gruppo' : 'Solo le persone invitate possono unirsi al gruppo'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Notifiche</Title>
            <View style={styles.switchContainer}>
              <Text>Attiva notifiche</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
            <Text style={styles.helperText}>
              Ricevi notifiche per nuove attività e aggiornamenti del gruppo
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Azioni</Title>
            <Button
              mode="contained"
              onPress={handleSaveSettings}
              style={styles.button}
            >
              Salva Impostazioni
            </Button>
            
            <Divider style={styles.divider} />
            
            <Button
              mode="outlined"
              onPress={handleLeaveGroup}
              style={styles.leaveButton}
              color="#FF9800"
            >
              Lascia Gruppo
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleDeleteGroup}
              style={styles.deleteButton}
              color="#F44336"
            >
              Elimina Gruppo
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 0.48,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  leaveButton: {
    marginTop: 8,
    borderColor: '#FF9800',
  },
  deleteButton: {
    marginTop: 8,
    borderColor: '#F44336',
  },
});

export default GroupSettingsScreen;