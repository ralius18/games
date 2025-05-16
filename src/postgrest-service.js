// src/dynamo-service.js
import axios from 'axios';

const API_URL = 'http://192.168.118.202:3344/http://192.168.118.202:3000'; // Replace with your PostgREST endpoint

export const fetchItems = async (tableName) => {
    try {
        const response = await axios.get(`${API_URL}/${tableName}`);
	if (tableName !== 'sessions') {
            return response.data.sort((a, b) => {
                // First, sort by is_favorite (true comes before false)
                if (a.is_favorite === b.is_favorite) {
                    // If is_favorite is the same, sort by title alphabetically
                    return a.name.localeCompare(b.name);
                }
                return b.is_favorite - a.is_favorite; // true comes before false
            });
	} else {
	    return response.data
	}
    } catch (error) {
        console.error(`Failed to fetch items from ${tableName}`, error);
        throw error;
    }
};

export const addItem = async (tableName, item) => {
    try {
        const response = await axios.post(`${API_URL}/${tableName}`, item, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to add item to ${tableName}`, error);
        throw error;
    }
};

export const updateItem = async (tableName, id, content) => {
    try {
        const response = await axios.patch(`${API_URL}/${tableName}?id=eq.${id}`, content, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to patch item ${id} in ${tableName}`, error);
        throw error;
    }
};

export const fetchGamesSortedByName = async () => {
    try {
        const response = await axios.get(`${API_URL}/games`, {
            params: {
                order: 'name.asc', // Sorting by name in ascending order
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch games sorted by name', error);
        throw error;
    }
};

export const deleteItem = async (tableName, id) => {
    try {
        const response = await axios.delete(`${API_URL}/${tableName}?id=eq.${id}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to delete item ${id} from ${tableName}`)
    }
}

// Fetch platforms with PostgREST
export const fetchPlatforms = async () => fetchItems('platforms');

// Fetch friends with PostgREST
export const fetchFriends = async () => fetchItems('friends');
