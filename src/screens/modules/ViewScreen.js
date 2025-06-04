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
  Animated,
  Alert,
  RefreshControl,
} from "react-native"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import Icon from "react-native-vector-icons/MaterialIcons"
import { getModuleDetails } from "../../services/api/modules/crud/showAPI"
import { convertUTCToLocal, formatDate } from "../../utils/dateTimeUtils"

const { width, height } = Dimensions.get("window")

const ViewScreen = ({ route, navigation }) => {
  const { moduleName, recordId } = route.params

  // Main data states
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")

  // Drawer states
  const [selectedModule, setSelectedModule] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const slideAnim = useState(new Animated.Value(-width))[0]

  // Sidebar states
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)
  const sidebarAnim = useState(new Animated.Value(width))[0]

  // Modernized drawer states
  const [drawerSearchQuery, setDrawerSearchQuery] = useState("")
  const [selectedView, setSelectedView] = useState("cards")
  const [sortBy, setSortBy] = useState("createdtime")
  const [sortOrder, setSortOrder] = useState("desc")
  const [expandedCards, setExpandedCards] = useState(new Set())

  // Animation functions
  const openDrawer = (moduleName, moduleData) => {
    setSelectedModule({ name: moduleName, data: moduleData })
    setIsDrawerOpen(true)
    setDrawerSearchQuery("")
    setExpandedCards(new Set())
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false)
      setSelectedModule(null)
      setDrawerSearchQuery("")
      setExpandedCards(new Set())
    })
  }

  const toggleSidebar = () => {
    if (isSidebarVisible) {
      hideSidebar()
    } else {
      showSidebar()
    }
  }

  const showSidebar = () => {
    setIsSidebarVisible(true)
    Animated.timing(sidebarAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const hideSidebar = () => {
    Animated.timing(sidebarAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsSidebarVisible(false)
    })
  }

  // Data fetching
  const fetchDetails = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const result = await getModuleDetails(moduleName, recordId)
      const processedData = {
        ...result,
        fields: result.fields && result.fields[0] ? result.fields[0] : [],
      }

      setData(processedData)
    } catch (e) {
      setError(e.message)
      if (showRefreshIndicator) {
        Alert.alert("Error", "Failed to refresh data. Please try again.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    fetchDetails(true)
  }

  useEffect(() => {
    fetchDetails()
  }, [moduleName, recordId])

  // Helper functions
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

  const getStatusBadgeStyle = (status) => {
    if (!status) return styles.modernStatusDefault

    const statusLower = status.toLowerCase()
    if (statusLower.includes("completed") || statusLower.includes("closed") || statusLower.includes("won")) {
      return styles.modernStatusSuccess
    }
    if (statusLower.includes("pending") || statusLower.includes("open") || statusLower.includes("in progress")) {
      return styles.modernStatusWarning
    }
    if (statusLower.includes("cancelled") || statusLower.includes("failed") || statusLower.includes("lost")) {
      return styles.modernStatusError
    }
    if (statusLower.includes("new") || statusLower.includes("draft")) {
      return styles.modernStatusInfo
    }
    return styles.modernStatusDefault
  }

  const getStatusTextStyle = (status) => {
    if (!status) return styles.modernStatusTextDefault

    const statusLower = status.toLowerCase()
    if (statusLower.includes("completed") || statusLower.includes("closed") || statusLower.includes("won")) {
      return styles.modernStatusTextSuccess
    }
    if (statusLower.includes("pending") || statusLower.includes("open") || statusLower.includes("in progress")) {
      return styles.modernStatusTextWarning
    }
    if (statusLower.includes("cancelled") || statusLower.includes("failed") || statusLower.includes("lost")) {
      return styles.modernStatusTextError
    }
    if (statusLower.includes("new") || statusLower.includes("draft")) {
      return styles.modernStatusTextInfo
    }
    return styles.modernStatusTextDefault
  }

  const getFieldIcon = (fieldType) => {
    const iconMap = {
      email: "email",
      phone: "phone",
      date: "event",
      datetime: "schedule",
      time: "access-time",
      boolean: "check-circle",
      reference: "link",
      owner: "person",
      text: "description",
      string: "text-fields",
      picklist: "list",
      image: "image",
      currency: "attach-money",
      number: "tag",
      url: "link",
      textarea: "notes",
    }
    return iconMap[fieldType] || "info"
  }

  const getDisplayValue = (field) => {
    if (field.fieldname === "assigned_user_id" && field.userMap) {
      return field.userMap[field.value] || field.value
    }

    if (!field.value || field.value === "") {
      return "Not set"
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
      case "email":
        return field.value
      case "currency":
        return `$${Number.parseFloat(field.value || 0).toLocaleString()}`
      case "number":
        return Number.parseFloat(field.value || 0).toLocaleString()
      default:
        return String(field.value)
    }
  }

  const toggleCardExpansion = (index) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCards(newExpanded)
  }

  // Filter fields based on search query
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

  // Render functions
  const renderFieldCard = (field, index) => (
    <View key={index} style={styles.fieldCard}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldIconContainer}>
          <Icon name={getFieldIcon(field.type)} size={18} color="#2196F3" />
        </View>
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View style={styles.fieldBadges}>
            {field.mandatory && (
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryText}>Required</Text>
              </View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{field.type}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.fieldValueContainer}>
        <Text style={[styles.fieldValue, !field.value && styles.emptyValue]}>{getDisplayValue(field)}</Text>
      </View>
      {field.fieldname && <Text style={styles.fieldName}>Field: {field.fieldname}</Text>}
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
        <View style={styles.container}>
          {renderSearchBar()}
          <View style={styles.loaderContainer}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loaderText}>Loading details...</Text>
              <Text style={styles.loaderSubtext}>Please wait while we fetch the data</Text>
            </View>
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
      <ScrollView
        style={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2196F3"]} />}
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
      </ScrollView>
    )
  }

  const renderSidebar = () => {
    if (!data?.related || !data.related[0]) return null

    const relatedModules = Object.entries(data.related[0])
    const filteredModules = relatedModules.filter(([moduleName]) =>
      moduleName.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return (
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: sidebarAnim }],
            width: width * 0.75,
          },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Related Modules</Text>
          <TouchableOpacity style={styles.sidebarCloseButton} onPress={hideSidebar}>
            <Icon name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarSearchContainer}>
          <View style={styles.sidebarSearchInputContainer}>
            <Icon name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.sidebarSearchInput}
              placeholder="Search modules..."
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
        </View>

        <ScrollView style={styles.sidebarContent}>
          {filteredModules.length > 0 ? (
            filteredModules.map(([moduleName, moduleData]) => {
              const itemCount = Array.isArray(moduleData) ? moduleData.length : 0
              const hasError = moduleData.error !== undefined

              return (
                <TouchableOpacity
                  key={moduleName}
                  style={styles.moduleItem}
                  onPress={() => {
                    openDrawer(moduleName, moduleData)
                    hideSidebar()
                  }}
                >
                  <View style={styles.moduleItemIconContainer}>
                    <Icon
                      name={hasError ? "error-outline" : getModuleIcon(moduleName)}
                      size={20}
                      color={hasError ? "#ef4444" : "#2196F3"}
                    />
                  </View>
                  <View style={styles.moduleItemContent}>
                    <Text style={styles.moduleItemText}>{moduleName}</Text>
                    {hasError ? (
                      <View style={styles.moduleErrorBadge}>
                        <Text style={styles.moduleErrorText}>Error</Text>
                      </View>
                    ) : (
                      <View style={styles.moduleCountBadge}>
                        <Text style={styles.moduleCountText}>{itemCount}</Text>
                      </View>
                    )}
                  </View>
                  <Icon name="chevron-right" size={20} color="#64748b" />
                </TouchableOpacity>
              )
            })
          ) : (
            <View style={styles.sidebarEmptyContainer}>
              <Icon name="search-off" size={48} color="#d1d5db" />
              <Text style={styles.sidebarEmptyTitle}>No modules found</Text>
              <Text style={styles.sidebarEmptyText}>Try adjusting your search terms</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    )
  }

  // Modernized drawer content
  const renderDrawerContent = () => {
    if (!selectedModule) return null

    const { name, data } = selectedModule

    if (data.error) {
      return (
        <View style={styles.drawerErrorContainer}>
          <View style={styles.drawerErrorCard}>
            <Icon name="error-outline" size={48} color="#ef4444" />
            <Text style={styles.drawerErrorTitle}>Access Denied</Text>
            <Text style={styles.drawerErrorText}>{data.error}</Text>
            <View style={styles.drawerErrorActions}>
              <TouchableOpacity style={styles.drawerErrorButton} onPress={closeDrawer}>
                <Icon name="close" size={16} color="#ef4444" />
                <Text style={styles.drawerErrorButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )
    }

    if (!Array.isArray(data) || data.length === 0) {
      return (
        <View style={styles.drawerEmptyContainer}>
          <View style={styles.drawerEmptyCard}>
            <Icon name="inbox" size={64} color="#d1d5db" />
            <Text style={styles.drawerEmptyTitle}>No Items Available</Text>
            <Text style={styles.drawerEmptyText}>This module doesn't have any related items</Text>
            <TouchableOpacity style={styles.drawerEmptyButton} onPress={closeDrawer}>
              <Text style={styles.drawerEmptyButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    // Filter and sort data
    const filteredData = data.filter((item) => {
      if (!drawerSearchQuery.trim()) return true

      const query = drawerSearchQuery.toLowerCase()
      return item.some(
        (field) =>
          field.label?.toLowerCase().includes(query) ||
          String(field.value || "")
            .toLowerCase()
            .includes(query) ||
          field.fieldname?.toLowerCase().includes(query),
      )
    })

    const sortedData = [...filteredData].sort((a, b) => {
      const aField = a.find((f) => f.fieldname === sortBy)
      const bField = b.find((f) => f.fieldname === sortBy)
      const aValue = aField?.value || ""
      const bValue = bField?.value || ""

      if (sortOrder === "asc") {
        return String(aValue).localeCompare(String(bValue))
      }
      return String(bValue).localeCompare(String(aValue))
    })

    const renderDrawerSearchAndControls = () => (
      <View style={styles.drawerControlsContainer}>
        {/* Search Bar */}
        <View style={styles.drawerSearchContainer}>
          <View style={styles.drawerSearchInputContainer}>
            <Icon name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.drawerSearchInput}
              placeholder={`Search ${name.toLowerCase()}...`}
              placeholderTextColor="#94a3b8"
              value={drawerSearchQuery}
              onChangeText={setDrawerSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {drawerSearchQuery.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setDrawerSearchQuery("")}>
                <Icon name="clear" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* View Controls */}
        <View style={styles.drawerViewControls}>
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              style={[styles.viewToggleButton, selectedView === "cards" && styles.viewToggleButtonActive]}
              onPress={() => setSelectedView("cards")}
            >
              <Icon name="view-agenda" size={16} color={selectedView === "cards" ? "#ffffff" : "#64748b"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, selectedView === "table" && styles.viewToggleButtonActive]}
              onPress={() => setSelectedView("table")}
            >
              <Icon name="view-list" size={16} color={selectedView === "table" ? "#ffffff" : "#64748b"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, selectedView === "timeline" && styles.viewToggleButtonActive]}
              onPress={() => setSelectedView("timeline")}
            >
              <Icon name="timeline" size={16} color={selectedView === "timeline" ? "#ffffff" : "#64748b"} />
            </TouchableOpacity>
          </View>

          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <Icon name={sortOrder === "asc" ? "arrow-upward" : "arrow-downward"} size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Info */}
        <View style={styles.drawerResultsInfo}>
          <Text style={styles.drawerResultsText}>
            {sortedData.length} of {data.length} items
          </Text>
          {drawerSearchQuery.length > 0 && (
            <Text style={styles.drawerSearchResultsText}>filtered by "{drawerSearchQuery}"</Text>
          )}
        </View>
      </View>
    )

    const renderCardView = () => (
      <ScrollView
        style={styles.drawerContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              // Refresh drawer data if needed
            }}
            colors={["#2196F3"]}
          />
        }
      >
        {sortedData.map((item, index) => {
          const primaryField = item.find((f) => f.fieldname === "subject") || item[0]
          const statusField = item.find((f) => f.fieldname.includes("status"))
          const dateField = item.find((f) => f.type === "date" || f.type === "datetime")
          const assignedField = item.find((f) => f.fieldname === "assigned_user_id")
          const isExpanded = expandedCards.has(index)

          return (
            <View key={index} style={styles.modernDrawerCard}>
              {/* Card Header */}
              <View style={styles.modernCardHeader}>
                <View style={styles.modernCardHeaderLeft}>
                  <View style={styles.modernCardIcon}>
                    <Icon name={getModuleIcon(name)} size={20} color="#2196F3" />
                  </View>
                  <View style={styles.modernCardHeaderInfo}>
                    <Text style={styles.modernCardTitle} numberOfLines={1}>
                      {primaryField?.value || `${name} ${index + 1}`}
                    </Text>
                    <Text style={styles.modernCardSubtitle}>
                      {dateField?.value ? formatDate(dateField.value) : `Item ${index + 1}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.modernCardHeaderRight}>
                  {statusField && (
                    <View style={[styles.modernStatusBadge, getStatusBadgeStyle(statusField.value)]}>
                      <Text style={[styles.modernStatusText, getStatusTextStyle(statusField.value)]}>
                        {statusField.value}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Card Content */}
              <View style={styles.modernCardContent}>
                {/* Key Fields Grid */}
                <View style={styles.modernFieldsGrid}>
                  {(isExpanded ? item : item.slice(0, 6)).map((field, fieldIndex) => (
                    <View key={fieldIndex} style={styles.modernGridField}>
                      <Text style={styles.modernGridFieldLabel}>{field.label}</Text>
                      <Text style={styles.modernGridFieldValue} numberOfLines={isExpanded ? 0 : 2}>
                        {getDisplayValue(field)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Expandable Details */}
                {item.length > 6 && (
                  <TouchableOpacity style={styles.modernExpandButton} onPress={() => toggleCardExpansion(index)}>
                    <Text style={styles.modernExpandButtonText}>
                      {isExpanded ? "Show less" : `View ${item.length - 6} more fields`}
                    </Text>
                    <Icon name={isExpanded ? "expand-less" : "expand-more"} size={16} color="#2196F3" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Card Footer */}
              <View style={styles.modernCardFooter}>
                <View style={styles.modernCardFooterLeft}>
                  {assignedField && (
                    <View style={styles.modernAssignedInfo}>
                      <Icon name="person" size={14} color="#64748b" />
                      <Text style={styles.modernAssignedText}>
                        {assignedField.userMap?.[assignedField.value] || assignedField.value}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.modernCardActions}>
                  <TouchableOpacity style={styles.modernActionButton}
                    onPress={() => navigation.navigate("ViewScreen", {
                      moduleName: name,
                      recordId: item.find(f => f.fieldname === 'id')?.value
                    })}
                  >
                    <Icon name="visibility" size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modernActionButton}
                    onPress={() => navigation.navigate("EditScreen", {
                      moduleName: name,
                      recordId: item.find(f => f.fieldname === 'id')?.value
                    })}
                  >
                    <Icon name="edit" size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modernActionButton}>
                    <Icon name="share" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        })}
      </ScrollView>
    )

    const renderTableView = () => (
      <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
        <View style={styles.modernTableContainer}>
          {/* Table Header */}
          <View style={styles.modernTableHeader}>
            <Text style={styles.modernTableHeaderText}>Subject</Text>
            <Text style={styles.modernTableHeaderText}>Status</Text>
            <Text style={styles.modernTableHeaderText}>Date</Text>
            <Text style={styles.modernTableHeaderText}>Assigned</Text>
          </View>

          {/* Table Rows */}
          {sortedData.map((item, index) => {
            const subjectField = item.find((f) => f.fieldname === "subject") || item[0]
            const statusField = item.find((f) => f.fieldname.includes("status"))
            const dateField = item.find((f) => f.type === "date" || f.type === "datetime")
            const assignedField = item.find((f) => f.fieldname === "assigned_user_id")

            return (
              <TouchableOpacity key={index} style={styles.modernTableRow}>
                <Text style={styles.modernTableCell} numberOfLines={1}>
                  {subjectField?.value || `Item ${index + 1}`}
                </Text>
                <View style={styles.modernTableCellStatus}>
                  {statusField && (
                    <View style={[styles.modernTableStatusBadge, getStatusBadgeStyle(statusField.value)]}>
                      <Text style={[styles.modernTableStatusText, getStatusTextStyle(statusField.value)]}>
                        {statusField.value}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modernTableCell} numberOfLines={1}>
                  {dateField?.value ? formatDate(dateField.value) : "-"}
                </Text>
                <Text style={styles.modernTableCell} numberOfLines={1}>
                  {assignedField?.userMap?.[assignedField.value] || assignedField?.value || "-"}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    )

    const renderTimelineView = () => (
      <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
        <View style={styles.modernTimelineContainer}>
          {sortedData.map((item, index) => {
            const subjectField = item.find((f) => f.fieldname === "subject") || item[0]
            const dateField = item.find((f) => f.type === "date" || f.type === "datetime")
            const statusField = item.find((f) => f.fieldname.includes("status"))

            return (
              <View key={index} style={styles.modernTimelineItem}>
                <View style={styles.modernTimelineDot}>
                  <View style={[styles.modernTimelineDotInner, getStatusBadgeStyle(statusField?.value)]} />
                </View>
                <View style={styles.modernTimelineContent}>
                  <View style={styles.modernTimelineHeader}>
                    <Text style={styles.modernTimelineTitle}>{subjectField?.value || `${name} ${index + 1}`}</Text>
                    <Text style={styles.modernTimelineDate}>
                      {dateField?.value ? formatDate(dateField.value) : "No date"}
                    </Text>
                  </View>
                  <View style={styles.modernTimelineDetails}>
                    {item.slice(0, 3).map((field, fieldIndex) => (
                      <Text key={fieldIndex} style={styles.modernTimelineDetail}>
                        {field.label}: {getDisplayValue(field)}
                      </Text>
                    ))}
                  </View>
                  {statusField && (
                    <View style={styles.modernTimelineStatus}>
                      <View style={[styles.modernStatusBadge, getStatusBadgeStyle(statusField.value)]}>
                        <Text style={[styles.modernStatusText, getStatusTextStyle(statusField.value)]}>
                          {statusField.value}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    )

    return (
      <View style={styles.modernDrawerContainer}>
        {renderDrawerSearchAndControls()}
        {selectedView === "cards" && renderCardView()}
        {selectedView === "table" && renderTableView()}
        {selectedView === "timeline" && renderTimelineView()}
      </View>
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

        <View style={styles.headerButtons}>
          {data?.related && data.related[0] && Object.keys(data.related[0]).length > 0 && (
            <TouchableOpacity style={styles.sidebarToggleButton} onPress={toggleSidebar}>
              <Icon name="device-hub" size={20} color="#ffffff" />
              <View style={styles.toggleButtonBadge}>
                <Text style={styles.toggleButtonBadgeText}>{Object.keys(data.related[0]).length}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditScreen", { moduleName, recordId })}
          >
            <Icon name="edit" size={20} color="#ffffff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!loading && !error && data?.fields?.length > 0 && renderSearchBar()}

      <View style={styles.mainContent}>
        <View style={styles.fieldsContent}>{renderContent()}</View>
      </View>

      {renderSidebar()}

      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
            zIndex: 1000,
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>{selectedModule?.name}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={closeDrawer}>
            <Icon name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        {renderDrawerContent()}
      </Animated.View>

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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sidebarToggleButton: {
    backgroundColor: "#22c55e",
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  toggleButtonBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ef4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  toggleButtonBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#2196F3",
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
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  fieldsContent: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  detailsContainer: {
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
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  fieldBadges: {
    flexDirection: "row",
    gap: 8,
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
  typeBadge: {
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2196F3",
    textTransform: "uppercase",
  },
  fieldValueContainer: {
    paddingLeft: 48,
    marginBottom: 8,
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
  },
  fieldName: {
    fontSize: 12,
    color: "#94a3b8",
    paddingLeft: 48,
    fontStyle: "italic",
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
    width: width * 0.9,
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
  sidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 20,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  sidebarCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  sidebarSearchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  sidebarSearchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  sidebarContent: {
    flex: 1,
  },
  moduleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  moduleItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  moduleItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moduleItemText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  moduleCountBadge: {
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 28,
    alignItems: "center",
  },
  moduleCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2196F3",
  },
  moduleErrorBadge: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  moduleErrorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },
  sidebarEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  sidebarEmptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  sidebarEmptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: width * 0.85,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  drawerContent: {
    flex: 1,
  },
  // Modernized drawer styles
  modernDrawerContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  drawerControlsContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 16,
  },
  drawerSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  drawerSearchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  drawerSearchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  drawerViewControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  viewToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  viewToggleButtonActive: {
    backgroundColor: "#2196F3",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  drawerResultsInfo: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  drawerResultsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  drawerSearchResultsText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  modernDrawerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  modernCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modernCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modernCardHeaderInfo: {
    flex: 1,
  },
  modernCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  modernCardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  modernCardHeaderRight: {
    marginLeft: 12,
  },
  modernStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernStatusSuccess: {
    backgroundColor: "#dcfce7",
  },
  modernStatusWarning: {
    backgroundColor: "#fef3c7",
  },
  modernStatusError: {
    backgroundColor: "#fef2f2",
  },
  modernStatusInfo: {
    backgroundColor: "#dbeafe",
  },
  modernStatusDefault: {
    backgroundColor: "#f1f5f9",
  },
  modernStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modernStatusTextSuccess: {
    color: "#166534",
  },
  modernStatusTextWarning: {
    color: "#d97706",
  },
  modernStatusTextError: {
    color: "#dc2626",
  },
  modernStatusTextInfo: {
    color: "#1d4ed8",
  },
  modernStatusTextDefault: {
    color: "#64748b",
  },
  modernCardContent: {
    padding: 16,
  },
  modernFieldsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  modernGridField: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  modernGridFieldLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  modernGridFieldValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  modernExpandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  modernExpandButtonText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "500",
    marginRight: 4,
  },
  modernCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  modernCardFooterLeft: {
    flex: 1,
  },
  modernAssignedInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernAssignedText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  modernCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  modernActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modernTableContainer: {
    margin: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modernTableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  modernTableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modernTableCell: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
  },
  modernTableCellStatus: {
    flex: 1,
    justifyContent: "center",
  },
  modernTableStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  modernTableStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  modernTimelineContainer: {
    padding: 16,
  },
  modernTimelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  modernTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
    marginRight: 16,
    marginTop: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  modernTimelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernTimelineContent: {
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
  modernTimelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modernTimelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  modernTimelineDate: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  modernTimelineDetails: {
    gap: 4,
  },
  modernTimelineDetail: {
    fontSize: 14,
    color: "#64748b",
  },
  modernTimelineStatus: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  drawerErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  drawerErrorCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    margin: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  drawerErrorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 8,
  },
  drawerErrorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  drawerErrorActions: {
    marginTop: 16,
  },
  drawerErrorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  drawerErrorButtonText: {
    color: "#ef4444",
    marginLeft: 4,
    fontWeight: "500",
  },
  drawerEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  drawerEmptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    margin: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  drawerEmptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  drawerEmptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  drawerEmptyButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  drawerEmptyButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
})

export default ViewScreen
