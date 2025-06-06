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

const { width, height } = Dimensions.get("window")

const IndexScreen = ({ route, navigation }) => {
  const { moduleName } = route.params

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

  // Classic Style Render Functions (Original)
  const renderClassicRecordDetails = (item) => {
    const detailFields = item.fields
    const recordId = detailFields.find((f) => f.fieldname === "id")?.value
    const relatedModules = item.relatedModules || []
    const itemIndex = filteredData.indexOf(item)
    // const isRelatedVisible = showRelatedModules.has(itemIndex)

    const getModuleColor = (moduleName) => {
      const colors = {
        Assets: "#3b82f6",
        Calendar: "#2196F3",
        Campaigns: "#ec4899",
        Contacts: "#2196F3",
        Documents: "#2196F3",
        Emails: "#2196F3",
        HelpDesk: "#ef4444",
        Invoice: "#10b981",
        ModComments: "#6b7280",
        PBXManager: "#8b5cf6",
        Potentials: "#f97316",
        Products: "#0ea5e9",
        Project: "#8b5cf6",
        Quotes: "#84cc16",
        SalesOrder: "#14b8a6",
        ServiceContracts: "#ec4899",
        Services: "#f59e0b",
        Tasks: "#2196F3",
      }
      return colors[moduleName] || "#2196F3"
    }

    const toggleRelatedModules = () => {
      const newShowRelatedModules = new Set(showRelatedModules)
      if (newShowRelatedModules.has(itemIndex)) {
        newShowRelatedModules.delete(itemIndex)
      } else {
        newShowRelatedModules.add(itemIndex)
      }
      setShowRelatedModules(newShowRelatedModules)
    }

    return (
      <View style={styles.classicDetailsContainer}>
        {/* Main Content Column */}
        <View 
          style={styles.classicDetailsMainContent}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout
            setMainContentHeight(height)
          }}
        >
          <ScrollView
            style={styles.classicDetailsScrollView}
            contentContainerStyle={styles.classicDetailsScrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {detailFields.map((field, idx) => (
              <View key={idx} style={styles.classicDetailRow}>
                <Text style={styles.classicDetailLabel}>{field.label}:</Text>
                <Text style={styles.classicDetailValue}>{getDisplayValue(field)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.classicFixedButtonContainer}>
            <TouchableOpacity
              style={styles.classicUpdateButton}
              onPress={() =>
                navigation.navigate("ViewScreen", {
                  moduleName,
                  recordId,
                })
              }
            >
              <Icon name="visibility" size={18} color="#ffffff" />
              <Text style={styles.classicUpdateButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Related Modules Buttons */}
        <View style={styles.relatedButtonsContainer}>
          {/* Main Related Button */}
          {/* <TouchableOpacity
            style={[styles.relatedMainButton, isRelatedVisible && styles.relatedMainButtonActive]}
            onPress={toggleRelatedModules}
          >
            <Icon name={isRelatedVisible ? "close" : "link"} size={20} color="#ffffff" />
          </TouchableOpacity> */}

          {/* Related Module Buttons with Scrolling */}
          {/* {isRelatedVisible && ( */}
            <View style={[
              styles.relatedButtonsScrollContainer,
              { maxHeight: mainContentHeight > 0 ? mainContentHeight : undefined }
            ]}>
              <ScrollView
                style={styles.relatedButtonsScrollView}
                contentContainerStyle={styles.relatedButtonsScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                bounces={true}
              >
                {relatedModules.map((module, moduleIndex) => {
                  const moduleColor = getModuleColor(module)
                  return (
                    <TouchableOpacity
                      key={moduleIndex}
                      style={[styles.relatedModuleButton, { backgroundColor: moduleColor , }]}
                      onPress={() => {
                        navigation.navigate("ModuleScreen", { moduleName: module })
                      }}
                      activeOpacity={0.8}
                    >
                      <Icon name={getModuleIcon(module)} size={18} color="#ffffff" />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          {/* )} */}
        </View>
      </View>
    )
  }

  const renderClassicRecordRow = (item, index) => {
    const mainField = item.fields.find((f) => f.value) || { value: "?" }
    const mainLabel = String(mainField.value)
    const initial = mainLabel.charAt(0).toUpperCase()
    const isExpanded = expandedRows.has(index)

    return (
      <View key={index}>
        <TouchableOpacity
          style={[
            styles.classicRecordRow,
            index % 2 === 0 ? styles.classicTableRowEven : styles.classicTableRowOdd,
            index === filteredData.length - 1 && !isExpanded && styles.classicTableRowLast,
          ]}
          onPress={() => toggleRow(index)}
          activeOpacity={0.7}
        >
          <View style={styles.classicRecordRowContent}>
            <View style={styles.classicRecordInfo}>
              <View style={styles.classicAvatarCircle}>
                <Text style={styles.classicAvatarText}>{initial}</Text>
              </View>
              <Text style={styles.classicRecordLabel}>
                {mainLabel}{" "}
                {item.fields[1]?.value &&
                !item.fields[1]?.type?.includes("date") &&
                !item.fields[1]?.type?.includes("time")
                  ? ` ${item.fields[1].value}`
                  : ""}
              </Text>
            </View>
            <View style={styles.classicAssignedToContainer}>
              <Text style={styles.classicAssignedToLabel}>Assigned to:</Text>
              <Text style={styles.classicAssignedToValue}>
                {item.fields.find((f) => f.fieldname === "assigned_user_id")?.userMap?.[
                  item.fields.find((f) => f.fieldname === "assigned_user_id")?.value
                ] ||
                  item.fields.find((f) => f.fieldname === "assigned_user_id")?.value ||
                  "Unassigned"}
              </Text>
            </View>
            <Icon
              name={isExpanded ? "expand-less" : "expand-more"}
              size={24}
              color="#6b7280"
              style={styles.classicChevron}
            />
          </View>
        </TouchableOpacity>
        {isExpanded && renderClassicRecordDetails(item)}
      </View>
    )
  }

  const renderClassicContent = () => {
    if (loading) {
      return (
        <View style={styles.classicLoaderContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.classicLoaderText}>Loading {moduleName}...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.classicErrorContainer}>
          <Icon name="error-outline" size={24} color="#ef4444" />
          <Text style={styles.classicErrorText}>{error}</Text>
          <TouchableOpacity style={styles.classicRetryButton} onPress={() => fetchData()}>
            <Text style={styles.classicRetryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!filteredData || filteredData.length === 0) {
      return (
        <View style={styles.classicEmptyStateContainer}>
          <Icon name="inbox" size={60} color="#d1d5db" />
          <Text style={styles.classicEmptyStateTitle}>No data found</Text>
          <Text style={styles.classicEmptyStateText}>No {moduleName.toLowerCase()} records are available.</Text>
        </View>
      )
    }

    return (
      <View style={styles.classicContentContainer}>
        {renderViewControls()}

        <View style={styles.classicTableContainer}>
          {filteredData.map((item, index) => renderClassicRecordRow(item, index))}
          <View style={styles.classicTableFooter}>
            <Text style={styles.classicTableFooterText}>
              {filteredData.length} {filteredData.length === 1 ? "record" : "records"} found
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // Modern Style Render Functions
  const renderRecordDetails = (item) => {
    const detailFields = item.fields
    const recordId = detailFields.find((f) => f.fieldname === "id")?.value

    return (
      <View style={styles.detailsContainer}>
        <ScrollView
          style={styles.detailsScrollView}
          contentContainerStyle={styles.detailsScrollContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {detailFields.map((field, idx) => (
            <View key={idx} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{field.label}:</Text>
              <Text style={[styles.detailValue, !field.value && styles.emptyValue]}>{getDisplayValue(field)}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() =>
              navigation.navigate("ViewScreen", {
                moduleName,
                recordId,
              })
            }
          >
            <Icon name="visibility" size={18} color="#ffffff" />
            <Text style={styles.updateButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderRecordRow = (item, index) => {
    const mainField = item.fields.find((f) => f.value) || { value: "?" }
    const mainLabel = String(mainField.value)
    const initial = mainLabel.charAt(0).toUpperCase()
    const isExpanded = expandedRows.has(index)
    const statusField = item.fields.find((f) => f.fieldname && f.fieldname.includes("status"))
    const dateField = item.fields.find((f) => f.type === "date" || f.type === "datetime")
    const assignedField = item.fields.find((f) => f.fieldname === "assigned_user_id")

    return (
      <View key={index}>
        <TouchableOpacity
          style={[
            styles.recordRow,
            index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
            index === filteredData.length - 1 && !isExpanded && styles.tableRowLast,
          ]}
          onPress={() => toggleRow(index)}
          activeOpacity={0.7}
        >
          <View style={styles.recordRowContent}>
            <View style={styles.recordInfo}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.recordTextContainer}>
                <Text style={styles.recordLabel} numberOfLines={1}>
                  {mainLabel}
                </Text>
                {dateField && <Text style={styles.recordDate}>{getDisplayValue(dateField)}</Text>}
              </View>
            </View>

            <View style={styles.recordStatusContainer}>
              {statusField && (
                <View style={[styles.statusBadge, getStatusBadgeStyle(statusField.value)]}>
                  <Text style={[styles.statusText, getStatusTextStyle(statusField.value)]}>{statusField.value}</Text>
                </View>
              )}
            </View>

            <View style={styles.assignedToContainer}>
              {assignedField && (
                <>
                  <Icon name="person" size={14} color="#64748b" />
                  <Text style={styles.assignedToValue}>
                    {assignedField.userMap?.[assignedField.value] || assignedField.value || "Unassigned"}
                  </Text>
                </>
              )}
            </View>

            <Icon name={isExpanded ? "expand-less" : "expand-more"} size={24} color="#64748b" style={styles.chevron} />
          </View>
        </TouchableOpacity>
        {isExpanded && renderRecordDetails(item)}
      </View>
    )
  }

  const renderCardView = () => {
    return (
      <View style={styles.cardsContainer}>
        {filteredData.map((item, index) => {
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

              {/* Card Content */}
              <View style={styles.cardContent}>
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

                {/* Related Modules Section */}
                {relatedModules.length > 0 && (
                  <View style={styles.relatedModulesContainer}>
                    <Text style={styles.relatedModulesTitle}>Related Modules</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.relatedModulesScroll}
                      contentContainerStyle={styles.relatedModulesList}
                    >
                      {relatedModules.map((module, moduleIndex) => {
                        const moduleColor = getModuleColor(module)
                        const isActive = false // You can add logic here to determine if module is active
                        return (
                          <TouchableOpacity
                            key={moduleIndex}
                            style={[
                              styles.relatedModuleButton,
                              isActive && styles.relatedModuleButtonActive,
                              { borderColor: isActive ? moduleColor : "#e2e8f0" }
                            ]}
                            onPress={() => navigation.navigate("IndexScreen", { moduleName: module })}
                          >
                            <Icon
                              name={getModuleIcon(module)}
                              size={16}
                              color={isActive ? "#ffffff" : moduleColor}
                              style={styles.relatedModuleIcon}
                            />
                            <Text 
                              style={[
                                styles.relatedModuleText,
                                isActive && styles.relatedModuleTextActive,
                                !isActive && { color: moduleColor }
                              ]}
                            >
                              {module}
                            </Text>
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
      </View>
    )
  }

  const renderTableView = () => {
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
        {filteredData.map((item, index) => {
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
    )
  }

  const renderTimelineView = () => {
    return (
      <View style={styles.timelineContainer}>
        {filteredData.map((item, index) => {
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
    )
  }

  const renderViewControls = () => {
    const iconRotation = filterIconRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    })

    return (
      <View style={styles.viewControlsContainer}>
        <View style={styles.viewControlsLeft}>
          {/* Style Toggle - Always visible */}
          <View style={styles.styleToggleContainer}>
            <TouchableOpacity
              style={[styles.styleToggleButton, styleMode === "modern" && styles.styleToggleButtonActive]}
              onPress={() => setStyleMode("modern")}
            >
              <Icon name="dashboard" size={14} color={styleMode === "modern" ? "#ffffff" : "#64748b"} />
              <Text style={[styles.styleToggleText, styleMode === "modern" && styles.styleToggleTextActive]}>
                Modern
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.styleToggleButton, styleMode === "classic" && styles.styleToggleButtonActive]}
              onPress={() => setStyleMode("classic")}
            >
              <Icon name="list" size={14} color={styleMode === "classic" ? "#ffffff" : "#64748b"} />
              <Text style={[styles.styleToggleText, styleMode === "classic" && styles.styleToggleTextActive]}>
                Classic
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Mode Toggle (only for modern style) */}
          {styleMode === "modern" && (
            <View style={styles.viewToggleContainer}>
              <TouchableOpacity
                style={[styles.viewToggleButton, viewMode === "cards" && styles.viewToggleButtonActive]}
                onPress={() => setViewMode("cards")}
              >
                <Icon name="view-agenda" size={16} color={viewMode === "cards" ? "#ffffff" : "#64748b"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleButton, viewMode === "table" && styles.viewToggleButtonActive]}
                onPress={() => setViewMode("table")}
              >
                <Icon name="view-list" size={16} color={viewMode === "table" ? "#ffffff" : "#64748b"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleButton, viewMode === "timeline" && styles.viewToggleButtonActive]}
                onPress={() => setViewMode("timeline")}
              >
                <Icon name="timeline" size={16} color={viewMode === "timeline" ? "#ffffff" : "#64748b"} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.viewControlsRight}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <Icon name={sortOrder === "asc" ? "arrow-upward" : "arrow-downward"} size={16} color="#64748b" />
          </TouchableOpacity>

          {styleMode === "modern" && (
            <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
              <Icon name="filter-list" size={16} color="#64748b" />
              <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
                <Icon name="chevron-right" size={16} color="#64748b" />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  const renderFilterPanel = () => {
    if (styleMode === "classic") return null

    return (
      <Animated.View style={[styles.filterPanel, { height: filterPanelHeight }]}>
        <View style={styles.filterPanelContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort by</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, sortBy === "id" && styles.filterOptionActive]}
                onPress={() => setSortBy("id")}
              >
                <Text style={[styles.filterOptionText, sortBy === "id" && styles.filterOptionTextActive]}>ID</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, sortBy === "name" && styles.filterOptionActive]}
                onPress={() => setSortBy("name")}
              >
                <Text style={[styles.filterOptionText, sortBy === "name" && styles.filterOptionTextActive]}>Name</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, sortBy === "date" && styles.filterOptionActive]}
                onPress={() => setSortBy("date")}
              >
                <Text style={[styles.filterOptionText, sortBy === "date" && styles.filterOptionTextActive]}>Date</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Closed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    )
  }

  const renderContent = () => {
    if (styleMode === "classic") {
      return renderClassicContent()
    }

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
          <Text style={styles.emptyStateText}>No {moduleName.toLowerCase()} records are available.</Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate("CreateScreen", { moduleName })}
          >
            <Icon name="add" size={20} color="#ffffff" />
            <Text style={styles.emptyStateButtonText}>Create {moduleName}</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.contentContainer}>
        {renderViewControls()}
        {renderFilterPanel()}

        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredData.length} {filteredData.length === 1 ? "record" : "records"} found
          </Text>
          {searchQuery.length > 0 && <Text style={styles.searchResultsText}>filtered by "{searchQuery}"</Text>}
        </View>

        {viewMode === "cards" && renderCardView()}
        {viewMode === "table" && renderTableView()}
        {viewMode === "timeline" && renderTimelineView()}
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

  return (
    <View style={[styles.container, styleMode === "classic" && styles.classicContainer]}>
      <Header />

      {/* Fixed Header and Search Section */}
      <View style={[styles.fixedHeaderSection, styleMode === "classic" && styles.classicFixedHeaderSection]}>
        {/* Header Container */}
        <View style={[styles.headerContainer, styleMode === "classic" && styles.classicHeaderContainer]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, styleMode === "classic" && styles.classicTitle]}>{moduleName}</Text>
            <Text style={[styles.subtitle, styleMode === "classic" && styles.classicSubtitle]}>
              Manage your {moduleName.toLowerCase()} records
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, styleMode === "classic" && styles.classicAddButton]}
            onPress={() => navigation.navigate("CreateScreen", { moduleName })}
          >
            <Icon name="add" size={22} color="#ffffff" />
            <Text style={[styles.addButtonText, styleMode === "classic" && styles.classicAddButtonText]}>
              New {moduleName}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Separate Search Container */}
        <View style={[styles.searchSection, styleMode === "classic" && styles.classicSearchSection]}>
          <View style={[styles.searchContainer, styleMode === "classic" && styles.classicSearchContainer]}>
            <Icon name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, styleMode === "classic" && styles.classicSearchInput]}
              placeholder={`Search in ${moduleName}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Icon name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>
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
        <View style={[styles.moduleContentContainer, styleMode === "classic" && styles.classicModuleContentContainer]}>
          {renderContent()}
        </View>
      </ScrollView>

      <Footer navigation={navigation} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  classicContainer: {
    backgroundColor: "#f9fafb",
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
  classicFixedHeaderSection: {
    borderBottomColor: "#e5e7eb",
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  classicHeaderContainer: {
    borderBottomColor: "#e5e7eb",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  classicSearchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  classicTitle: {
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  classicSubtitle: {
    color: "#6b7280",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  classicAddButton: {
    borderRadius: 8,
    elevation: 1,
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
  },
  classicAddButtonText: {
    fontWeight: "600",
  },
  moduleContentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  classicModuleContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  classicSearchContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#1e293b",
    padding: 0,
  },
  classicSearchInput: {
    fontSize: 15,
    color: "#111827",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
  },
  viewControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  viewControlsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  styleToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
  },
  styleToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 1,
    gap: 4,
  },
  styleToggleButtonActive: {
    backgroundColor: "#2196F3",
  },
  styleToggleText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  styleToggleTextActive: {
    color: "#ffffff",
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
  viewControlsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    gap: 4,
  },
  filterPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPanelContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterOptionActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  filterOptionTextActive: {
    color: "#ffffff",
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

  // Card View Styles
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
  cardContent: {
    padding: 16,
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

  // Table View Styles
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

  // Timeline View Styles
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

  // Status Badge Styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusSuccess: {
    backgroundColor: "#dcfce7",
  },
  statusWarning: {
    backgroundColor: "#fef3c7",
  },
  statusError: {
    backgroundColor: "#fef2f2",
  },
  statusInfo: {
    backgroundColor: "#dbeafe",
  },
  statusDefault: {
    backgroundColor: "#f1f5f9",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextSuccess: {
    color: "#166534",
  },
  statusTextWarning: {
    color: "#d97706",
  },
  statusTextError: {
    color: "#dc2626",
  },
  statusTextInfo: {
    color: "#1d4ed8",
  },
  statusTextDefault: {
    color: "#64748b",
  },

  // Original Table Row Styles (for backward compatibility)
  recordRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  recordRowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  recordInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  recordTextContainer: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  recordDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  recordStatusContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  tableRowEven: {
    backgroundColor: "#ffffff",
  },
  tableRowOdd: {
    backgroundColor: "#f9fafb",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  assignedToContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start",
  },
  assignedToValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    marginLeft: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  avatarText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "600",
  },
  chevron: {
    width: 24,
    height: 24,
  },

  // Details Container Styles
  detailsContainer: {
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 8,
  },
  detailsScrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 300,
  },
  detailsScrollContent: {
    paddingBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500",
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: "#111827",
  },
  emptyValue: {
    fontStyle: "italic",
    color: "#9ca3af",
  },
  fixedButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
    letterSpacing: 0.3,
  },

  // Loading, Error, and Empty States
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
    marginBottom: 24,
  },
  emptyStateButton: {
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
  emptyStateButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },

  // Classic Style Overrides
  classicTableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  classicRecordRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  classicRecordRowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  classicRecordInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  classicRecordLabel: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  classicTableRowEven: {
    backgroundColor: "#ffffff",
  },
  classicTableRowOdd: {
    backgroundColor: "#f9fafb",
  },
  classicTableRowLast: {
    borderBottomWidth: 0,
  },
  classicTableFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  classicTableFooterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    textAlign: "right",
  },
  classicLoaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  classicLoaderText: {
    marginTop: 16,
    fontSize: 15,
    color: "#6b7280",
  },
  classicEmptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  classicEmptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  classicEmptyStateText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
  classicErrorContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  classicErrorText: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 15,
    color: "#b91c1c",
    textAlign: "center",
  },
  classicRetryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  classicRetryButtonText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 14,
  },
  classicChevron: {
    width: 24,
    height: 24,
  },
  classicDetailsContainer: {
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 8,
    flexDirection: "row",
    overflow: "hidden",
    height: "fit-content",
  },
  classicDetailsMainContent: {
    flex: 1,
    position: "relative",
  },
  classicDetailsScrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  classicDetailsScrollContent: {
  },
  classicDetailRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  classicDetailLabel: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500",
  },
  classicDetailValue: {
    flex: 2,
    fontSize: 14,
    color: "#111827",
  },
  classicFixedButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopColor: "#e5e7eb",

  },

  classicUpdateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#2196F3",
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: -2,
  },
  classicUpdateButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  classicAssignedToContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    flex: 1,
  },
  classicAssignedToLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  classicAssignedToValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  classicAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  classicAvatarText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "600",
  },
  classicContentContainer: {
    flex: 1,
  },

  // Related Modules Styles
  relatedModulesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  relatedModulesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  relatedModulesScroll: {
    marginHorizontal: -4,
  },
  relatedModulesList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  relatedModuleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  relatedModuleButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  relatedModuleIcon: {
    marginRight: 6,
  },
  relatedModuleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  relatedModuleTextActive: {
    color: "#ffffff",
  },

  // Related Buttons Container (New Design)
  relatedButtonsContainer: {
    width: 70,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 10,
    height: "100%",

    // backgroundColor: "red",
  },
  relatedMainButton: {
    backgroundColor: "blue",
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  relatedButtonsScrollContainer: {
    flex: 1,
    width: "100%",
  },
  relatedButtonsScrollView: {
    flex: 1,
    width: "100%",
  },
  relatedButtonsScrollContent: {
    alignItems: "center",
    paddingVertical: 4,
    gap: 4,
  },

  // Professional floating effects
  relatedButtonHover: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
})

const getModuleColor = (moduleName) => {
  const colors = {
    Assets: "#8B5CF6", // Purple
    Calendar: "#3B82F6", // Blue
    Campaigns: "#EC4899", // Pink
    Contacts: "#10B981", // Emerald
    Documents: "#F59E0B", // Amber
    Emails: "#6366F1", // Indigo
    HelpDesk: "#EF4444", // Red
    Invoice: "#059669", // Green
    ModComments: "#6B7280", // Gray
    PBXManager: "#8B5CF6", // Purple
    Potentials: "#F97316", // Orange
    Products: "#0EA5E9", // Sky
    Project: "#7C3AED", // Violet
    Quotes: "#84CC16", // Lime
    SalesOrder: "#06B6D4", // Cyan
    ServiceContracts: "#EC4899", // Pink
    Services: "#F59E0B", // Amber
    Tasks: "#3B82F6", // Blue
    Leads: "#10B981", // Emerald
    Accounts: "#6366F1", // Indigo
    Events: "#8B5CF6", // Purple
  }
  return colors[moduleName] || "#6B7280"
}

export default IndexScreen
