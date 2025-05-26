import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const Footer = ({ navigation }) => {
  const route = useRoute();
  
  return (
    <View style={styles.footer}>
      <TouchableOpacity 
        style={[
          styles.button,
          route.name === 'Home' && styles.activeButton
        ]} 
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={[
          styles.buttonText,
          route.name === 'Home' && styles.activeButtonText
        ]}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.button,
          route.name === 'Profile' && styles.activeButton
        ]} 
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={[
          styles.buttonText,
          route.name === 'Profile' && styles.activeButtonText
        ]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#e8f5fe',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  activeButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default Footer; 