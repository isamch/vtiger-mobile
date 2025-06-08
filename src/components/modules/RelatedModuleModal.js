import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
  TextInput,
  PanResponder,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getModuleIcon } from '../../utils/moduleUtils';

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
  navigation,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [modalHeight, setModalHeight] = useState(SCREEN_HEIGHT * 0.8);
  const initialModalHeight = useRef(SCREEN_HEIGHT * 0.8);
  const heightAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.8)).current;
  const [expandedRecords, setExpandedRecords] = useState({});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        heightAnim.setOffset(modalHeight);
        heightAnim.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = initialModalHeight.current - gestureState.dy;
        if (newHeight > SCREEN_HEIGHT * 0.3 && newHeight < SCREEN_HEIGHT * 0.9) {
          heightAnim.setValue(-gestureState.dy);
        } else if (newHeight <= SCREEN_HEIGHT * 0.3) {
          heightAnim.setValue(-(SCREEN_HEIGHT * 0.8 - SCREEN_HEIGHT * 0.3));
        } else if (newHeight >= SCREEN_HEIGHT * 0.9) {
          heightAnim.setValue(-(SCREEN_HEIGHT * 0.8 - SCREEN_HEIGHT * 0.9));
        }
      },
      onPanResponderRelease: () => {
        heightAnim.flattenOffset();
        const currentHeight = heightAnim._value;
        if (currentHeight > SCREEN_HEIGHT * 0.3 && currentHeight < SCREEN_HEIGHT * 0.9) {
          setModalHeight(currentHeight);
        } else if (currentHeight <= SCREEN_HEIGHT * 0.3) {
          setModalHeight(SCREEN_HEIGHT * 0.3);
        } else {
          setModalHeight(SCREEN_HEIGHT * 0.9);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      heightAnim.setValue(modalHeight);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Reset heightAnim to initialModalHeight when modal closes
      heightAnim.setValue(initialModalHeight.current);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const formatValue = (field) => {
    if (!field || !field.value || field.value === '') return 'Not set';
    
    switch (field.type) {
      case 'date':
        return new Date(field.value).toLocaleDateString();
      case 'datetime':
        return new Date(field.value).toLocaleString();
      case 'time':
        return field.value;
      case 'boolean':
        return field.value === 'yes' ? 'Yes' : 'No';
      case 'owner':
      case 'reference':
        return field.userMap?.[field.value] || field.value;
      case 'picklist':
        return field.value;
      default:
        return String(field.value);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#64748b';
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('closed')) return '#10b981';
    if (statusLower.includes('pending') || statusLower.includes('in progress')) return '#f59e0b';
    if (statusLower.includes('cancelled') || statusLower.includes('failed')) return '#ef4444';
    return '#64748b';
  };

  const renderRecord = (record, toggleExpand, isExpanded) => {
    if (!record || !Array.isArray(record)) {
      console.warn('Invalid record format:', record);
      return null;
    }

    const subjectField = record.find(f => f && f.fieldname === 'subject');
    const statusField = record.find(f => f && (f.fieldname === 'taskstatus' || f.fieldname === 'eventstatus' || f.fieldname === 'leadstatus' || f.fieldname === 'opportunity_stage'));
    const dateField = record.find(f => f && (f.fieldname === 'date_start' || f.fieldname === 'createdtime' || f.fieldname === 'date_end' || f.fieldname === 'due_date'));
    const assignedField = record.find(f => f && f.fieldname === 'assigned_user_id');
    const descriptionField = record.find(f => f && f.fieldname === 'description');
    const recordId = record.find(f => f && f.fieldname === 'id')?.value || Math.random().toString();

    const fieldsToExclude = new Set([
      'id',
      'subject',
      'description',
      'createdtime',
      'modifiedtime',
      'date_start',
      'date_end',
      'due_date',
      'time_start',
      'time_end',
      'assigned_user_id',
      'taskstatus',
      'eventstatus',
      'leadstatus',
      'opportunity_stage',
    ]);

    const filteredFields = record.filter(f => f && !fieldsToExclude.has(f.fieldname));
    const displayedFields = isExpanded ? filteredFields : filteredFields.slice(0, 6);

    return (
      <View key={recordId} style={styles.recordBlock}>
        <View style={styles.recordHeader}>
          <View style={styles.recordHeaderLeft}>
            <View style={styles.recordIcon}>
              <Icon name={getModuleIcon(relatedModule)} size={20} color="#2196F3" />
            </View>
            <View style={styles.recordHeaderInfo}>
              <Text style={styles.recordTitle} numberOfLines={1}>{subjectField?.value || 'Untitled Record'}</Text>
              {dateField && (
                <Text style={styles.recordSubtitle}>{formatValue(dateField)}</Text>
              )}
            </View>
          </View>
          {statusField && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(statusField.value) }]}>
              <Text style={styles.statusText}>{statusField.value}</Text>
            </View>
          )}
        </View>

        <View style={styles.recordContent}>
          {descriptionField?.value && (
            <Text style={styles.recordDescription}>
              {descriptionField.value}
            </Text>
          )}
          
          <View style={styles.recordFieldsGrid}>
            {displayedFields.map((field, fieldIndex) => (
              <View key={fieldIndex} style={styles.recordGridField}>
                <Text style={styles.recordGridFieldLabel}>{field.label}</Text>
                <Text style={[styles.recordGridFieldValue, !field.value && styles.emptyValue]}>
                  {formatValue(field)}
                </Text>
              </View>
            ))}
          </View>

          {filteredFields.length > 6 && (
            <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
              <Text style={styles.expandButtonText}>
                {isExpanded ? "View less fields" : `View ${filteredFields.length - 6} more fields`}
              </Text>
              <Icon name={isExpanded ? "expand-less" : "expand-more"} size={16} color="#2196F3" />
            </TouchableOpacity>
          )}

          <View style={styles.recordFooter}>
            {assignedField && (
              <View style={styles.assignedInfo}>
                <Icon name="person" size={16} color="#64748b" />
                <Text style={styles.assignedText}>
                  Assigned To: {formatValue(assignedField)}
                </Text>
              </View>
            )}
            <View style={styles.recordActions}>
          
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("ViewScreen", { moduleName: relatedModule, recordId })}
              >
                <Icon name="visibility" size={16} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('EditScreen', { moduleName: relatedModule, recordId })}
              >
                <Icon name="edit" size={16} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => console.log('Share', recordId)}>
                <Icon name="share" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const filteredData = Array.isArray(data) ? data.filter(record => {
    if (!searchQuery) return true;
    if (!Array.isArray(record)) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return record.some(field => 
      field && 
      String(field.value || '').toLowerCase().includes(searchLower) ||
      String(field.label || '').toLowerCase().includes(searchLower)
    );
  }) : [];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loaderText}>Loading data...</Text>
        </View>
      );
    }

    if (!Array.isArray(data)) {
      console.warn('Data is not an array:', data);
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Invalid data format</Text>
        </View>
      );
    }

    if (error || error?.message) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.emptyText}>Error loading data</Text>
          <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
            {error?.response?.data?.message || error?.message || 'An unexpected error occurred'}
          </Text>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
            There are no records to display for this module.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.dataContainer}>
          {filteredData.map(record => {
            const recordId = record.find(f => f && f.fieldname === 'id')?.value || Math.random().toString();
            const isExpanded = expandedRecords[recordId] || false;
            const toggleExpand = () => {
              setExpandedRecords(prev => ({
                ...prev,
                [recordId]: !prev[recordId]
              }));
            };
            return renderRecord(record, toggleExpand, isExpanded);
          })}
        </View>
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.modalContainer,
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
          <Animated.View
            style={[
              styles.modalContent,
              { height: heightAnim }
            ]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={(e) => e.stopPropagation()}
          >
            <View {...panResponder.panHandlers} style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{relatedModule}</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search records..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Icon name="close" size={20} color="#64748b" />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.contentContainer}>
              {renderContent()}
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragHandle: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  dataContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  recordBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordHeaderInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  recordSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  recordDate: {
    fontSize: 12,
    color: '#64748b',
  },
  recordContent: {
    padding: 16,
  },
  recordDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  recordFieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 12,
  },
  recordGridField: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  recordGridFieldLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  recordGridFieldValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  emptyValue: {
    fontStyle: 'italic',
    color: '#9ca3af',
  },
  recordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 12,
  },
  assignedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
  },
  recordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default RelatedModuleModal; 