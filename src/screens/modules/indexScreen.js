"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
} from "react-native"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import { getModuleData } from "../../services/api/modules/crud/indexAPI"
import Icon from "react-native-vector-icons/MaterialIcons"
import { convertUTCToLocal, formatDate } from "../../utils/dateTimeUtils"
import {
  ModuleHeader,
  ModuleSearch,
  ViewControls,
  FilterPanel,
  CardView,
  TableView,
  TimelineView,
} from "../../components/modules"
import RelatedModuleModal from '../../components/modules/RelatedModuleModal';

const { width, height } = Dimensions.get("window")

const IndexScreen = ({ route, navigation }) => {
  const { moduleName } = route.params
  const sessionName = '733a613968437d8d51372'; // This should come from your auth context/state

  // Data states
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [mainContentHeight, setMainContentHeight] = useState(0)

  // UI states
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [viewMode, setViewMode] = useState("cards") // 'cards', 'table', 'timeline'
  const [styleMode, setStyleMode] = useState("classic") // 'modern', 'classic'
  const [sortBy, setSortBy] = useState("id")
  const [sortOrder, setSortOrder] = useState("desc")
  const [showFilters, setShowFilters] = useState(false)
  const [showRelatedModules, setShowRelatedModules] = useState(new Set())
  const [showFAB, setShowFAB] = useState(false)
  const [fabExpanded, setFabExpanded] = useState(false)

  // Animation states
  const filterPanelHeight = useState(new Animated.Value(0))[0]
  const filterIconRotation = useState(new Animated.Value(0))[0]

  // Add state for related module modal
  const [relatedModuleVisible, setRelatedModuleVisible] = useState(false);
  const [selectedRelatedModule, setSelectedRelatedModule] = useState('');
  const [relatedModuleData, setRelatedModuleData] = useState([]);
  const [relatedModuleLoading, setRelatedModuleLoading] = useState(false);
  const [relatedModuleError, setRelatedModuleError] = useState(null);
  const [currentRecordId, setCurrentRecordId] = useState(null);

  const toggleRow = (index) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index)
    } else {
      newExpandedRows.add(index)
    }
    setExpandedRows(newExpandedRows)
  }

  const toggleCard = (index) => {
    const newExpandedCards = new Set(expandedCards)
    if (newExpandedCards.has(index)) {
      newExpandedCards.delete(index)
    } else {
      newExpandedCards.add(index)
    }
    setExpandedCards(newExpandedCards)
  }

  const toggleFilters = () => {
    const newShowFilters = !showFilters
    setShowFilters(newShowFilters)

    Animated.parallel([
      Animated.timing(filterPanelHeight, {
        toValue: newShowFilters ? 120 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(filterIconRotation, {
        toValue: newShowFilters ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const result = await getModuleData(moduleName)
      setData(result)

      // Add test related modules data
      if (result && Array.isArray(result) && result.length > 0) {
        const testRelatedModules = ["Contacts", "Emails", "Tasks", "Calendar", "Documents"]
        const updatedResult = result.map((item, index) => ({
          ...item,
          relatedModules: testRelatedModules.slice(0, Math.min(5, testRelatedModules.length)),
        }))
        setFilteredData(updatedResult)
      } else {
        setFilteredData([])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [moduleName])

  useEffect(() => {
    if (data && Array.isArray(data)) {
      if (searchQuery === "") {
        setFilteredData(data)
      } else {
        const lowercasedQuery = searchQuery.toLowerCase()
        const filtered = data.filter((item) => {
          return item.fields.some((field) => {
            const value = String(field.value || "").toLowerCase()
            return value.includes(lowercasedQuery)
          })
        })
        setFilteredData(filtered)
      }
    } else {
      setFilteredData([])
    }
  }, [searchQuery, data])

  // Helper functions
  const getDisplayValue = (field) => {
    if (field.fieldname === "assigned_user_id" && field.userMap) {
      return field.userMap[field.value] || field.value
    }

    if (!field.value || field.value === "") {
      return styleMode === "modern" ? "Not set" : <Text style={styles.emptyValue}>Not set</Text>
    }

    switch (field.type) {
      case "boolean":
        return field.value === "1" ? "Yes" : "No"
      case "date":
        return formatDate(field.value)
      case "datetime":
        const utcString = field.value?.replace(" ", "T") + "Z"
        const date = new Date(utcString)
        if (isNaN(date.getTime())) {
          return String(field.value)
        }
        return date.toLocaleString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      case "time":
        return convertUTCToLocal(field.value)
      default:
        return String(field.value)
    }
  }

  const getStatusBadgeStyle = (status) => {
    if (!status) return styleMode === "modern" ? styles.statusDefault : null

    const statusLower = String(status).toLowerCase()
    if (statusLower.includes("completed") || statusLower.includes("closed") || statusLower.includes("won")) {
      return styles.statusSuccess
    }
    if (statusLower.includes("pending") || statusLower.includes("open") || statusLower.includes("in progress")) {
      return styles.statusWarning
    }
    if (statusLower.includes("cancelled") || statusLower.includes("failed") || statusLower.includes("lost")) {
      return styles.statusError
    }
    if (statusLower.includes("new") || statusLower.includes("draft")) {
      return styles.statusInfo
    }
    return styleMode === "modern" ? styles.statusDefault : null
  }

  const getStatusTextStyle = (status) => {
    if (!status) return styleMode === "modern" ? styles.statusTextDefault : null

    const statusLower = String(status).toLowerCase()
    if (statusLower.includes("completed") || statusLower.includes("closed") || statusLower.includes("won")) {
      return styles.statusTextSuccess
    }
    if (statusLower.includes("pending") || statusLower.includes("open") || statusLower.includes("in progress")) {
      return styles.statusTextWarning
    }
    if (statusLower.includes("cancelled") || statusLower.includes("failed") || statusLower.includes("lost")) {
      return styles.statusTextError
    }
    if (statusLower.includes("new") || statusLower.includes("draft")) {
      return styles.statusTextInfo
    }
    return styleMode === "modern" ? styles.statusTextDefault : null
  }

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
    }
    return iconMap[moduleName] || "folder"
  }

  const handleRelatedModuleClick = (record, relatedModule) => {
    const recordId = record.find(field => field.fieldname === 'id')?.value;
    if (recordId) {
      showRelatedModule(moduleName, recordId, relatedModule);
    }
  };

  const renderRelatedModuleButtons = (record) => {
    if (!record.relatedModules || record.relatedModules.length === 0) return null;

    return (
      <View style={styles.relatedModulesContainer}>
        <Text style={styles.relatedModulesTitle}>Related Modules:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {record.relatedModules.map((module) => (
            <TouchableOpacity
              key={module}
              style={styles.relatedModuleButton}
              onPress={() => handleRelatedModuleClick(record, module)}
            >
              <Icon name={getModuleIcon(module)} size={16} color="#fff" />
              <Text style={styles.relatedModuleButtonText}>{module}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loaderText}>Loading {moduleName}...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Icon name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!filteredData || filteredData.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Icon name="inbox" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No data found</Text>
          <Text style={styles.emptyStateText}>
            No {moduleName.toLowerCase()} records are available.
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.contentContainer}>
        <ViewControls
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          toggleFilters={toggleFilters}
          filterIconRotation={filterIconRotation}
        />

        <FilterPanel filterPanelHeight={filterPanelHeight} sortBy={sortBy} setSortBy={setSortBy} />

        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredData.length} {filteredData.length === 1 ? "record" : "records"} found
          </Text>
          {searchQuery.length > 0 && <Text style={styles.searchResultsText}>filtered by "{searchQuery}"</Text>}
        </View>

        {viewMode === "cards" && (
          <CardView
            data={filteredData}
            navigation={navigation}
            moduleName={moduleName}
            expandedCards={expandedCards}
            toggleCard={toggleCard}
          />
        )}
        {viewMode === "table" && <TableView data={filteredData} navigation={navigation} moduleName={moduleName} />}
        {viewMode === "timeline" && <TimelineView data={filteredData} navigation={navigation} moduleName={moduleName} />}
      </View>
    )
  }

  useEffect(() => {
    // Show FAB when we have data with related modules
    if (filteredData && filteredData.length > 0) {
      const hasRelatedModules = filteredData.some((item) => item.relatedModules && item.relatedModules.length > 0)
      setShowFAB(hasRelatedModules)
    } else {
      setShowFAB(false)
    }
  }, [filteredData])

  const showRelatedModule = async (parentModule, recordId, relatedModule) => {
    try {
      setRelatedModuleVisible(true);
      setSelectedRelatedModule(relatedModule);
      setRelatedModuleLoading(true);
      setRelatedModuleError(null);
      setCurrentRecordId(recordId);

      const relatedData = await getRelatedModuleData(parentModule, recordId, relatedModule);
      
      if (Array.isArray(relatedData)) {
        setRelatedModuleData(relatedData);
      } else {
        console.error('Invalid related module data format:', relatedData);
        setRelatedModuleData([]);
      }
    } catch (error) {
      console.error('Error loading related module:', error);
      setRelatedModuleError(error.message);
      setRelatedModuleData([]);
    } finally {
      setRelatedModuleLoading(false);
    }
  };

  const hideRelatedModule = () => {
    setRelatedModuleVisible(false);
    setSelectedRelatedModule('');
    setRelatedModuleData([]);
    setRelatedModuleError(null);
    setCurrentRecordId(null);
  };

  const handleAdd = () => {
    // Navigate to create screen for the related module
    navigation.navigate('CreateScreen', {
      moduleName: selectedRelatedModule,
      parentModule: moduleName,
      parentRecordId: currentRecordId
    });
    hideRelatedModule();
  };

  const handleUpdate = (recordId, record) => {
    // Navigate to edit screen for the related record
    navigation.navigate('EditScreen', {
      moduleName: selectedRelatedModule,
      recordId: recordId,
      parentModule: moduleName,
      parentRecordId: currentRecordId
    });
    hideRelatedModule();
  };

  const handleDelete = async (recordId) => {
    // Implement delete functionality
    try {
      // Add your delete API call here
      console.log('Deleting record:', recordId);
      // Refresh the related module data after deletion
      await showRelatedModule(moduleName, currentRecordId, selectedRelatedModule);
    } catch (error) {
      console.error('Error deleting record:', error);
      setRelatedModuleError('Failed to delete record');
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* Fixed Header and Search Section */}
      <View style={styles.fixedHeaderSection}>
        <ModuleHeader moduleName={moduleName} navigation={navigation} />
        <ModuleSearch moduleName={moduleName} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </View>

      {/* Scrollable Content Section */}
      <ScrollView
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={["#2196F3"]} />
        }
      >
        <View style={styles.moduleContentContainer}>
          {renderContent()}
        </View>
      </ScrollView>

      <RelatedModuleModal
        visible={relatedModuleVisible}
        onClose={hideRelatedModule}
        relatedModule={selectedRelatedModule}
        data={relatedModuleData}
        loading={relatedModuleLoading}
        error={relatedModuleError}
        refreshing={false}
        onRefresh={() => showRelatedModule(moduleName, currentRecordId, selectedRelatedModule)}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <Footer navigation={navigation} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  fixedHeaderSection: {
    zIndex: 1,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  moduleContentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flex: 1,
  },
  resultsInfo: {
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  searchResultsText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 15,
    color: "#64748b",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
  },
  relatedModulesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  relatedModulesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  relatedModuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  relatedModuleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default IndexScreen;
