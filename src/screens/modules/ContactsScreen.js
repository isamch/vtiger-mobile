import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const ContactsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Contacts</Text>
          <Text style={styles.subtitle}>Manage your contacts here</Text>
        </View>
        
        {/* Placeholder for contacts list - to be implemented */}
        <View style={styles.contactsContainer}>
          <Text style={styles.placeholder}>Contact list coming soon...</Text>
        </View>
      </ScrollView>
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
  },
  headerContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  contactsContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
});

export default ContactsScreen; 