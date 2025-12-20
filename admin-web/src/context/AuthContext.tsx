'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../lib/api';

interface User {
    id: string;
    email: string;
    role: string;
    member?: {
        firstName: string;
        lastName: string;
    };
}

interface AuthContextType {
    user: User | null;
    login: (tokens: { access_token: string; refresh_token: string }) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            // Bypass auth check for public routes
            // Check both Next.js pathname and window location for robustness
            // Use includes() instead of startsWith() to handle potential locale prefixes (e.g. /en/public)
            const currentPath = pathname || window.location.pathname;
            if (currentPath?.toLowerCase().includes('/public') || currentPath?.toLowerCase().includes('/check-in')) {
                console.log('Public route detected, skipping auth check');
                setIsLoading(false);
                return;
            }

            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsLoading(false);
                if (pathname !== '/login') {
                    router.push('/login');
                }
                return;
            }

            try {
                const { data } = await api.get('/auth/me');
                setUser(data);
            } catch (error) {
                console.error('Failed to fetch user', error);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (pathname !== '/login') {
                    router.push('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [pathname, router]);

    const login = async (tokens: { access_token: string; refresh_token: string }) => {
        console.log('Login called with tokens');
        localStorage.setItem('accessToken', tokens.access_token);
        localStorage.setItem('refreshToken', tokens.refresh_token);

        try {
            console.log('Fetching user details...');
            const { data } = await api.get('/auth/me');
            console.log('User details fetched:', data);
            setUser(data);
            console.log('Redirecting to dashboard...');
            router.push('/');
        } catch (error) {
            console.error('Login failed during user fetch:', error);
            // Optional: clear tokens if fetch fails?
            // localStorage.removeItem('accessToken');
            // localStorage.removeItem('refreshToken');
            throw error; // Propagate to caller
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
