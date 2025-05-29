import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check for existing session on app load
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const [sessionName, storedUserData] = await Promise.all([
        AsyncStorage.getItem('sessionName'),
        AsyncStorage.getItem('userData')
      ]);
      
      if (sessionName) {
        setUserSession(sessionName);
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (authData) => {
    try {
      const { sessionName, ...otherUserData } = authData['Auth User'];
      await Promise.all([
        AsyncStorage.setItem('sessionName', sessionName),
        AsyncStorage.setItem('userData', JSON.stringify(otherUserData))
      ]);
      setUserSession(sessionName);
      setUserData(otherUserData);
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('sessionName'),
        AsyncStorage.removeItem('userData')
      ]);
      setUserSession(null);
      setUserData(null);
    } catch (error) {
      console.error('Error removing session:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        isLoading,
        userSession,
        userData,
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