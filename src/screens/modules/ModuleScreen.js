import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Table, Row, Rows } from 'react-native-table-component';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getModuleData } from '../../services/api/modules/crud/indexAPI';

const ModuleScreen = ({ route, navigation }) => {
  const { moduleName } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [tableHead, setTableHead] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getModuleData(moduleName);

        setData(result);

        if (result && Array.isArray(result) && result.length > 0) {
          // Get field labels from the first record's fields
          const headers = result[0].fields.map(field => field.label);
          setTableHead(headers);
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
  }, [moduleName]);

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

  const renderTable = () => {
    if (!filteredData || filteredData.length === 0) {
      return <Text style={styles.placeholder}>No data available for {moduleName}.</Text>;
    }

    const tableData = filteredData.map(item => {
      // Map each field value in the correct order based on tableHead
      return tableHead.map(header => {
        const field = item.fields.find(f => f.label === header);
        return field ? String(field.value || 'null') : 'null';
      });
    });

    return (
      <Table borderStyle={styles.tableBorder}>
        <Row data={tableHead} style={styles.tableHead} textStyle={styles.tableHeadText} />
        <Rows data={tableData} textStyle={styles.tableRowText} />
      </Table>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{moduleName}</Text>
          <Text style={styles.subtitle}>Manage your {moduleName.toLowerCase()} here</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${moduleName}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
        
        <View style={styles.moduleContentContainer}>
          {!loading && !error && data && renderTable()}
          {!loading && !error && !data && (
            <Text style={styles.placeholder}>{moduleName} content coming soon...</Text>
          )}
        </View>
      </ScrollView>
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Lighter background for a modern feel
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff', // White background for header section
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6', // Lighter border color
    alignItems: 'center',
  },
  title: {
    fontSize: 26, // Slightly reduced for balance
    fontWeight: '600', // Medium weight for modern text
    color: '#212529', // Darker, more professional text color
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 15, // Slightly reduced
    color: '#6c757d', // Softer subtitle color
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  searchInput: {
    height: 45,
    backgroundColor: '#f1f3f5', // Light grey for input background
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#ced4da' // Subtle border for the input
  },
  moduleContentContainer: {
    flex: 1,
    padding: 10, // Uniform padding
  },
  loader: {
    marginTop: 30,
  },
  placeholder: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545', // Standard error color
    textAlign: 'center',
    padding: 20,
  },
  // Table Styles
  tableBorder: {
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  tableHead: {
    height: 50,
    backgroundColor: '#e9ecef', // Light header background
  },
  tableHeadText: {
    margin: 8,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    color: '#343a40', // Darker header text
  },
  tableRowText: {
    margin: 8,
    textAlign: 'left', // Align text to left for readability
    fontSize: 14,
    color: '#495057', // Slightly lighter row text
  },
});

export default ModuleScreen; 