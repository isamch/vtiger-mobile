import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo or have react-native-vector-icons installed

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
        <Ionicons 
          name={route.name === 'Home' ? 'home' : 'home-outline'} 
          size={24} 
          color={route.name === 'Home' ? '#2196F3' : '#333'} 
        />
        {/* <Text style={[
          styles.buttonText,
          route.name === 'Home' && styles.activeButtonText
        ]}>Home</Text> */}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.button,
          route.name === 'Profile' && styles.activeButton
        ]} 
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons 
          name={route.name === 'Profile' ? 'person' : 'person-outline'} 
          size={24} 
          color={route.name === 'Profile' ? '#2196F3' : '#333'} 
        />
        {/* <Text style={[
          styles.buttonText,
          route.name === 'Profile' && styles.activeButtonText
        ]}>Profile</Text> */}
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    // Removed absolute positioning to prevent content overlap
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  button: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  activeButton: {
    backgroundColor: '#e8f5fe',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  activeButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default Footer;