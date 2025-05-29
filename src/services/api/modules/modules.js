import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModulesArray } from './modulesArray';

export const Modules = async ( ) => {
  try {
    const sessionName = await AsyncStorage.getItem('sessionName');
    
    const response = await fetch(`http://10.0.2.2:8080/vtigercrm/api/modules/get_modules.php?sessionName=${sessionName}`);

    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const filteredModules = ModulesArray.filter(module =>
      data.data.includes(module.name)
    );

    return filteredModules;

  } catch (error) {
    console.error("Error fetching modules name :", error);
    throw error; 
  }

}; 


