import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android Emulator: 10.0.2.2
// iOS Simulator: localhost
// Physical Device: LAN IP (Update this if testing on device)
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
                    headers: { Authorization: `Bearer ${refreshToken}` }
                });

                await SecureStore.setItemAsync('accessToken', data.access_token);
                await SecureStore.setItemAsync('refreshToken', data.refresh_token);

                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return client(originalRequest);
            } catch (refreshError) {
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default client;
