import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

const FilterPanel = ({ 
  filterPanelHeight, 
  sortBy, 
  setSortBy 
}) => {
  return (
    <Animated.View style={[styles.filterPanel, { height: filterPanelHeight }]}>
      <View style={styles.filterPanelContent}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Sort by</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterOption, sortBy === "id" && styles.filterOptionActive]}
              onPress={() => setSortBy("id")}
            >
              <Text style={[styles.filterOptionText, sortBy === "id" && styles.filterOptionTextActive]}>ID</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterOption, sortBy === "name" && styles.filterOptionActive]}
              onPress={() => setSortBy("name")}
            >
              <Text style={[styles.filterOptionText, sortBy === "name" && styles.filterOptionTextActive]}>Name</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterOption, sortBy === "date" && styles.filterOptionActive]}
              onPress={() => setSortBy("date")}
            >
              <Text style={[styles.filterOptionText, sortBy === "date" && styles.filterOptionTextActive]}>Date</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Status</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Closed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  filterPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPanelContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterOptionActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  filterOptionTextActive: {
    color: "#ffffff",
  },
});

export default FilterPanel; 