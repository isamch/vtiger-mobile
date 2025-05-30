"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  TextInput,
} from "react-native"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import Icon from "react-native-vector-icons/MaterialIcons"
import { getModuleDetails } from "../../services/api/modules/crud/showAPI"
import RefreshableScrollView from "../../components/RefreshableScrollView"

const { width } = Dimensions.get("window")

const ViewScreen = ({ route, navigation }) => {
  const { moduleName, recordId } = route.params
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  // const [refreshing, setRefreshing] = useState(false)

  const fetchDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getModuleDetails(moduleName, recordId)

      const processedData = {
        ...result,
        fields: result.fields && result.fields[0] ? result.fields[0] : [],
      }

      setData(processedData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [moduleName, recordId])

  const getFieldIcon = (fieldType) => {
    const iconMap = {
      email: "email",
      phone: "phone",
      date: "event",
      datetime: "schedule",
      boolean: "check-circle",
      reference: "link",
      owner: "person",
      text: "description",
      string: "text-fields",
      picklist: "list",
      image: "image",
    }
    return iconMap[fieldType] || "info"
  }

  const getDisplayValue = (field) => {
    if (field.fieldname === "assigned_user_id" && field.userMap) {
      return field.userMap[field.value] || field.value
    }

    if (!field.value || field.value === "") {
      return <Text style={styles.emptyValue}>Not set</Text>
    }

    // Format different field types
    switch (field.type) {
      case "boolean":
        return field.value === "1" ? "Yes" : "No"
      case "date":
        return new Date(field.value).toLocaleDateString()
      case "datetime":
        return new Date(field.value).toLocaleString()
      case "email":
        return field.value
      default:
        return String(field.value)
    }
  }

  const filteredFields =
    data?.fields?.filter((field) => {
      if (!searchQuery.trim()) return true

      const query = searchQuery.toLowerCase()
      const labelMatch = field.label?.toLowerCase().includes(query)
      const valueMatch = String(field.value || "")
        .toLowerCase()
        .includes(query)
      const fieldnameMatch = field.fieldname?.toLowerCase().includes(query)

      return labelMatch || valueMatch || fieldnameMatch
    }) || []

  const renderFieldCard = (field, index) => (
    <View key={index} style={styles.fieldCard}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldIconContainer}>
          <Icon name={getFieldIcon(field.type)} size={18} color="#2196F3" />
        </View>
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          {field.mandatory && (
            <View style={styles.mandatoryBadge}>
              <Text style={styles.mandatoryText}>Required</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.fieldValueContainer}>
        <Text style={styles.fieldValue}>{getDisplayValue(field)}</Text>
      </View>
    </View>
  )

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search fields..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
            <Icon name="clear" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
      {searchQuery.length > 0 && (
        <Text style={styles.searchResults}>
          {filteredFields.length} field{filteredFields.length !== 1 ? "s" : ""} found
        </Text>
      )}
    </View>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loaderText}>Loading details...</Text>
            <Text style={styles.loaderSubtext}>Please wait while we fetch the data</Text>
          </View>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <Icon name="error-outline" size={48} color="#ef4444" />
            </View>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchDetails()}>
              <Icon name="refresh" size={20} color="#ffffff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    if (!data || !data.fields || data.fields.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconContainer}>
              <Icon name="inbox" size={64} color="#d1d5db" />
            </View>
            <Text style={styles.emptyStateTitle}>No details available</Text>
            <Text style={styles.emptyStateText}>
              Could not find details for this {moduleName.toLowerCase()} record.
            </Text>
          </View>
        </View>
      )
    }

    return (
      <RefreshableScrollView
        style={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onRefresh={fetchDetails}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredFields.length}</Text>
            <Text style={styles.statLabel}>Total Fields</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredFields.filter((f) => f.mandatory).length}</Text>
            <Text style={styles.statLabel}>Required</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredFields.filter((f) => f.value && f.value !== "").length}</Text>
            <Text style={styles.statLabel}>Filled</Text>
          </View>
        </View>

        <View style={styles.fieldsContainer}>
          {filteredFields.length > 0 ? (
            filteredFields.map((field, index) => renderFieldCard(field, index))
          ) : (
            <View style={styles.noResultsContainer}>
              <Icon name="search-off" size={48} color="#d1d5db" />
              <Text style={styles.noResultsTitle}>No fields found</Text>
              <Text style={styles.noResultsText}>Try adjusting your search terms</Text>
            </View>
          )}
        </View>
      </RefreshableScrollView>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header />

      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{moduleName} Details</Text>
            <Text style={styles.subtitle}>Record ID: {recordId}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}
          onPress={() => navigation.navigate('EditScreen', { moduleName, recordId })}>
          <Icon name="edit" size={20} color="#ffffff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {!loading && !error && data?.fields?.length > 0 && renderSearchBar()}

      <View style={styles.content}>{renderContent()}</View>

      <Footer navigation={navigation} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2196F3",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  fieldsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  fieldCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fieldIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  fieldInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  mandatoryBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  mandatoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#d97706",
    textTransform: "uppercase",
  },
  fieldValueContainer: {
    paddingLeft: 48,
  },
  fieldValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
    lineHeight: 24,
  },
  emptyValue: {
    fontStyle: "italic",
    color: "#94a3b8",
    fontSize: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderCard: {
    backgroundColor: "#ffffff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: width * 0.8,
  },
  loaderText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  loaderSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: width * 0.85,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateCard: {
    backgroundColor: "#ffffff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: width * 0.85,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  detailsContainer: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchResults: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    fontWeight: "500",
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
})

export default ViewScreen
