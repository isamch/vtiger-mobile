import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RelatedModuleModal = ({
  visible,
  onClose,
  relatedModule,
  data,
  loading,
  error,
  refreshing,
  onRefresh,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [visible]);

  const formatFieldValue = (field) => {
    const { type, value, userMap } = field;
    
    if (!value || value === '') return 'Not set';

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'time':
        return value;
      case 'boolean':
        return value === 'yes' ? 'Yes' : 'No';
      case 'owner':
        return userMap?.[value] || value;
      case 'picklist':
        return value;
      case 'reference':
        return value || 'Not linked';
      case 'integer':
        return value === 'no' ? 'No' : value;
      default:
        return String(value);
    }
  };

  const getImportantFields = (record) => {
    if (!Array.isArray(record)) return [];
    
    const importantFieldNames = [
      'subject',
      'assigned_user_id',
      'date_start',
      'taskstatus',
      'eventstatus',
      'activitytype',
    ];
    return record.filter(field => importantFieldNames.includes(field.fieldname));
  };

  const getStatusField = (record) => {
    if (!Array.isArray(record)) return null;
    
    return record.find(field => 
      field.fieldname === 'taskstatus' || 
      field.fieldname === 'eventstatus' ||
      field.fieldname.toLowerCase().includes('status')
    );
  };

  const getStatusStyle = (status) => {
    if (!status) return styles.statusDefault;

    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('closed') || statusLower.includes('held')) {
      return styles.statusSuccess;
    }
    if (statusLower.includes('pending') || statusLower.includes('planned')) {
      return styles.statusWarning;
    }
    if (statusLower.includes('deferred') || statusLower.includes('cancelled')) {
      return styles.statusDanger;
    }
    return styles.statusDefault;
  };

  const createUniqueKey = (field, index) => {
    const base = field.fieldname || 'field';
    const label = field.label || '';
    const value = field.value || '';
    return `${base}-${label}-${value}-${index}`;
  };

  const renderField = (field, index) => {
    if (!field || field.fieldname === 'id') return null;

    let displayValue = field.value;
    if (!displayValue || displayValue === '') {
      displayValue = 'Not set';
    } else if (field.type === 'date') {
      displayValue = new Date(field.value).toLocaleDateString();
    } else if (field.type === 'datetime') {
      displayValue = new Date(field.value).toLocaleString();
    } else if (field.type === 'owner' && field.userMap) {
      displayValue = field.userMap[field.value] || field.value;
    }

    return (
      <View key={createUniqueKey(field, index)} style={styles.field}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <Text style={styles.fieldValue}>{displayValue}</Text>
      </View>
    );
  };

  const renderRecord = (record) => {
    if (!Array.isArray(record) || record.length === 0) return null;

    const importantFields = getImportantFields(record);
    const statusField = getStatusField(record);
    const recordId = record.find(field => field.fieldname === 'id')?.value;
    const subjectField = record.find(field => field.fieldname === 'subject');

    return (
      <View key={recordId} style={styles.recordContainer}>
        <View style={styles.recordHeader}>
          <View style={styles.recordTitleContainer}>
            <Text style={styles.recordTitle} numberOfLines={1}>
              {subjectField ? formatFieldValue(subjectField) : `Record #${recordId}`}
            </Text>
            {statusField && (
              <View style={[styles.statusBadge, getStatusStyle(statusField.value)]}>
                <Text style={styles.statusText}>
                  {formatFieldValue(statusField)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onUpdate(recordId, record)}
            >
              <Icon name="edit" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(recordId)}
            >
              <Icon name="delete" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.importantFieldsContainer}>
          {importantFields.map((field, index) => renderField(field, index))}
        </View>

        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => console.log('Show all fields')}
        >
          <Text style={styles.expandButtonText}>
            Show all fields
          </Text>
          <Icon name="expand-more" size={16} color="#2196F3" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    console.log('Rendering modal content:', {
      loading,
      error,
      dataLength: data?.length,
      data
    });

    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading {relatedModule}...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Ensure data is in the correct format
    const records = Array.isArray(data) ? data : [];
    
    if (records.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Icon name="inbox" size={48} color="#94a3b8" />
          <Text style={styles.emptyText}>No related {relatedModule} found</Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={onAdd}>
            <Icon name="add-circle" size={20} color="#fff" />
            <Text style={styles.addFirstButtonText}>Add First Record</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
      >
        {records.map((record, index) => {
          // If record is an array of fields, use it directly
          const fields = Array.isArray(record) ? record : [record];
          console.log('Rendering record:', { index, fields });
          return renderRecord(fields);
        })}

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdd}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add New {relatedModule}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Icon 
                name={getModuleIcon(relatedModule)} 
                size={24} 
                color="#2196F3" 
                style={styles.modalIcon}
              />
              <Text style={styles.modalTitle}>Related {relatedModule}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            {renderContent()}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const getModuleIcon = (moduleName) => {
  const iconMap = {
    Calendar: "event",
    Contacts: "person",
    Potentials: "trending-up",
    HelpDesk: "support",
    Invoice: "receipt",
    Quotes: "description",
    Products: "inventory",
    Project: "work",
    Assets: "business-center",
    Campaigns: "campaign",
    Documents: "folder",
    Emails: "email",
    SalesOrder: "shopping-cart",
    Services: "build",
    Leads: "person-add",
    Accounts: "business",
    Tasks: "assignment",
    Events: "event-note",
  };
  return iconMap[moduleName] || "folder";
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    maxHeight: '90%',
  },
  contentContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  recordContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  importantFieldsContainer: {
    marginBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  statusSuccess: {
    backgroundColor: '#10b981',
  },
  statusWarning: {
    backgroundColor: '#f59e0b',
  },
  statusDanger: {
    backgroundColor: '#ef4444',
  },
  statusDefault: {
    backgroundColor: '#64748b',
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default RelatedModuleModal; 