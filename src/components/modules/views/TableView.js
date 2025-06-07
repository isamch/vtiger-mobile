import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";
import { getStatusBadgeStyle, getStatusTextStyle, getDisplayValue } from '../../../utils/moduleUtils';

const TableView = ({ data, navigation, moduleName }) => {
  return (
    <View style={styles.tableContainer}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Name</Text>
        <Text style={styles.tableHeaderText}>Status</Text>
        <Text style={styles.tableHeaderText}>Date</Text>
        <Text style={styles.tableHeaderText}>Assigned</Text>
      </View>

      {/* Table Rows */}
      {data.map((item, index) => {
        const mainField = item.fields.find((f) => f.value) || { value: "?" }
        const mainLabel = String(mainField.value)
        const statusField = item.fields.find((f) => f.fieldname && f.fieldname.includes("status"))
        const dateField = item.fields.find((f) => f.type === "date" || f.type === "datetime")
        const assignedField = item.fields.find((f) => f.fieldname === "assigned_user_id")
        const recordId = item.fields.find((f) => f.fieldname === "id")?.value

        return (
          <TouchableOpacity
            key={index}
            style={styles.tableRow}
            onPress={() => navigation.navigate("ViewScreen", { moduleName, recordId })}
          >
            <Text style={styles.tableCell} numberOfLines={1}>
              {mainLabel}
            </Text>
            <View style={styles.tableCellStatus}>
              {statusField && (
                <View style={[styles.tableStatusBadge, getStatusBadgeStyle(statusField.value)]}>
                  <Text style={[styles.tableStatusText, getStatusTextStyle(statusField.value)]}>
                    {statusField.value}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.tableCell} numberOfLines={1}>
              {dateField ? getDisplayValue(dateField) : "-"}
            </Text>
            <Text style={styles.tableCell} numberOfLines={1}>
              {assignedField?.userMap?.[assignedField.value] || assignedField?.value || "-"}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
  },
  tableCellStatus: {
    flex: 1,
    justifyContent: "center",
  },
  tableStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  tableStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

export default TableView; 