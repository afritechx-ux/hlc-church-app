import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
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
    Megaphone,
    Calendar,
    Heart,
    X,
    ChevronRight,
    Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';

const { width } = Dimensions.get('window');

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
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        fetchNotifications();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
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
        }
    };

    const handleNotificationPress = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        setSelectedNotification(notification);
        setShowDetailModal(true);
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle size={22} color="#10b981" />,
                    color: '#10b981',
                    bg: '#10b98115',
                    label: 'Success'
                };
            case 'warning':
                return {
                    icon: <AlertCircle size={22} color="#f59e0b" />,
                    color: '#f59e0b',
                    bg: '#f59e0b15',
                    label: 'Alert'
                };
            case 'error':
                return {
                    icon: <AlertCircle size={22} color="#ef4444" />,
                    color: '#ef4444',
                    bg: '#ef444415',
                    label: 'Important'
                };
            default:
                return {
                    icon: <Megaphone size={22} color="#6366f1" />,
                    color: '#6366f1',
                    bg: '#6366f115',
                    label: 'Announcement'
                };
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const formatFullDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
        const typeConfig = getTypeConfig(item.type);

        return (
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <TouchableOpacity
                    style={[
                        styles.notificationCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: item.read ? colors.border : typeConfig.color + '40',
                            borderWidth: item.read ? 1 : 2,
                        },
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                >
                    {/* Unread Indicator */}
                    {!item.read && (
                        <View style={[styles.unreadIndicator, { backgroundColor: typeConfig.color }]} />
                    )}

                    {/* Icon Container */}
                    <View style={[styles.iconContainer, { backgroundColor: typeConfig.bg }]}>
                        {typeConfig.icon}
                    </View>

                    {/* Content */}
                    <View style={styles.contentContainer}>
                        <View style={styles.titleRow}>
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
                            {!item.read && (
                                <View style={[styles.newBadge, { backgroundColor: typeConfig.color }]}>
                                    <Text style={styles.newBadgeText}>NEW</Text>
                                </View>
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

                        <View style={styles.metaRow}>
                            <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
                                <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                                    {typeConfig.label}
                                </Text>
                            </View>
                            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                                {formatTime(item.createdAt)}
                            </Text>
                        </View>
                    </View>

                    {/* Chevron */}
                    <ChevronRight size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <LinearGradient
                colors={['#6366f115', '#8b5cf615']}
                style={styles.emptyIconContainer}
            >
                <Bell size={48} color="#6366f1" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Inbox is Empty</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Messages and announcements from{'\n'}the church will appear here
            </Text>
            <View style={styles.emptyFeatures}>
                {[
                    { icon: <Megaphone size={16} color="#6366f1" />, text: 'Announcements' },
                    { icon: <Calendar size={16} color="#10b981" />, text: 'Event Reminders' },
                    { icon: <Heart size={16} color="#ef4444" />, text: 'Personal Messages' },
                ].map((feature, i) => (
                    <View key={i} style={[styles.featureItem, { backgroundColor: colors.surface }]}>
                        {feature.icon}
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                            {feature.text}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                        Loading messages...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Premium Header */}
            <LinearGradient
                colors={theme.gradients.primary}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Decorative Elements */}
                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />

                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerTitleRow}>
                            <Text style={styles.headerTitle}>Inbox</Text>
                            {unreadCount > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.headerSubtitle}>
                            {unreadCount > 0
                                ? `You have ${unreadCount} new message${unreadCount > 1 ? 's' : ''}`
                                : 'All caught up! ✨'}
                        </Text>
                    </View>

                    {unreadCount > 0 && (
                        <TouchableOpacity
                            style={styles.markAllButton}
                            onPress={markAllAsRead}
                            activeOpacity={0.8}
                        >
                            <CheckCheck size={16} color="#fff" />
                            <Text style={styles.markAllText}>Mark All Read</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{notifications.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{unreadCount}</Text>
                        <Text style={styles.statLabel}>Unread</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{notifications.length - unreadCount}</Text>
                        <Text style={styles.statLabel}>Read</Text>
                    </View>
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
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHandle} />

                        {selectedNotification && (
                            <>
                                {/* Modal Header */}
                                <View style={styles.modalHeader}>
                                    <View style={[
                                        styles.modalTypeIcon,
                                        { backgroundColor: getTypeConfig(selectedNotification.type).bg }
                                    ]}>
                                        {getTypeConfig(selectedNotification.type).icon}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowDetailModal(false)}
                                        style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}
                                    >
                                        <X size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Modal Body */}
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                                        {selectedNotification.title}
                                    </Text>

                                    <View style={styles.modalMeta}>
                                        <View style={[
                                            styles.modalTypeBadge,
                                            { backgroundColor: getTypeConfig(selectedNotification.type).bg }
                                        ]}>
                                            <Text style={[
                                                styles.modalTypeBadgeText,
                                                { color: getTypeConfig(selectedNotification.type).color }
                                            ]}>
                                                {getTypeConfig(selectedNotification.type).label}
                                            </Text>
                                        </View>
                                        <Text style={[styles.modalDate, { color: colors.textMuted }]}>
                                            {formatFullDate(selectedNotification.createdAt)}
                                        </Text>
                                    </View>

                                    <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

                                    <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                                        {selectedNotification.message}
                                    </Text>
                                </ScrollView>

                                {/* Modal Footer */}
                                <TouchableOpacity
                                    onPress={() => setShowDetailModal(false)}
                                    style={styles.modalDismissBtn}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={theme.gradients.primary}
                                        style={styles.modalDismissBtnGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.modalDismissBtnText}>Dismiss</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        paddingTop: 16,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    headerDecor1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    headerDecor2: {
        position: 'absolute',
        bottom: -20,
        left: -30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerLeft: {},
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#fff',
        letterSpacing: -0.5,
    },
    unreadBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 28,
        alignItems: 'center',
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255,255,255,0.75)',
        marginTop: 6,
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    markAllText: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Medium',
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyListContent: {
        flex: 1,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
    },
    unreadIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    contentContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-SemiBold',
        flex: 1,
    },
    newBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'PlusJakartaSans-Bold',
        letterSpacing: 0.5,
    },
    notificationMessage: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Regular',
        lineHeight: 20,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeBadgeText: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    timestamp: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Regular',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: 'PlusJakartaSans-Bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-Regular',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    emptyFeatures: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    featureText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '75%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTypeIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: 'PlusJakartaSans-Bold',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    modalMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    modalTypeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    modalTypeBadgeText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    modalDate: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Regular',
    },
    modalDivider: {
        height: 1,
        marginBottom: 20,
    },
    modalMessage: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Regular',
        lineHeight: 26,
    },
    modalDismissBtn: {
        marginTop: 24,
    },
    modalDismissBtnGradient: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalDismissBtnText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
    },
});
