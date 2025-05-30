import AsyncStorage from '@react-native-async-storage/async-storage';

export const getModuleFields = async (moduleName) => {
  try {

    const sessionName = await AsyncStorage.getItem('sessionName');
    if (!sessionName) {
      throw new Error('Session not found. Please login again.');
    }

    // Make API request
    const response = await fetch(
      `http://10.0.2.2:8080/vtigercrm/api/modules/getFields.php?sessionName=${sessionName}&moduleName=${moduleName}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch module fields');
    }

    const data = await response.json();

    if (!data.fields || !Array.isArray(data.fields)) {
      throw new Error('Invalid response format: fields array not found');
    }

    return data;
  } catch (error) {
    console.error('Error getting module fields:', error);
    throw error;
  }
}; 