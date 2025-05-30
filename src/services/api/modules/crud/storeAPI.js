import AsyncStorage from '@react-native-async-storage/async-storage';

export const createModuleRecord = async (moduleName, fields) => {
  try {
    // Get session name from storage
    const sessionName = await AsyncStorage.getItem('sessionName');
    if (!sessionName) {
      throw new Error('Session not found. Please login again.');
    }

    // Prepare request body
    const requestBody = {
      sessionName,
      moduleName,
      fields
    };





    // Make API request
    const response = await fetch(`http://10.0.2.2:8080/vtigercrm/api/modules/store.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Failed to create record');
    }

    const data = await response.json();



    if (data.success === false) {
      throw new Error(data.error?.message || 'Failed to create record');
    }

 
    return data.id;

  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
}; 