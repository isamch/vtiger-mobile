import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Footer from '../../components/Footer';
import Header from '../../components/Header';

const ProfileScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.profileText}>Profile Screen</Text>
      </View>
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default ProfileScreen; 