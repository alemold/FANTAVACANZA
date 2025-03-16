import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Register for native authentication callbacks
WebBrowser.maybeCompleteAuthSession();

// Base URL for API requests
// const API_URL = 'http://localhost:3001/api'; // For local development on Windows
// const API_URL = 'http://10.0.2.2:3001/api'; // For Android emulator
const API_URL = 'http://192.168.1.11:3001/api'; // For iOS simulator
// For physwical devices, use your computer's local IP address

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Import environment variables
import { EXPO_CLIENT_ID, ANDROID_CLIENT_ID, IOS_CLIENT_ID, WEB_CLIENT_ID, WEB_CLIENT_SECRET, SCOPES } from '@env';

// Google Auth configuration
const googleConfig = {
  expoClientId: EXPO_CLIENT_ID,
  androidClientId: ANDROID_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
  webClientId: WEB_CLIENT_ID,
  webClientSecret: WEB_CLIENT_SECRET,
  scopes: SCOPES.split(',')
};

// User authentication services
export const authService = {
  // Register a new user
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    auth_provider?: string;
    provider_id?: string;
    avatar_url?: string;
  }) => {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Registration failed');
      }
      throw new Error('Network error during registration');
    }
  },

  // Login user
  login: async (credentials: {
    email: string;
    password: string;
    auth_provider?: string;
    provider_id?: string;
  }) => {
    try {
      const response = await api.post('/login', credentials);
      
      // Store user data in AsyncStorage
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Login failed');
      }
      throw new Error('Network error during login');
    }
  },

  // Google Sign In
  googleLogin: async () => {
    try {
      console.log('Starting Google authentication process...');
      
      // Create Google auth request
      const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
      
      // Determine if we're running on web or native platform
      const isWeb = Platform.OS === 'web';
      
      // Create a proper redirect URI using Expo's proxy (only for mobile)
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'fantavacanze',
        //useProxy: true
        // scheme: 'http://localhost', // Not appropriate for mobile apps
        //path: 'oauth2redirect',
      });

      
      console.log('Using redirect URI:', redirectUri);
      console.log('Platform is web:', isWeb);
      
      const request = new AuthSession.AuthRequest({
        clientId: isWeb ? googleConfig.webClientId : (Platform.OS === 'ios' ? googleConfig.iosClientId : googleConfig.androidClientId),
        usePKCE: true, // Enable PKCE for better security
        scopes: googleConfig.scopes,
        redirectUri,
      });
      
      console.log('Prompting for Google authentication...');
      // Use type assertion to bypass TypeScript check for useProxy property
      const result = await request.promptAsync(discovery, {
        useProxy: Platform.OS !== 'web'
      } as AuthSession.AuthRequestPromptOptions);
      
      console.log('Authentication result type:', result.type);
      console.log('Authentication result:', JSON.stringify(result, null, 2));
      
      if (result.type === 'success') {
        // Check for authentication token in different possible locations
        if (!result.authentication && !result.params?.access_token && !result.params?.code) {
          console.error('Authentication successful but no token received');
          throw new Error('Authentication successful but no token received');
        }
        
        // Extract the token from the appropriate location
        const accessToken = result.authentication?.accessToken || 
                           result.params?.access_token;
        const authCode = result.params?.code;
        
        console.log('Successfully authenticated with Google');
        
        let userData;
        
        // If we have an authorization code but no access token, we need to exchange the code for a token
        if (authCode && !accessToken) {
          console.log('Exchanging authorization code for access token...');
          
          // Exchange the authorization code for an access token
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              code: authCode,
              client_id: isWeb ? googleConfig.webClientId : (Platform.OS === 'ios' ? googleConfig.iosClientId : googleConfig.androidClientId),
              client_secret: isWeb ? googleConfig.webClientSecret : '',
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
              code_verifier: request.codeVerifier || '', // Add the code verifier from the original request, fallback to empty string if undefined
            }).toString(),
          });
          
          const tokenData = await tokenResponse.json();
          console.log('Token exchange response received');
          
          if (!tokenData.access_token) {
            console.error('Failed to exchange code for token:', tokenData);
            throw new Error('Failed to exchange authorization code for access token');
          }
          
          // Use the received access token to fetch user info
          const userInfoResponse = await fetch(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
              headers: { Authorization: `Bearer ${tokenData.access_token}` },
            }
          );
          
          userData = await userInfoResponse.json();
        } else if (accessToken) {
          // If we already have an access token, use it directly
          const userInfoResponse = await fetch(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          
          userData = await userInfoResponse.json();
        } else {
          console.error('No access token or authorization code available');
          throw new Error('No access token or authorization code available');
        }
        
        console.log('Retrieved user data from Google:', userData.email);
        
        // Login or register with the backend
        const response = await api.post('/login', {
          email: userData.email,
          auth_provider: 'google',
          provider_id: userData.sub, // Google's unique user ID
          username: userData.name || userData.email.split('@')[0], // Fallback to email username if name is not available
          avatar_url: userData.picture
        });
        
        // Store user data in AsyncStorage
        if (response.data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          console.log('User data stored in AsyncStorage');
        }
        
        return response.data;
      } else if (result.type === 'cancel') {
        console.log('User cancelled the Google authentication');
        throw new Error('Google authentication was cancelled by the user');
      } else if (result.type === 'dismiss') {
        console.log('Google authentication was dismissed');
        throw new Error('Google authentication was dismissed');
      } else {
        console.error('Google authentication failed with result type:', result.type);
        throw new Error(`Google authentication failed with result type: ${result.type}`);
      }
    } catch (error) {
      console.error('Google login error:', error);
      
      // Provide more specific error message based on the error type
      if (error instanceof Error) {
        // Check for specific error messages that might help debugging
        if (error.message.includes('cancelled')) {
          throw new Error('Google authentication was cancelled by the user');
        } else if (error.message.includes('network')) {
          throw new Error('Network error during Google authentication. Please check your internet connection.');
        } else {
          throw new Error(`Google authentication error: ${error.message}`);
        }
      } else {
        throw new Error('Unknown error during Google authentication');
      }
    }
  },

  // Logout user
  logout: async () => {
    try {
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      throw new Error('Error during logout');
    }
  },

  // Get current user from AsyncStorage
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },
};

// User profile services
export const userService = {
  // Get user profile
  getProfile: async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch profile');
      }
      throw new Error('Network error while fetching profile');
    }
  },

  // Update user profile
  updateProfile: async (userId: string, profileData: {
    username?: string;
    email?: string;
    password?: string;
    avatar_url?: string;
  }) => {
    try {
      const response = await api.put(`/users/${userId}`, profileData);
      
      // Update stored user data
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to update profile');
      }
      throw new Error('Network error while updating profile');
    }
  },

  // Upload profile image
  uploadAvatar: async (userId: string, imageUri: string) => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      
      // Get the file name from the URI
      const uriParts = imageUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      // Append the file to the form data
      formData.append('avatar', {
        uri: imageUri,
        name: fileName,
        type: 'image/jpeg', // Assuming JPEG format, adjust if needed
      } as any);
      
      // Create a custom instance for this request with multipart/form-data header
      const response = await axios.post(
        `${API_URL}/users/${userId}/upload-avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // If successful, update the user data in AsyncStorage
      if (response.data.avatar_url) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.avatar_url = response.data.avatar_url;
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to upload avatar');
      }
      throw new Error('Network error while uploading avatar');
    }
  },
};

// Group services
export const groupService = {
  // Create a new group
  createGroup: async (name: string) => {
    try {
      // Get current user from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userData);
      
      const response = await api.post('/groups', {
        name,
        user_id: user.id
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to create group');
      }
      throw new Error('Network error while creating group');
    }
  },
  
  // Get all groups for the current user
  getUserGroups: async () => {
    try {
      // Get current user from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userData);
      
      const response = await api.get(`/groups/user/${user.id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch groups');
      }
      throw new Error('Network error while fetching groups');
    }
  },
  
  // Get a specific group by ID
  getGroupById: async (groupId: string) => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch group');
      }
      throw new Error('Network error while fetching group');
    }
  },
  
  // Join an existing group
  joinGroup: async (groupId: string) => {
    try {
      // Get current user from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userData);
      
      const response = await api.post(`/groups/${groupId}/join`, {
        user_id: user.id
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to join group');
      }
      throw new Error('Network error while joining group');
    }
  }
};

export default {
  authService,
  userService,
  groupService
};