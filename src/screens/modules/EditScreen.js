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
  Switch,
  Alert,
  Modal,
  FlatList,
  Image,
  Platform,
} from "react-native"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import Icon from "react-native-vector-icons/MaterialIcons"
import { getModuleDetails } from "../../services/api/modules/crud/showAPI"
import { updateModuleRecord } from "../../services/api/modules/crud/updateAPI"
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker'
import { convertUTCToLocal, convertLocalToUTC, formatDate, convertDateTimeToUTC } from "../../utils/dateTimeUtils"

const { width } = Dimensions.get("window")

const EditScreen = ({ route, navigation }) => {
  const { moduleName, recordId } = route.params
  const [originalData, setOriginalData] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [validationErrors, setValidationErrors] = useState({})
  const [showPicklistModal, setShowPicklistModal] = useState(false)
  const [currentPicklistField, setCurrentPicklistField] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [currentDateField, setCurrentDateField] = useState(null)
  const [datePickerMode, setDatePickerMode] = useState('date')
  const [tempDateTime, setTempDateTime] = useState(new Date())

  // Add array of fields to hide
  const hiddenFields = [
    // 'createdtime',
    // 'modifiedtime',
    // 'created_user_id',
    // 'modifiedby',
    // 'source',
    // 'starred',
    'tags',
    'id'
  ]

  const [userData, setUserData] = useState(null)

  const fetchDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getModuleDetails(moduleName, recordId)

      const processedData = {
        ...result,
        fields: result.fields && result.fields[0] ? result.fields[0] : [],
      }

      setOriginalData(processedData)

      // Initialize form data with current values
      const initialFormData = {}
      processedData.fields.forEach((field) => {
        initialFormData[field.fieldname] = field.value || ""
      })
      setFormData(initialFormData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // requestPermissions();
    fetchDetails();
  }, [moduleName, recordId])

  const getFieldIcon = (fieldType) => {
    const iconMap = {
      email: "email",
      phone: "phone",
      date: "event",
      datetime: "schedule",
      boolean: "toggle-on",
      reference: "link",
      owner: "person",
      text: "description",
      string: "text-fields",
      picklist: "arrow-drop-down",
      image: "image",
    }
    return iconMap[fieldType] || "edit"
  }

  const validateField = (field, value) => {
    const errors = []

    if (field.mandatory && (!value || value.toString().trim() === "")) {
      errors.push(`${field.label} is required`)
    }

    if (value && field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors.push("Please enter a valid email address")
      }
    }

    if (value && field.type === "phone") {
      const phoneRegex = /^[\d\s\-+$$$$]+$/
      if (!phoneRegex.test(value)) {
        errors.push("Please enter a valid phone number")
      }
    }

    return errors
  }

  const validateForm = () => {
    const errors = {}
    let isValid = true

    originalData.fields.forEach((field) => {
      const fieldErrors = validateField(field, formData[field.fieldname])
      if (fieldErrors.length > 0) {
        errors[field.fieldname] = fieldErrors
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  const formatDate = (date, includeTime = false) => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    if (!includeTime) {
      return `${year}-${month}-${day}`
    }
    return `${year}-${month}-${day} ${formatTime(d)}`
  }

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
      setShowTimePicker(false)
    }

    if (event.type === 'dismissed') {
      setShowDatePicker(false)
      setShowTimePicker(false)
      return
    }

    if (selectedDate) {
      setTempDateTime(selectedDate)

      if (currentDateField?.type === 'datetime' && datePickerMode === 'date' && Platform.OS === 'android') {
        setDatePickerMode('time')
        setShowTimePicker(true)
        return
      }

      // Handle different field types
      if (currentDateField?.type === 'time') {
        // Convert the selected local time to UTC before saving
        const utcTime = convertLocalToUTC(selectedDate)
        updateFieldValue(currentDateField?.fieldname, utcTime)
      } else if (currentDateField?.type === 'datetime') {
        if (datePickerMode === 'time' || Platform.OS === 'ios') {
          // Convert the entire datetime to UTC
          const utcDateTime = convertDateTimeToUTC(selectedDate)
          updateFieldValue(currentDateField?.fieldname, utcDateTime)
        }
      } else if (currentDateField?.type === 'date') {
        // For date-only fields, use local date format
        const formattedDate = formatDate(selectedDate)
        updateFieldValue(currentDateField?.fieldname, formattedDate)
      }
    }

    if (Platform.OS === 'ios') {
      setShowDatePicker(false)
      setShowTimePicker(false)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)

      const updateData = {}

      originalData.fields.forEach((field) => {
        updateData[field.fieldname] = ""

        // Then update with form data if changed
        if (formData[field.fieldname] !== undefined) {
          updateData[field.fieldname] = formData[field.fieldname]
        }
        if (formData[field.fieldname] !== field.value) {
          updateData[field.fieldname] = formData[field.fieldname]
        }
      })

      // Check if any values in updateData are different from original values
      let hasChanges = false;
      for (const [fieldname, value] of Object.entries(updateData)) {
        const originalField = originalData.fields.find(f => f.fieldname === fieldname);
        if (originalField && value !== originalField.value) {
          hasChanges = true;
          break;
        }
      }

      if (!hasChanges) {
        Alert.alert("No Changes", "No changes were made to save.");
        return;
      }


      // Get current user data for modifiedby field
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      setUserData(userData);


      // Set modifiedby field to current user id
      if (userData && userData.userId) {
        updateData.modifiedby = userData.userId;
      }

      // Set modifiedtime field to current date/time
      updateData.modifiedtime = new Date().toISOString().slice(0, 19).replace('T', ' ');


      // Call the update API
      await updateModuleRecord(moduleName, recordId, updateData)

      Alert.alert("Success", "Record updated successfully!", [
        {
          text: "OK",
          onPress: () => navigation.navigate('ViewScreen', { moduleName, recordId }),
        },
      ])
    } catch (e) {
      Alert.alert("Error", `Failed to save: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const updateFieldValue = (fieldname, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldname]: value,
    }))

    // Clear validation error for this field
    if (validationErrors[fieldname]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldname]
        return newErrors
      })
    }
  }

  const renderInput = (field) => {
    const value = formData[field.fieldname] || ""
    const hasError = validationErrors[field.fieldname]

    const readOnlyFields = ['modifiedby', 'createdtime', 'modifiedtime', 'id'];

    if (readOnlyFields.includes(field.fieldname)) {
      let displayValue = value || 'empty';
    
      if ((field.fieldname === 'createdtime' || field.fieldname === 'modifiedtime') && value) {
        const date = new Date(value.replace(' ', 'T') + 'Z'); 
        displayValue = date.toLocaleString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
        });
      }
    
      return (
        <View style={[styles.input, { backgroundColor: '#f1f5f9' }]}>
          <Text style={{ color: '#64748b' }}>
            {displayValue}
          </Text>
        </View>
      );
    }
    

    switch (field.type) {
      case "boolean":
        return (
          <View style={styles.switchContainer}>
            <Switch
              value={value === "1" || value === true}
              onValueChange={(newValue) => updateFieldValue(field.fieldname, newValue ? "1" : "0")}
              trackColor={{ false: "#e2e8f0", true: "#6366f1" }}
              thumbColor={value === "1" ? "#ffffff" : "#f1f5f9"}
            />
            <Text style={styles.switchLabel}>{value === "1" || value === true ? "Yes" : "No"}</Text>
          </View>
        )

      case "picklist":
        return (
          <TouchableOpacity
            style={[styles.picklistButton, hasError && styles.inputError]}
            onPress={() => {
              setCurrentPicklistField(field)
              setShowPicklistModal(true)
            }}
          >
            <Text style={[styles.picklistText, !value && styles.placeholderText]}>{value || "Select an option"}</Text>
            <Icon name="arrow-drop-down" size={24} color="#64748b" />
          </TouchableOpacity>
        )

      case "text":
        return (
          <TextInput
            style={[styles.textArea, hasError && styles.inputError]}
            value={value}
            onChangeText={(text) => updateFieldValue(field.fieldname, text)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        )

      case "date":
        return (
          <TouchableOpacity
            style={[styles.picklistButton, hasError && styles.inputError]}
            onPress={() => {
              setCurrentDateField(field)
              setDatePickerMode('date')
              setTempDateTime(value ? new Date(value) : new Date())
              setShowDatePicker(true)
            }}
          >
            <Text style={[styles.picklistText, !value && styles.placeholderText]}>
              {value || 'Select date'}
            </Text>
            <Icon name="event" size={24} color="#64748b" />
          </TouchableOpacity>
        )

      case "time":
        return (
          <TouchableOpacity
            style={[styles.picklistButton, hasError && styles.inputError]}
            onPress={() => {
              setCurrentDateField(field)
              setDatePickerMode('time')
              
              // Create a Date object with the local time
              let timeToUse = new Date()
              if (value) {
                // Convert UTC time to local Date object
                const [hours, minutes, seconds] = value.split(':')
                timeToUse = new Date()
                timeToUse.setUTCHours(parseInt(hours, 10))
                timeToUse.setUTCMinutes(parseInt(minutes, 10))
                timeToUse.setUTCSeconds(parseInt(seconds, 10))
              }
              
              setTempDateTime(timeToUse)
              setShowTimePicker(true)
            }}
          >
            <Text style={[styles.picklistText, !value && styles.placeholderText]}>
              {value ? convertUTCToLocal(value) : 'Select time'}
            </Text>
            <Icon name="schedule" size={24} color="#64748b" />
          </TouchableOpacity>
        )
        
      case "datetime":
        const [dateValue, timeValue] = value ? value.split(' ') : ['', '']
        return (
          <View>
            <TouchableOpacity
              style={[styles.picklistButton, hasError && styles.inputError, { marginBottom: 8 }]}
              onPress={() => {
                setCurrentDateField(field)
                setDatePickerMode('date')
                setTempDateTime(value ? new Date(value) : new Date())
                setShowDatePicker(true)
              }}
            >
              <Text style={[styles.picklistText, !dateValue && styles.placeholderText]}>
                {dateValue || 'Select date'}
              </Text>
              <Icon name="event" size={24} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.picklistButton, hasError && styles.inputError]}
              onPress={() => {
                setCurrentDateField(field)
                setDatePickerMode('time')
                setTempDateTime(value ? new Date(value) : new Date())
                setShowTimePicker(true)
              }}
            >
              <Text style={[styles.picklistText, !timeValue && styles.placeholderText]}>
                {timeValue ? convertUTCToLocal(timeValue) : 'Select time'}
              </Text>
              <Icon name="schedule" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        )

      case "email":
        return (
          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            value={value}
            onChangeText={(text) => updateFieldValue(field.fieldname, text)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )

      case "phone":
        return (
          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            value={value}
            onChangeText={(text) => updateFieldValue(field.fieldname, text)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />
        )

      case "owner":
        return (
          <TouchableOpacity
            style={[styles.picklistButton, hasError && styles.inputError]}
            onPress={() => {
              setCurrentPicklistField(field)
              setShowPicklistModal(true)
            }}
          >
            <Text style={[styles.picklistText, !value && styles.placeholderText]}>
              {field.userMap?.[value] || value || "Select user"}
            </Text>
            <Icon name="arrow-drop-down" size={24} color="#64748b" />
          </TouchableOpacity>
        )

      default:
        return (
          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            value={value}
            onChangeText={(text) => updateFieldValue(field.fieldname, text)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
          />
        )
    }
  }

  const filteredFields =
    originalData?.fields?.filter((field) => {
      // First filter out hidden fields
      if (hiddenFields.includes(field.fieldname)) {
        return false;
      }

      // Then apply search filter if there is a search query
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const labelMatch = field.label?.toLowerCase().includes(query);
      const fieldnameMatch = field.fieldname?.toLowerCase().includes(query);

      return labelMatch || fieldnameMatch;
    }) || []

  const renderFieldCard = (field, index) => {
    const hasError = validationErrors[field.fieldname]

    return (
      <View key={index} style={[styles.fieldCard, hasError && styles.fieldCardError]}>
        <View style={styles.fieldHeader}>
          <View style={styles.fieldIconContainer}>
            <Icon name={getFieldIcon(field.type)} size={18} color="#6366f1" />
          </View>
          <View style={styles.fieldInfo}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.mandatory && <Text style={styles.requiredAsterisk}> *</Text>}
            </Text>
            {field.mandatory && (
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryText}>Required</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.fieldInputContainer}>{renderInput(field)}</View>

        {hasError && (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{hasError[0]}</Text>
          </View>
        )}
      </View>
    )
  }

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

  const renderPicklistModal = () => {
    if (!currentPicklistField) return null;

    let options = [];
    if (currentPicklistField.type === 'owner' && currentPicklistField.options && currentPicklistField.userMap) {
      // For owner type, create options from userMap
      options = currentPicklistField.options.map(optionId => ({
        id: optionId.toString(),
        value: optionId,
        label: currentPicklistField.userMap[optionId] || optionId
      }));
    } else if (currentPicklistField.type === 'picklist' && Array.isArray(currentPicklistField.options)) {
      // For regular picklist
      options = currentPicklistField.options.map(option => ({
        id: option.toString(),
        value: option,
        label: option
      }));
    }

    return (
      <Modal
        visible={showPicklistModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPicklistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {currentPicklistField.label}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPicklistModal(false)}
              >
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    formData[currentPicklistField.fieldname] === item.value && styles.selectedOption,
                  ]}
                  onPress={() => {
                    updateFieldValue(currentPicklistField.fieldname, item.value)
                    setShowPicklistModal(false)
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData[currentPicklistField.fieldname] === item.value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {formData[currentPicklistField.fieldname] === item.value && (
                    <Icon name="check" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.optionSeparator} />}
              contentContainerStyle={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderDatePicker = () => {
    if (!showDatePicker && !showTimePicker) return null;

    return (
      <DateTimePicker
        value={tempDateTime}
        mode={datePickerMode}
        is24Hour={true}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={onDateChange}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.container}>
          {renderSearchBar()}
          <View style={styles.loaderContainer}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loaderText}>Loading form...</Text>
              <Text style={styles.loaderSubtext}>Please wait while we prepare the form</Text>
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

    if (!originalData || !originalData.fields || originalData.fields.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconContainer}>
              <Icon name="edit-off" size={64} color="#d1d5db" />
            </View>
            <Text style={styles.emptyStateTitle}>No fields to edit</Text>
            <Text style={styles.emptyStateText}>
              Could not find editable fields for this {moduleName.toLowerCase()} record.
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
            <Text style={styles.statNumber}>{Object.keys(validationErrors).length}</Text>
            <Text style={styles.statLabel}>Errors</Text>
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
            <Text style={styles.title}>Edit {moduleName}</Text>
            <Text style={styles.subtitle}>Record ID: {recordId}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size={20} color="#ffffff" /> : <Icon name="save" size={20} color="#ffffff" />}
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>

      {!loading && !error && originalData?.fields?.length > 0 && renderSearchBar()}

      <View style={styles.content}>{renderContent()}</View>

      {renderPicklistModal()}
      {renderDatePicker()}

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
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveButtonText: {
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
    color: "#6366f1",
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
  fieldCardError: {
    borderColor: "#fecaca",
    backgroundColor: "#fefefe",
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  requiredAsterisk: {
    color: "#ef4444",
    fontWeight: "700",
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
  fieldInputContainer: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#ffffff",
    minHeight: 100,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  picklistButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  picklistText: {
    fontSize: 16,
    color: "#1e293b",
    flex: 1,
  },
  placeholderText: {
    color: "#94a3b8",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginLeft: 6,
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
    paddingVertical: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedOption: {
    backgroundColor: "#f0f4ff",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  selectedOptionText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  optionSeparator: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  optionsList: {
    paddingVertical: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "start",
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
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
  },
  fileButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  fileButtonTitle: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  fileButtonSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  filePreview: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  fileSize: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  removeFileButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  imageOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  imageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  imageOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  imageOptionTextContainer: {
    flex: 1,
  },
  imageOptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  imageOptionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
})

export default EditScreen