// src/config/api.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================
// Match the working backend URL used by the tours list page
// ============================================
const YOUR_COMPUTER_IP = '10.230.251.235';

export const getBaseUrl = () => {
    if (Platform.OS === 'android' && __DEV__) {
        return 'http://10.0.2.2';
    }

    if (Platform.OS === 'ios' && __DEV__) {
        return 'http://localhost';
    }

    return `http://${YOUR_COMPUTER_IP}`;
};

export const getBackendBaseUrl = () => `${getBaseUrl()}/Back%20End`;

export const getApiUrl = (endpoint) => {
    const baseUrl = getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const fullUrl = `${baseUrl}/${cleanEndpoint}`;
    console.log('🔗 API URL:', fullUrl);
    return fullUrl;
};

export const API_ENDPOINTS = {
    GET_ALL_TRIPS: 'Back%20End/manage_trips.php?action=list',
    GET_TRIP_BY_ID: (id) => `Back%20End/manage_trips.php?action=get&id=${id}`,
    CREATE_TRIP: 'Back%20End/manage_trips.php?action=create',
    UPDATE_TRIP: (id) => `Back%20End/manage_trips.php?action=update&id=${id}`,
};