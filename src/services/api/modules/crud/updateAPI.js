import AsyncStorage from '@react-native-async-storage/async-storage';

export const updateModuleRecord = async (moduleName, recordId, formData) => {
  try {
    const sessionName = await AsyncStorage.getItem('sessionName');

    console.log(
      'formData', formData
    )

    const response = await fetch(`http://10.0.2.2:8080/vtigercrm/api/modules/update.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionName,
        moduleName,
        recordId,
        fields: formData
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error updating module record:", error);
    throw error;
  }
}; 