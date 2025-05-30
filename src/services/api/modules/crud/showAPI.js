import AsyncStorage from '@react-native-async-storage/async-storage';


export const getModuleDetails = async (moduleName, id) => {
	try {
		const sessionName = await AsyncStorage.getItem('sessionName');



		const response = await fetch(`http://10.0.2.2:8080/vtigercrm/api/modules/show.php?sessionName=${sessionName}&moduleName=${moduleName}&id=${id}`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();


		return data;

	} catch (error) {
		console.error('Error fetching module details:', error);
		throw error;
	}
};

