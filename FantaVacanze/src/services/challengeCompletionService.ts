import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API requests - should match the one in api.ts
const API_URL = 'http://192.168.1.8:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Challenge completion services
export const challengeCompletionService = {
  // Record a new challenge completion
  recordCompletion: async (groupId: string, challengeId: string, evidenceUrl?: string, notes?: string) => {
    try {
      // Get current user from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userData);
      
      const response = await api.post('/challenge-completions', {
        group_id: groupId,
        user_id: user.id,
        challenge_id: challengeId,
        evidence_url: evidenceUrl,
        notes: notes
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to record challenge completion');
      }
      throw new Error('Network error while recording challenge completion');
    }
  },
  
  // Get all challenge completions for a group
  getGroupCompletions: async (groupId: string) => {
    try {
      const response = await api.get(`/challenge-completions/group/${groupId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch group completions');
      }
      throw new Error('Network error while fetching group completions');
    }
  },
  
  // Get all challenge completions for a specific user in a group
  getUserCompletions: async (groupId: string) => {
    try {
      // Get current user from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userData);
      
      const response = await api.get(`/challenge-completions/user/${user.id}/group/${groupId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch user completions');
      }
      throw new Error('Network error while fetching user completions');
    }
  }
};

export default challengeCompletionService;