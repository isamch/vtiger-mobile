import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import ModuleCard from '../../components/ModuleCard';

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const popularModules = [
    {
      id: 1,
      name: 'Contacts',
      icon: 'people',
      color: '#4CAF50',
      count: '250+',
    },
    {
      id: 2,
      name: 'Accounts',
      icon: 'business',
      color: '#2196F3',
      count: '180+',
    },
    {
      id: 3,
      name: 'ServiceContracts',
      icon: 'document-text',
      color: '#FF9800',
      count: '120+',
    },
    {
      id: 4,
      name: 'Opportunities',
      icon: 'trending-up',
      color: '#9C27B0',
      count: '90+',
    },
  ];

  const filteredModules = popularModules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search modules..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Popular Modules Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Popular Modules</Text>
          <View style={styles.modulesGrid}>
            {filteredModules.map(module => (
              <ModuleCard
                key={module.id}
                name={module.name}
                icon={module.icon}
                color={module.color}
                count={module.count}
                onPress={() => navigation.navigate(module.name)}
              />
            ))}
          </View>
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
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});

export default HomeScreen; 