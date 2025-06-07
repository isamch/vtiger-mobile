export const getModuleIcon = (moduleName) => {
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

export const getModuleColor = (moduleName) => {
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

export const getStatusBadgeStyle = (status) => {
  if (!status) return { backgroundColor: "#f1f5f9" }

  const statusLower = String(status).toLowerCase()
  if (statusLower.includes("completed") || statusLower.includes("closed") || statusLower.includes("won")) {
    return { backgroundColor: "#dcfce7" }
  }
  if (statusLower.includes("pending") || statusLower.includes("open") || statusLower.includes("in progress")) {
    return { backgroundColor: "#fef3c7" }
  }
  if (statusLower.includes("cancelled") || statusLower.includes("failed") || statusLower.includes("lost")) {
    return { backgroundColor: "#fef2f2" }
  }
  if (statusLower.includes("new") || statusLower.includes("draft")) {
    return { backgroundColor: "#dbeafe" }
  }
  return { backgroundColor: "#f1f5f9" }
}

export const getStatusTextStyle = (status) => {
  if (!status) return { color: "#64748b" }

  const statusLower = String(status).toLowerCase()
  if (statusLower.includes("completed") || statusLower.includes("closed") || statusLower.includes("won")) {
    return { color: "#166534" }
  }
  if (statusLower.includes("pending") || statusLower.includes("open") || statusLower.includes("in progress")) {
    return { color: "#d97706" }
  }
  if (statusLower.includes("cancelled") || statusLower.includes("failed") || statusLower.includes("lost")) {
    return { color: "#dc2626" }
  }
  if (statusLower.includes("new") || statusLower.includes("draft")) {
    return { color: "#1d4ed8" }
  }
  return { color: "#64748b" }
}

export const getDisplayValue = (field) => {
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
    default:
      return String(field.value)
  }
} 