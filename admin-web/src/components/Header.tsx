'use client';

import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Bell, LogOut, User, CheckCheck } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
}

export default function Header() {
    const { logout } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/notifications/unread-count'),
            ]);
            setNotifications(notifRes.data);
            setUnreadCount(typeof countRes.data === 'number' ? countRes.data : countRes.data.count || 0);
        } catch (error: any) {
            // Silently ignore 401/403 errors (user not logged in)
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                return;
            }
            console.error('Failed to fetch notifications', error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Mark notification as read
    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    // Get relative time
    const getRelativeTime = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return then.toLocaleDateString();
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.notification-dropdown') && !target.closest('.notification-btn')) {
                setShowNotifications(false);
            }
            if (!target.closest('.profile-dropdown') && !target.closest('.profile-btn')) {
                setShowProfile(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <header
            className="h-16 flex items-center justify-between px-6"
            style={{
                background: 'var(--card)',
                borderBottom: '1px solid var(--border)',
                backdropFilter: 'blur(12px)',
            }}
        >
            {/* Search */}
            <div className="flex-1 max-w-md">
                <input
                    type="search"
                    placeholder="Search members, services..."
                    className="input-modern w-full"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="notification-btn p-2 rounded-lg transition-all relative"
                        style={{ background: 'var(--background-secondary)' }}
                    >
                        <Bell className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </motion.button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="notification-dropdown absolute right-0 mt-2 w-96 glass-card p-0 z-50 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                                        <Bell className="w-4 h-4" />
                                        Notifications
                                        {unreadCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                                        >
                                            <CheckCheck className="w-3 h-3" />
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                {/* Notification List */}
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                No notifications yet
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {notifications.slice(0, 10).map((notif) => (
                                                <motion.div
                                                    key={notif.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                                    onClick={() => !notif.read && markAsRead(notif.id)}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.type === 'success' ? 'bg-green-500' :
                                                            notif.type === 'warning' ? 'bg-amber-500' :
                                                                notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                                            }`} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'}`} style={{ color: 'var(--foreground)' }}>
                                                                    {notif.title}
                                                                </p>
                                                                {!notif.read && (
                                                                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--foreground-muted)' }}>
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-xs mt-1.5" style={{ color: 'var(--foreground-muted)' }}>
                                                                {getRelativeTime(notif.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                {notifications.length > 0 && (
                                    <div className="p-3 border-t text-center" style={{ borderColor: 'var(--border)' }}>
                                        <a
                                            href="/notifications"
                                            className="text-sm text-indigo-500 hover:underline"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View all notifications
                                        </a>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowProfile(!showProfile)}
                        className="profile-btn flex items-center gap-2 p-2 rounded-lg transition-all"
                        style={{ background: 'var(--background-secondary)' }}
                    >
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                    </motion.button>

                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="profile-dropdown absolute right-0 mt-2 w-48 glass-card p-2 z-50"
                            >
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-2 p-3 rounded-lg transition-all hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
