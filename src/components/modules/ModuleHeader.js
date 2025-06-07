import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";

const ModuleHeader = ({ moduleName, navigation }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{moduleName}</Text>
        <Text style={styles.subtitle}>
          Manage your {moduleName.toLowerCase()} records
        </Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("CreateScreen", { moduleName })}
      >
        <Icon name="add" size={22} color="#ffffff" />
        <Text style={styles.addButtonText}>
          New {moduleName}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ModuleHeader; 