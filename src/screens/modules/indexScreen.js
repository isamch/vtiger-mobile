import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getModuleData } from '../../services/api/modules/crud/indexAPI';
import Icon from 'react-native-vector-icons/MaterialIcons';

import RefreshableScrollView from '../../components/RefreshableScrollView';


const IndexScreen = ({ route, navigation }) => {
  const { moduleName } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const toggleRow = (index) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

 
  useEffect(() => {
    const fetchData = async () => {
      try {
    
        setLoading(true);    
        setError(null);
        
        const result = await getModuleData(moduleName);

        setData(result);

        if (result && Array.isArray(result) && result.length > 0) {
          setFilteredData(result);
        } else {
          setFilteredData([]);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, [moduleName, refreshing]);


  useEffect(() => {
    if (data && Array.isArray(data)) {
      if (searchQuery === '') {
        setFilteredData(data);
      } else {
        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = data.filter(item => {
          return item.fields.some(field => {
            const value = String(field.value || '').toLowerCase();
            return value.includes(lowercasedQuery);
          });
        });
        setFilteredData(filtered);
      }
    } else {
      setFilteredData([]);
    }
  }, [searchQuery, data]);

  
  const renderRecordDetails = (item) => {
    const detailFields = item.fields;

    return (
      <View style={styles.detailsContainer}>
        {detailFields.map((field, idx) => {
          let displayValue = field.value;
          
          if (field.fieldname === 'assigned_user_id' && field.userMap) {
            displayValue = field.userMap[field.value] || field.value;
          }

          displayValue = displayValue === null || displayValue === undefined || displayValue === '' ? 
            <Text style={{color: '#999', fontStyle: 'italic'}}>Not set</Text> : 
            String(displayValue);

          return (
            <View key={idx} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{field.label}:</Text>
              <Text style={styles.detailValue}>{displayValue}</Text>
            </View>
          );
        })}

        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => navigation.navigate('UserDetails', { userId: item.id })}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Icon name="arrow-forward" size={20} color="#0ea5e9" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecordRow = (item, index) => {
    const mainField = item.fields.find(f => f.value) || { value: '?' };
    const mainLabel = String(mainField.value);
    const initial = mainLabel.charAt(0).toUpperCase();
    const isExpanded = expandedRows.has(index);

    return (
      <View key={index}>
        <TouchableOpacity 
          style={[
            styles.recordRow,
            index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
            index === filteredData.length - 1 && !isExpanded && styles.tableRowLast
          ]}
          onPress={() => toggleRow(index)}
        >
          <View style={styles.recordRowContent}>
            <View style={styles.recordInfo}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <Text style={styles.recordLabel}>{mainLabel}</Text>
            </View>
            <View style={styles.assignedToContainer}>
              <Text style={styles.assignedToLabel}>Assigned to:</Text>
              <Text style={styles.assignedToValue}>
                {item.fields.find(f => f.fieldname === 'assigned_user_id')?.userMap?.[item.fields.find(f => f.fieldname === 'assigned_user_id')?.value] || 
                 item.fields.find(f => f.fieldname === 'assigned_user_id')?.value || 
                 'Unassigned'}
              </Text>
            </View>
            <Icon 
              name="chevron-right" 
              size={24} 
              color="#94a3b8" 
              style={[
                styles.chevron,
                isExpanded && styles.chevronExpanded
              ]}
            />
          </View>
        </TouchableOpacity>
        {isExpanded && renderRecordDetails(item)}
      </View>
    );
  };

  const renderTable = () => {
    if (!filteredData || filteredData.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Icon name="inbox" size={50} color="#cbd5e1" />
          <Text style={styles.placeholder}>No data available for {moduleName}.</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        <ScrollView>
          {filteredData.map((item, index) => renderRecordRow(item, index))}
        </ScrollView>
        <View style={styles.tableFooter}>
          <Text style={styles.tableFooterText}>
            {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <RefreshableScrollView
        style={styles.content}
        onRefresh={()=> setRefreshing(!refreshing) }
      >

      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{moduleName}</Text>
            <Text style={styles.subtitle}>Manage your {moduleName.toLowerCase()} here</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>New {moduleName}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${moduleName}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <ScrollView style={styles.tableWrapper}>
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.loaderText}>Loading {moduleName}...</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={24} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.moduleContentContainer}>
            {!loading && !error && renderTable()}
          </View>
        </ScrollView>
      </View>

      </RefreshableScrollView>
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#1e293b',
    padding: 0,
  },
  tableWrapper: {
    flex: 1,
  },
  moduleContentContainer: {
    flex: 1,
    padding: 16,
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 2,
  },
  recordRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  recordRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  recordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  recordLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8fafc',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tableFooterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'right',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeholder: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#ef4444',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  detailsContainer: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: '#334155',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
    marginRight: 8,
  },
  assignedToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  assignedToLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 4,
  },
  assignedToValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default IndexScreen; 