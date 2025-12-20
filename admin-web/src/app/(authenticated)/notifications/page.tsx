'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Bell, Check, CheckCheck, Trash2, Filter, Search,
    Info, AlertTriangle, AlertCircle, CheckCircle,
    Clock, Calendar, X
} from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            toast.success('Marked as read');
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        let result = [...notifications];

        // Read/unread filter
        if (filter === 'unread') {
            result = result.filter(n => !n.read);
        } else if (filter === 'read') {
            result = result.filter(n => n.read);
        }

        // Type filter
        if (typeFilter !== 'all') {
            result = result.filter(n => n.type === typeFilter);
        }

        // Search
        if (searchTerm) {
            result = result.filter(n =>
                n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return result;
    }, [notifications, filter, typeFilter, searchTerm]);

    // Stats
    const stats = useMemo(() => ({
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        info: notifications.filter(n => n.type === 'info').length,
        success: notifications.filter(n => n.type === 'success').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        error: notifications.filter(n => n.type === 'error').length,
    }), [notifications]);

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

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return CheckCircle;
            case 'warning': return AlertTriangle;
            case 'error': return AlertCircle;
            default: return Info;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
            case 'warning': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
            case 'error': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
            default: return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
        }
    };

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                    >
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                                    <Bell className="w-7 h-7 text-white" />
                                </div>
                                Notifications
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                View and manage all your notifications
                            </p>
                        </div>
                        {stats.unread > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="btn-primary flex items-center gap-2"
                            >
                                <CheckCheck className="w-5 h-5" />
                                Mark All as Read ({stats.unread})
                            </button>
                        )}
                    </motion.div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                        {[
                            { label: 'Total', value: stats.total, icon: Bell, color: 'from-gray-500 to-gray-600' },
                            { label: 'Unread', value: stats.unread, icon: Clock, color: 'from-indigo-500 to-purple-500' },
                            { label: 'Info', value: stats.info, icon: Info, color: 'from-blue-500 to-cyan-500' },
                            { label: 'Success', value: stats.success, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
                            { label: 'Warnings', value: stats.warning, icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
                            { label: 'Errors', value: stats.error, icon: AlertCircle, color: 'from-red-500 to-rose-500' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                                        <stat.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                                            {stat.value}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-4 mb-6"
                    >
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    className="input-modern w-full pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Read/Unread Filter */}
                            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--background)' }}>
                                {['all', 'unread', 'read'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${filter === f
                                                ? 'bg-indigo-500 text-white'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            {/* Type Filter */}
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="input-modern"
                            >
                                <option value="all">All Types</option>
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Notifications List */}
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="glass-card p-4">
                                    <div className="flex gap-4">
                                        <div className="skeleton w-10 h-10 rounded-lg" />
                                        <div className="flex-1">
                                            <div className="skeleton h-5 w-1/3 mb-2" />
                                            <div className="skeleton h-4 w-full mb-2" />
                                            <div className="skeleton h-3 w-24" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card p-12 text-center"
                        >
                            <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                                No notifications
                            </h3>
                            <p style={{ color: 'var(--foreground-muted)' }}>
                                {filter !== 'all' || typeFilter !== 'all' || searchTerm
                                    ? 'No notifications match your filters'
                                    : "You're all caught up!"}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {filteredNotifications.map((notif, index) => {
                                const Icon = getTypeIcon(notif.type);
                                return (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={`glass-card p-4 ${!notif.read ? 'ring-2 ring-indigo-500/20' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2.5 rounded-xl ${getTypeColor(notif.type)}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h4 className={`font-medium ${!notif.read ? 'font-semibold' : ''}`} style={{ color: 'var(--foreground)' }}>
                                                            {notif.title}
                                                            {!notif.read && (
                                                                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-indigo-500" />
                                                            )}
                                                        </h4>
                                                        <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {!notif.read && (
                                                            <button
                                                                onClick={() => markAsRead(notif.id)}
                                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-4 h-4 text-green-500" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(notif.type)}`}>
                                                        {notif.type}
                                                    </span>
                                                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                                                        <Clock className="w-3 h-3" />
                                                        {getRelativeTime(notif.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
