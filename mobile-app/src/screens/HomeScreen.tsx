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
    ImageBackground,
    Platform,
    StatusBar
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
    ArrowRight,
    MapPin
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/client';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const colors = theme.colors;
    const [refreshing, setRefreshing] = useState(false);
    const [nextService, setNextService] = useState<any>(null);
    const [greeting, setGreeting] = useState('Hello');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        fetchData();
        updateGreeting();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
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

    const QuickActionItem = ({ icon: Icon, label, onPress, color }: any) => (
        <TouchableOpacity style={styles.actionItem} onPress={onPress}>
            <View style={[styles.actionIconContainer, { backgroundColor: color + '15' }]}>
                <Icon size={24} color={color} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

            {/* Background Decor */}
            <View style={[styles.bgDecorCircle, { backgroundColor: theme.isDark ? '#1e293b' : '#E2E8F0' }]} />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting},</Text>
                        <Text style={[styles.userName, { color: colors.text }]}>
                            {user?.firstName || 'Member'}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={toggleTheme}
                            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            {theme.isDark ? <Sun size={20} color={colors.secondary} /> : <Moon size={20} color={colors.primary} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <Bell size={20} color={colors.text} />
                            <View style={styles.badge} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                >
                    {/* Hero Card - Next Service */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <TouchableOpacity activeOpacity={0.95} style={styles.heroCardContainer}>
                            <LinearGradient
                                colors={theme.gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.heroCard}
                            >
                                <View style={styles.heroHeader}>
                                    <View style={styles.liveTag}>
                                        <View style={styles.liveDot} />
                                        <Text style={styles.liveText}>UPCOMING</Text>
                                    </View>
                                    <Calendar size={18} color="rgba(255,255,255,0.7)" />
                                </View>

                                <Text style={styles.serviceTitle}>
                                    {nextService?.template?.name || 'Sunday Worship Service'}
                                </Text>

                                <View style={styles.serviceInfoRow}>
                                    <View style={styles.serviceInfoItem}>
                                        <Clock size={16} color={colors.secondary} />
                                        <Text style={styles.serviceInfoText}>
                                            {nextService
                                                ? new Date(nextService.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })
                                                : 'Sun, 9:00 AM'
                                            }
                                        </Text>
                                    </View>
                                    <View style={styles.dividerDot} />
                                    <View style={styles.serviceInfoItem}>
                                        <MapPin size={16} color={colors.secondary} />
                                        <Text style={styles.serviceInfoText}>Main Auditorium</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                            {/* Card Shadow */}
                            <View style={[styles.heroShadow, { shadowColor: colors.primary }]} />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Quick Access Grid */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                        <View style={[styles.grid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <QuickActionItem
                                icon={QrCode}
                                label="Check-In"
                                color={colors.primary}
                                onPress={() => navigation.navigate('QRScan')}
                            />
                            <QuickActionItem
                                icon={Heart}
                                label="Give"
                                color={colors.error}
                                onPress={() => navigation.navigate('Giving')}
                            />
                            <QuickActionItem
                                icon={Users}
                                label="Groups"
                                color={colors.warning}
                                onPress={() => navigation.navigate('Groups')}
                            />
                            <QuickActionItem
                                icon={MessageCircle}
                                label="Chat"
                                color={colors.info}
                                onPress={() => navigation.navigate('DirectMessages')}
                            />
                        </View>
                    </View>

                    {/* Monthly Stats */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Activity</Text>
                        <View style={styles.statsRow}>
                            <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>3</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Wk Streak</Text>
                                <Flame size={16} color={colors.warning} style={styles.statIcon} />
                            </View>
                            <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>12</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Attended</Text>
                                <TrendingUp size={16} color={colors.success} style={styles.statIcon} />
                            </View>
                        </View>
                    </View>

                    {/* Bottom Spacer for Tab Bar */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgDecorCircle: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 12,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        backgroundColor: '#ef4444',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    heroCardContainer: {
        marginBottom: 32,
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        minHeight: 180,
        justifyContent: 'space-between',
        zIndex: 2,
    },
    heroShadow: {
        position: 'absolute',
        bottom: -15,
        left: 20,
        right: 20,
        height: 40,
        borderRadius: 20,
        opacity: 0.3,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFD700',
        marginRight: 6,
    },
    liveText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    serviceTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginTop: 10,
        marginBottom: 10,
        lineHeight: 32,
    },
    serviceInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceInfoText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '500',
    },
    dividerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 12,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: 24,
        padding: 16,
        gap: 16,
        borderWidth: 1,
    },
    actionItem: {
        width: '46%', // Approximate for 2 columns with gap
        aspectRatio: 1.1, // Slightly wider than tall
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statBox: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    statValue: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    statIcon: {
        position: 'absolute',
        top: 20,
        right: 20,
        opacity: 0.8,
    },
});
