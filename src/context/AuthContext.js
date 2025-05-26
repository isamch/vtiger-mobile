import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    // Check for existing session on app load
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionName = await AsyncStorage.getItem('sessionName');
      if (sessionName) {
        setUserSession(sessionName);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (sessionName) => {
    try {
      await AsyncStorage.setItem('sessionName', sessionName);
      setUserSession(sessionName);
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('sessionName');
      setUserSession(null);
    } catch (error) {
      console.error('Error removing session:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        isLoading,
        userSession,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 