import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";
import { getStatusBadgeStyle, getStatusTextStyle, getDisplayValue } from '../../../utils/moduleUtils';

const TimelineView = ({ data, navigation, moduleName }) => {
  return (
    <View style={styles.timelineContainer}>
      {data.map((item, index) => {
        const mainField = item.fields.find((f) => f.value) || { value: "?" }
        const mainLabel = String(mainField.value)
        const statusField = item.fields.find((f) => f.fieldname && f.fieldname.includes("status"))
        const dateField = item.fields.find((f) => f.type === "date" || f.type === "datetime")
        const recordId = item.fields.find((f) => f.fieldname === "id")?.value

        return (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <View style={[styles.timelineDotInner, getStatusBadgeStyle(statusField?.value)]} />
            </View>
            <TouchableOpacity
              style={styles.timelineContent}
              onPress={() => navigation.navigate("ViewScreen", { moduleName, recordId })}
            >
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineTitle}>{mainLabel}</Text>
                <Text style={styles.timelineDate}>{dateField ? getDisplayValue(dateField) : "No date"}</Text>
              </View>
              <View style={styles.timelineDetails}>
                {item.fields.slice(0, 3).map((field, fieldIndex) => {
                  if (field.fieldname === "id") return null

                  return (
                    <Text key={fieldIndex} style={styles.timelineDetail}>
                      {field.label}: {getDisplayValue(field)}
                    </Text>
                  )
                })}
              </View>
              {statusField && (
                <View style={styles.timelineStatus}>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(statusField.value)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(statusField.value)]}>
                      {statusField.value}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    padding: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
    marginRight: 16,
    marginTop: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  timelineDetails: {
    gap: 4,
  },
  timelineDetail: {
    fontSize: 14,
    color: "#64748b",
  },
  timelineStatus: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default TimelineView; 