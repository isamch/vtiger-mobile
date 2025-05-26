import AsyncStorage from '@react-native-async-storage/async-storage';


export const getModuleData = async (moduleName) => {
  try {
    const sessionName = await AsyncStorage.getItem('sessionName');
    
    // console.log('sessionName', sessionName);
    // console.log('moduleName', moduleName);

    const response = await fetch(`http://10.0.2.2:8080/vtigercrm/api/modules/index.php?sessionName=${sessionName}&moduleName=${moduleName}`);
    
    // http://10.0.2.2:8080/vtigercrm/api/auth/login.php
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data;

  } catch (error) {
    console.error("Error fetching module data:", error);
    throw error; 
  }

}; 