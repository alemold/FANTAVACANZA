import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/api';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

const RegisterScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Reset error state
    setError('');
    
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Per favore, compila tutti i campi');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Attempting registration with:', { username: name, email });
      
      // Connect to the MySQL database via our API service
      const response = await authService.register({
        username: name,
        email,
        password
      });
      
      console.log('Registration response:', response);
      
      // Navigate to the Login screen after successful registration
      navigation.navigate('Login');
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <CustomHeader title="Registrazione" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.title}>Crea un Account</Title>
          <Text style={styles.subtitle}>Unisciti a FantaVacanze e inizia a competere con i tuoi amici!</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Nome completo"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
          />
          
          <TextInput
            label="Conferma Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Registrati
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
          >
            Hai già un account? Accedi
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
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
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
  },
  loginButton: {
    marginTop: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default RegisterScreen;