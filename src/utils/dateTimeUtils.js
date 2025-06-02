// Utility functions for handling dates and times consistently across the app

/**
 * Converts a UTC time string (HH:MM:SS) to local time string (24h format)
 * @param {string} utcTimeStr - Time in UTC (HH:MM:SS format)
 * @returns {string} Local time in HH:MM format (24-hour)
 */
export const convertUTCToLocal = (utcTimeStr) => {
  if (!utcTimeStr) return '';

  try {
    const now = new Date();
    const [hours, minutes, seconds] = utcTimeStr.split(':').map(Number);
    // Create a date object in UTC with the given time and today's date
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, seconds || 0));
    // Convert to local time string, 24h format without AM/PM
    return utcDate.toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (error) {
    console.error('Error converting UTC to local time:', error);
    return utcTimeStr;
  }
};

/**
 * Converts a local Date object to UTC time string (HH:MM:SS)
 * @param {Date} localDate - Local Date object
 * @returns {string} Time in UTC (HH:MM:SS format)
 */
export const convertLocalToUTC = (localDate) => {
  try {
    const hours = localDate.getUTCHours();
    const minutes = localDate.getUTCMinutes();
    const seconds = localDate.getUTCSeconds();

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error converting local to UTC time:', error);
    return '';
  }
};

/**
 * Formats a date object or string for display
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (!includeTime) {
      return `${year}-${month}-${day}`;
    }

    // الوقت المحلي مباشرة بدون تعديل يدوي
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Converts a local datetime string or Date object to UTC datetime string
 * @param {string|Date} localDateTime - Local datetime string or Date object
 * @returns {string} UTC datetime string (YYYY-MM-DD HH:MM:SS)
 */
export const convertDateTimeToUTC = (localDateTime) => {
  if (!localDateTime) return '';

  try {
    const date = new Date(localDateTime);

    const utcYear = date.getUTCFullYear();
    const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const utcDay = String(date.getUTCDate()).padStart(2, '0');

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${utcYear}-${utcMonth}-${utcDay} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error converting datetime to UTC:', error);
    return String(localDateTime);
  }
};

/**
 * Creates a Date object from a time string in local timezone
 * @param {string} timeStr - Time string in HH:MM:SS format
 * @returns {Date} Date object with the specified local time
 */
export const createLocalTimeDate = (timeStr) => {
  const now = new Date();
  const [hoursStr, minutes, seconds] = timeStr.split(':').map(Number);

  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hoursStr, minutes, seconds || 0);
  return date;
};
