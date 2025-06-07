import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Icon from "react-native-vector-icons/MaterialIcons";
import { getModuleIcon, getModuleColor, getStatusBadgeStyle, getStatusTextStyle, getDisplayValue } from '../../../utils/moduleUtils';
import { getRelatedModuleData } from '../../../services/api/modules/crud/relatedModulesAPI';
import RelatedModuleModal from '../RelatedModuleModal';

const CardView = ({ 
  data, 
  navigation, 
  moduleName, 
  expandedCards, 
  toggleCard 
}) => {
  // Add state for tracking section heights
  const [sectionHeights, setSectionHeights] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLeftSectionLayout = (index, event) => {
    const { height } = event.nativeEvent.layout;
    setSectionHeights(prev => ({
      ...prev,
      [index]: height
    }));
  };

  const handleModulePress = async (module, recordId) => {
    try {
      setModalVisible(true);
      setSelectedModule(module);
      setLoading(true);
      setModalData([]); 

      const relatedData = await getRelatedModuleData(moduleName, recordId, module);
      
      console.log('Related data received:', relatedData);
      
      if (Array.isArray(relatedData)) {
        setModalData(relatedData);
      } else {
        console.error('Invalid data format received:', relatedData);
        setModalData([]);
      }
    } catch (error) {
      console.error('Error loading related module:', error);
      setModalData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.cardsContainer}>
      {data.map((item, index) => {
        const mainField = item.fields.find((f) => f.value) || { value: "?" }
        const mainLabel = String(mainField.value)
        const statusField = item.fields.find((f) => f.fieldname && f.fieldname.includes("status"))
        const dateField = item.fields.find((f) => f.type === "date" || f.type === "datetime")
        const assignedField = item.fields.find((f) => f.fieldname === "assigned_user_id")
        const recordId = item.fields.find((f) => f.fieldname === "id")?.value
        const isExpanded = expandedCards.has(index)
        const relatedModules = item.relatedModules || []

        return (
          <View key={index} style={styles.cardContainer}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIcon}>
                  <Icon name={getModuleIcon(moduleName)} size={20} color="#2196F3" />
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {mainLabel}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {dateField ? getDisplayValue(dateField) : `Record ${index + 1}`}
                  </Text>
                </View>
              </View>
              <View style={styles.cardHeaderRight}>
                {statusField && (
                  <View style={[styles.statusBadge, getStatusBadgeStyle(statusField.value)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(statusField.value)]}>
                      {statusField.value}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Card Content with Side-by-Side Layout */}
            <View style={styles.cardContentWrapper}>
              {/* Left Side - Record Details */}
              <View 
                style={styles.cardDetailsSection}
                onLayout={(event) => handleLeftSectionLayout(index, event)}
              >
                <View style={styles.fieldsGrid}>
                  {(isExpanded ? item.fields : item.fields.slice(0, 6)).map((field, fieldIndex) => {
                    if (field.fieldname === "id") return null

                    return (
                      <View key={fieldIndex} style={styles.gridField}>
                        <Text style={styles.gridFieldLabel}>{field.label}</Text>
                        <Text style={[styles.gridFieldValue, !field.value && styles.emptyValue]} numberOfLines={2}>
                          {getDisplayValue(field)}
                        </Text>
                      </View>
                    )
                  })}
                </View>

                {/* Expandable Details */}
                {item.fields.length > 6 && (
                  <TouchableOpacity style={styles.expandButton} onPress={() => toggleCard(index)}>
                    <Text style={styles.expandButtonText}>
                      {isExpanded ? "Show less" : `View ${item.fields.length - 6} more fields`}
                    </Text>
                    <Icon name={isExpanded ? "expand-less" : "expand-more"} size={16} color="#2196F3" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Right Side - Related Modules */}
              {relatedModules.length > 0 && (
                <View 
                  style={[
                    styles.relatedModulesSection,
                    { maxHeight: sectionHeights[index] || 'auto' }
                  ]}
                >
                  <ScrollView
                    style={styles.relatedModulesScroll}
                    contentContainerStyle={styles.relatedModulesList}
                    showsVerticalScrollIndicator={false}
                  >
                    {relatedModules.map((module, moduleIndex) => {
                      const moduleColor = getModuleColor(module)
                      return (
                        <TouchableOpacity
                          key={moduleIndex}
                          style={[styles.relatedModuleButton, { borderColor: moduleColor }]}
                          onPress={() => handleModulePress(module, recordId)}
                        >
                          <Icon
                            name={getModuleIcon(module)}
                            size={18}
                            color={moduleColor}
                            style={styles.relatedModuleIcon}
                          />
                          <Text style={[styles.relatedModuleText, { color: moduleColor }]}>
                            {module}
                          </Text>
                          <Icon name="chevron-right" size={16} color={moduleColor} />
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.cardFooterLeft}>
                {assignedField && (
                  <View style={styles.assignedInfo}>
                    <Icon name="person" size={14} color="#64748b" />
                    <Text style={styles.assignedText}>
                      {assignedField.userMap?.[assignedField.value] || assignedField.value || "Unassigned"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("ViewScreen", { moduleName, recordId })}
                >
                  <Icon name="visibility" size={16} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("EditScreen", { moduleName, recordId })}
                >
                  <Icon name="edit" size={16} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="more-vert" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )
      })}

      <RelatedModuleModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setModalData([]);
          setSelectedModule('');
        }}
        relatedModule={selectedModule}
        data={modalData}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardsContainer: {
    gap: 12,
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  cardHeaderRight: {
    marginLeft: 12,
  },
  cardContentWrapper: {
    flexDirection: 'row',
  },
  cardDetailsSection: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  fieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  gridField: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  gridFieldLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  gridFieldValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  emptyValue: {
    fontStyle: "italic",
    color: "#9ca3af",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  expandButtonText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "500",
    marginRight: 4,
  },
  relatedModulesSection: {
    width: 200,
    backgroundColor: '#ffffff',
  },
  relatedModulesScroll: {
    flex: 1,
  },
  relatedModulesList: {
    padding: 8,
  },
  relatedModuleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  relatedModuleIcon: {
    marginRight: 8,
  },
  relatedModuleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  cardFooterLeft: {
    flex: 1,
  },
  assignedInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  assignedText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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

export default CardView; 