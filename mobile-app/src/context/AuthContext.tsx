import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';
import { User } from '../types';

interface AuthContextData {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        // Skip auth check on startup - just go to login
        // This prevents the app from getting stuck
        setIsLoading(false);
    }

    async function signIn(email: string, password: string) {
        try {
            const { data } = await client.post('/auth/local/signin', {
                email: email.trim().toLowerCase(),
                password
            });
            await SecureStore.setItemAsync('accessToken', data.access_token);
            await SecureStore.setItemAsync('refreshToken', data.refresh_token);

            const userRes = await client.get('/auth/me');
            setUser(userRes.data);
        } catch (error) {
            throw error;
        }
    }

    async function signOut() {
        try {
            await client.post('/auth/logout');
        } catch (e) {
            // Ignore logout error
        }
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
