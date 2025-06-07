import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";

const ModuleSearch = ({ moduleName, searchQuery, setSearchQuery }) => {
  return (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search in ${moduleName}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Icon name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#1e293b",
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default ModuleSearch; 