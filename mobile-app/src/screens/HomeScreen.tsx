import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Animated,
    Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    QrCode,
    Calendar,
    Clock,
    Bell,
    TrendingUp,
    Moon,
    Sun,
    ChevronRight,
    Flame,
    Heart,
    Users,
    MessageCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/client';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const colors = theme.colors;
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ streak: 3, thisMonth: 12, totalGiving: 0 });
    const [nextService, setNextService] = useState<any>(null);
    const [greeting, setGreeting] = useState('Hello');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        fetchData();
        updateGreeting();

        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const updateGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    };

    const fetchData = async () => {
        try {
            const [servicesRes] = await Promise.all([
                api.get('/services/occurrences'),
            ]);

            const now = new Date();
            const upcoming = servicesRes.data
                .filter((s: any) => new Date(s.date) >= now)
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (upcoming.length > 0) {
                setNextService(upcoming[0]);
            }
        } catch (error) {
            console.log('Error fetching data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const QuickActionCard = ({ icon: Icon, label, sublabel, gradient, onPress }: any) => (
        <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={gradient}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.quickActionIconBg}>
                    <Icon size={24} color="#fff" />
                </View>
                <Text style={styles.quickActionLabel}>{label}</Text>
                <Text style={styles.quickActionSublabel}>{sublabel}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.surface,
                        borderBottomColor: colors.border,
                        opacity: fadeAnim,
                    },
                ]}
            >
                <View>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
                    <Text style={[styles.userName, { color: colors.text }]}>
                        {user?.firstName} {user?.lastName}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}
                    >
                        {theme.isDark ? (
                            <Sun size={22} color={colors.warning} />
                        ) : (
                            <Moon size={22} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}
                    >
                        <View style={styles.notificationDot} />
                        <Bell size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Hero Section - Next Service */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    <TouchableOpacity activeOpacity={0.9}>
                        <LinearGradient
                            colors={['#001F3F', '#002952', '#003366']}
                            style={styles.heroCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.heroOverlay}>
                                <View style={styles.heroContent}>
                                    <View style={styles.heroBadge}>
                                        <Calendar size={14} color="#fff" />
                                        <Text style={styles.heroBadgeText}>Next Service</Text>
                                    </View>
                                    <Text style={styles.heroTitle}>
                                        {nextService?.template?.name || 'Sunday Worship'}
                                    </Text>
                                    <View style={styles.heroTimeRow}>
                                        <Clock size={16} color="rgba(255,255,255,0.8)" />
                                        <Text style={styles.heroTimeText}>
                                            {nextService
                                                ? new Date(nextService.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })
                                                : 'Sunday, 9:00 AM'
                                            }
                                        </Text>
                                    </View>
                                </View>
                                {/* Decorative circles */}
                                <View style={styles.heroDecor1} />
                                <View style={styles.heroDecor2} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.statIconBg, { backgroundColor: '#f97316' + '20' }]}>
                            <Flame size={22} color="#f97316" />
                        </View>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.streak}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Week Streak</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.statIconBg, { backgroundColor: colors.success + '20' }]}>
                            <TrendingUp size={22} color={colors.success} />
                        </View>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.thisMonth}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Month</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <View style={[styles.statIconBg, { backgroundColor: colors.primary + '20' }]}>
                            <Heart size={22} color={colors.primary} />
                        </View>
                        <Text style={[styles.statValue, { color: colors.text }]}>85</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Score</Text>
                    </View>
                </View>

                {/* Check-In Button */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

                <TouchableOpacity
                    style={styles.checkInButton}
                    onPress={() => navigation.navigate('QRScan')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#001F3F', '#002952']}
                        style={styles.checkInGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.checkInContent}>
                            <View style={styles.checkInIconBg}>
                                <QrCode size={28} color="#fff" />
                            </View>
                            <View style={styles.checkInTextContainer}>
                                <Text style={styles.checkInTitle}>Check-In Now</Text>
                                <Text style={styles.checkInSubtitle}>Scan QR code for attendance</Text>
                            </View>
                        </View>
                        <ChevronRight size={24} color="rgba(255,255,255,0.7)" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Quick Actions Grid */}
                <View style={styles.quickActionsGrid}>
                    <QuickActionCard
                        icon={Heart}
                        label="Give"
                        sublabel="Donate"
                        gradient={['#10b981', '#059669']}
                        onPress={() => navigation.navigate('Giving')}
                    />
                    <QuickActionCard
                        icon={Users}
                        label="Connect"
                        sublabel="Groups"
                        gradient={['#f59e0b', '#d97706']}
                        onPress={() => navigation.navigate('Groups')}
                    />
                    <QuickActionCard
                        icon={MessageCircle}
                        label="Messages"
                        sublabel="Chat"
                        gradient={['#8b5cf6', '#7c3aed']}
                        onPress={() => navigation.navigate('DirectMessages')}
                    />
                </View>

                {/* Recent Activity */}
                <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
                    <View style={styles.activityHeader}>
                        <Text style={[styles.activityTitle, { color: colors.text }]}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('History')}>
                            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
                        <View style={styles.activityContent}>
                            <Text style={[styles.activityText, { color: colors.text }]}>
                                Attended Sunday Service
                            </Text>
                            <Text style={[styles.activityTime, { color: colors.textMuted }]}>
                                Dec 1, 2024
                            </Text>
                        </View>
                    </View>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
                        <View style={styles.activityContent}>
                            <Text style={[styles.activityText, { color: colors.text }]}>
                                Made a donation to Building Fund
                            </Text>
                            <Text style={[styles.activityTime, { color: colors.textMuted }]}>
                                Nov 28, 2024
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Chat Button */}
            <TouchableOpacity
                style={styles.floatingChatButton}
                onPress={() => navigation.navigate('Chat')}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#001F3F', '#002952']}
                    style={styles.floatingChatGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <MessageCircle size={24} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
    },
    userName: {
        fontSize: 26,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconButton: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        zIndex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    heroCard: {
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
    },
    heroOverlay: {
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    heroContent: {
        position: 'relative',
        zIndex: 1,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    heroBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    heroTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroTimeText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 15,
        marginLeft: 8,
        fontWeight: '500',
    },
    heroDecor1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    heroDecor2: {
        position: 'absolute',
        bottom: -60,
        right: 40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statIconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    checkInButton: {
        marginBottom: 16,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#001F3F',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    checkInGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    checkInContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkInIconBg: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    checkInTextContainer: {
        flex: 1,
    },
    checkInTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    checkInSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    quickActionCard: {
        flex: 1,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    quickActionGradient: {
        padding: 20,
        alignItems: 'center',
    },
    quickActionIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    quickActionLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    quickActionSublabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 2,
    },
    activityCard: {
        borderRadius: 18,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    activityTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    activityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 5,
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
    },
    floatingChatButton: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        shadowColor: '#001F3F',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    floatingChatGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
