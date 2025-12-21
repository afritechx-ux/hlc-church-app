import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import {
    Mail,
    MailOpen,
    CheckCheck,
    Bell,
    AlertCircle,
    Info,
    CheckCircle,
    Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
}

export default function InboxScreen({ navigation }: any) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const [notifResponse, countResponse] = await Promise.all([
                client.get('/notifications'),
                client.get('/notifications/unread-count'),
            ]);
            setNotifications(notifResponse.data);
            setUnreadCount(countResponse.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            Alert.alert('Error', 'Failed to load messages');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await client.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await client.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            Alert.alert('Error', 'Failed to mark all messages as read');
        }
    };

    const handleNotificationPress = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        // Show full message in an alert for now
        Alert.alert(notification.title, notification.message, [{ text: 'OK' }]);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} color={colors.success} />;
            case 'warning':
                return <AlertCircle size={20} color={colors.warning} />;
            case 'error':
                return <AlertCircle size={20} color={colors.error} />;
            default:
                return <Info size={20} color={colors.info} />;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) {
            return 'Just now';
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                {
                    backgroundColor: item.read ? colors.card : colors.surface,
                    borderLeftColor: item.read ? colors.border : colors.primary,
                    borderLeftWidth: item.read ? 0 : 4,
                },
            ]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <View style={styles.iconContainer}>
                        {item.read ? (
                            <MailOpen size={20} color={colors.textMuted} />
                        ) : (
                            <Mail size={20} color={colors.primary} />
                        )}
                    </View>
                    <View style={styles.headerText}>
                        <Text
                            style={[
                                styles.notificationTitle,
                                {
                                    color: colors.text,
                                    fontWeight: item.read ? '500' : '700',
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <View style={styles.metaRow}>
                            {getTypeIcon(item.type)}
                            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                                {formatTime(item.createdAt)}
                            </Text>
                        </View>
                    </View>
                    {!item.read && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                </View>
                <Text
                    style={[
                        styles.notificationMessage,
                        { color: item.read ? colors.textMuted : colors.textSecondary },
                    ]}
                    numberOfLines={2}
                >
                    {item.message}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Bell size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Messages from the church will appear here
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Inbox</Text>
                        <Text style={styles.headerSubtitle}>
                            {unreadCount > 0
                                ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                                : 'All caught up!'}
                        </Text>
                    </View>
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            style={styles.markAllButton}
                            onPress={markAllAsRead}
                        >
                            <CheckCheck size={18} color="#fff" />
                            <Text style={styles.markAllText}>Read All</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    notifications.length === 0 && styles.emptyListContent,
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={renderEmptyState}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingTop: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    markAllText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    emptyListContent: {
        flex: 1,
    },
    notificationCard: {
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    notificationContent: {},
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    headerText: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timestamp: {
        fontSize: 12,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 32,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});
