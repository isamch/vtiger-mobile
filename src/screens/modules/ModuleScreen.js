import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const ModuleScreen = ({ route, navigation }) => {
  const { moduleName } = route.params;

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{moduleName}</Text>
          <Text style={styles.subtitle}>Manage your {moduleName.toLowerCase()} here</Text>
        </View>

        {/* Placeholder for module content - to be implemented */}
        <View style={styles.moduleContentContainer}>
          <Text style={styles.placeholder}>{moduleName} content coming soon...</Text>
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
  moduleContentContainer: {
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

export default ModuleScreen; 