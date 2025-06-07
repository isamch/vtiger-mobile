import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:8080/vtigercrm/api';

export const getRelatedModuleData = async (moduleName, recordId, relatedModule) => {
    try {
        const sessionName = await AsyncStorage.getItem('sessionName');
        if (!sessionName) {
            console.error('No session name found');
            return [];
        }

        const response = await fetch(
            `${API_BASE_URL}/modules/getRelated.php?` + 
            `sessionName=${sessionName}&` +
            `moduleName=${encodeURIComponent(moduleName)}&` +
            `id=${encodeURIComponent(recordId)}&` +
            `relatedModule=${encodeURIComponent(relatedModule)}`
        );

        if (!response.ok) {
            console.error('API request failed:', response.status);
            return [];
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
            console.error('API returned error or no data:', result.error || 'No data');
            return [];
        }

        // Handle nested array structure
        let records = result.data;
        if (Array.isArray(records) && Array.isArray(records[0])) {
            records = records[0];
        }

        return records || [];

    } catch (error) {
        console.error('Error fetching related module data:', error);
        return [];
    }
};
