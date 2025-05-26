import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ModuleCard = ({ name, icon, color, count, onPress }) => {
  return (
    <TouchableOpacity style={styles.moduleCard} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text style={styles.moduleName}>{name}</Text>
      
      {/* <Text style={styles.moduleCount}>{count}</Text> */}

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onPress}
      >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[{ color: color }]}>View Details </Text>
            <Ionicons name="chevron-forward" size={14} color={color} />
          </View>

      </TouchableOpacity>


    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  moduleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  moduleCount: {
    fontSize: 14,
    color: '#666',
  },
});

export default ModuleCard; 