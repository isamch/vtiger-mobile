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

        let records = result.data;

        // Ensure records is always an array of records, where each record is an array of fields.
        // If result.data is an array but its first element is NOT an array, it means it's a single record (array of fields).
        // In this case, wrap it to make it an array of records.
        if (Array.isArray(records) && records.length > 0 && !Array.isArray(records[0])) {
            records = [records];
        }
        // If it's already an array of arrays, or an empty array, keep as is.

        return Array.isArray(records) ? records : [];

    } catch (error) {
        console.error('Error fetching related module data:', error);
        return [];
    }
};
