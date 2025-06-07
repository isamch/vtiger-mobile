import React from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";

const ViewControls = ({
  viewMode,
  setViewMode,
  sortOrder,
  setSortOrder,
  toggleFilters,
  filterIconRotation,
}) => {
  const iconRotation = filterIconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.viewControlsContainer}>
      <View style={styles.viewControlsLeft}>
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === "cards" && styles.viewToggleButtonActive]}
            onPress={() => setViewMode("cards")}
          >
            <Icon name="view-agenda" size={16} color={viewMode === "cards" ? "#ffffff" : "#64748b"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === "table" && styles.viewToggleButtonActive]}
            onPress={() => setViewMode("table")}
          >
            <Icon name="view-list" size={16} color={viewMode === "table" ? "#ffffff" : "#64748b"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === "timeline" && styles.viewToggleButtonActive]}
            onPress={() => setViewMode("timeline")}
          >
            <Icon name="timeline" size={16} color={viewMode === "timeline" ? "#ffffff" : "#64748b"} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewControlsRight}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <Icon name={sortOrder === "asc" ? "arrow-upward" : "arrow-downward"} size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
          <Icon name="filter-list" size={16} color="#64748b" />
          <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
            <Icon name="chevron-right" size={16} color="#64748b" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  viewControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  viewControlsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  viewToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  viewToggleButtonActive: {
    backgroundColor: "#2196F3",
  },
  viewControlsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    gap: 4,
  },
});

export default ViewControls; 