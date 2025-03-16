import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TextInput, Button, Text, Title, Divider, Snackbar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/api';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleLogin = async () => {
    // Reset error state
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Per favore, inserisci email e password');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Attempting login with:', { email });
      
      // Connect to the MySQL database via our API service
      const response = await authService.login({
        email,
        password
      });
      
      console.log('Login response:', response);
      
      // Only proceed if we have a valid user response
      if (response && response.user) {
        // Show success message
        setSuccessMessage('Login effettuato con successo!');
        setShowSuccessMessage(true);
        
        // Navigate to the Home screen after a short delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }, 1500); // 1.5 second delay to show the success message
      } else {
        throw new Error('Risposta dal server non valida');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il login. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      
      const response = await authService.googleLogin();
      
      if (response && response.user) {
        // Show success message
        setSuccessMessage('Login con Google effettuato con successo!');
        setShowSuccessMessage(true);
        
        // Navigate to the Home screen after a short delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }, 1500); // 1.5 second delay to show the success message
      } else {
        throw new Error('Risposta dal server non valida');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Errore durante il login con Google. Riprova più tardi.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Title style={styles.title}>FantaVacanze</Title>
        <Text style={styles.subtitle}>Competi con i tuoi amici in vacanza!</Text>
      </View>

      <View style={styles.formContainer}>
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
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading || googleLoading}
          style={styles.button}
        >
          Accedi
        </Button>

        <Divider style={styles.divider} />
        
        <Button
          mode="outlined"
          onPress={handleGoogleLogin}
          loading={googleLoading}
          disabled={loading || googleLoading}
          style={styles.googleButton}
          icon="google"
        >
          Accedi con Google
        </Button>
        
        <View style={styles.registerContainer}>
          <Text>Non hai un account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Registrati</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Snackbar
        visible={showSuccessMessage}
        onDismiss={() => setShowSuccessMessage(false)}
        duration={1500}
        style={styles.successSnackbar}
      >
        {successMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginTop: 8,
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
  googleButton: {
    marginTop: 10,
    paddingVertical: 6,
    borderColor: '#4285F4',
  },
  divider: {
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default LoginScreen;