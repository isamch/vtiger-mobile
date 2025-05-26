import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  Pressable,
} from 'react-native';
import {
  login as authLogin,
  isSuccessResponse
} from '../../services/api/auth/authApi';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!username || !accessKey) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authLogin(username, accessKey);

      if (isSuccessResponse(result)) {
        await signIn(result.sessionName);
      } else {
        if (result.httpStatus === 401) {
          Alert.alert('Login Failed', 'Invalid credentials');
        } else {
          Alert.alert('Login Failed', result.error || 'An unexpected error occurred');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }

    
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TextInput
          style={[styles.input, { paddingRight: 50 }]}
          placeholder="Access Key"
          value={accessKey}
          onChangeText={setAccessKey}
          secureTextEntry={!showAccessKey}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={styles.showHideButton}
          onPress={() => setShowAccessKey(!showAccessKey)}
        >
          <Icon 
            name={showAccessKey ? 'eye-off' : 'eye'} 
            size={24} 
            color="#2196F3"
            style={{ alignSelf: 'center', marginTop: 15 }}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  showHideButton: {
    position: 'absolute',
    right: 35,
    top: 132,
    padding: 5,
  },
});

export default LoginScreen; 