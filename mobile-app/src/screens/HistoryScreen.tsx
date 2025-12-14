import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Animated,
    SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import {
    Calendar,
    Clock,
    CheckCircle,
    Filter,
    ChevronDown,
    MapPin,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AttendanceRecord {
    id: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    serviceOccurrence?: {
        template?: {
            name: string;
        };
        date: string;
    };
}

export default function HistoryScreen() {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        thisMonth: 0,
        streak: 0,
    });
    const [selectedFilter, setSelectedFilter] = useState('all');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchAttendance();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchAttendance = async () => {
        try {
            const meRes = await client.get('/auth/me');
            const userData = meRes.data;

            if (userData.member) {
                const memberId = userData.member.id;
                const res = await client.get(`/attendance/member/${memberId}`);
                setAttendance(res.data || []);

                // Calculate stats
                const now = new Date();
                const thisMonthCount = (res.data || []).filter((a: AttendanceRecord) => {
                    const date = new Date(a.date);
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length;

                setStats({
                    total: res.data?.length || 0,
                    thisMonth: thisMonthCount,
                    streak: 3, // Placeholder
                });
            }
        } catch (error) {
            console.error('Failed to fetch attendance', error);
        } finally {
            setLoading(false);
        }
    };

    const groupByMonth = (records: AttendanceRecord[]) => {
        const grouped: { [key: string]: AttendanceRecord[] } = {};

        records.forEach((record) => {
            const date = new Date(record.date);
            const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!grouped[monthYear]) {
                grouped[monthYear] = [];
            }
            grouped[monthYear].push(record);
        });

        return Object.keys(grouped).map((key) => ({
            title: key,
            data: grouped[key],
        }));
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const sections = groupByMonth(attendance);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Attendance History</Text>
                    <Text style={styles.headerSubtitle}>Track your church participation</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.thisMonth}</Text>
                        <Text style={styles.statLabel}>This Month</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.streak}</Text>
                        <Text style={styles.statLabel}>Streak 🔥</Text>
                    </View>
                </View>

                {/* Decorative elements */}
                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />
            </LinearGradient>

            {/* Filter Bar */}
            <View style={[styles.filterBar, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        selectedFilter === 'all' && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => setSelectedFilter('all')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            { color: selectedFilter === 'all' ? colors.primary : colors.textSecondary },
                        ]}
                    >
                        All
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        selectedFilter === 'sunday' && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => setSelectedFilter('sunday')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            { color: selectedFilter === 'sunday' ? colors.primary : colors.textSecondary },
                        ]}
                    >
                        Sunday Services
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        selectedFilter === 'special' && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => setSelectedFilter('special')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            { color: selectedFilter === 'special' ? colors.primary : colors.textSecondary },
                        ]}
                    >
                        Special Events
                    </Text>
                </TouchableOpacity>
            </View>

            <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
                {attendance.length > 0 ? (
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.id}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
                            </View>
                        )}
                        renderItem={({ item, index }) => (
                            <View style={[styles.attendanceCard, { backgroundColor: colors.card }]}>
                                <View style={[styles.checkIcon, { backgroundColor: colors.success + '15' }]}>
                                    <CheckCircle size={22} color={colors.success} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={[styles.serviceName, { color: colors.text }]}>
                                        {item.serviceOccurrence?.template?.name || 'Church Service'}
                                    </Text>
                                    <View style={styles.cardMeta}>
                                        <View style={styles.metaItem}>
                                            <Calendar size={13} color={colors.textMuted} />
                                            <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                                {new Date(item.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </Text>
                                        </View>
                                        {item.checkInTime && (
                                            <View style={styles.metaItem}>
                                                <Clock size={13} color={colors.textMuted} />
                                                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                                    {new Date(item.checkInTime).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    })}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
                                    <Text style={[styles.statusText, { color: colors.success }]}>Present</Text>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        stickySectionHeadersEnabled
                    />
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                        <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '15' }]}>
                            <Calendar size={40} color={colors.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            No Attendance Records
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Check in at your next service to start building your attendance history
                        </Text>
                    </View>
                )}
            </Animated.View>
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
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        position: 'relative',
        overflow: 'hidden',
    },
    headerContent: {
        position: 'relative',
        zIndex: 1,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 16,
        position: 'relative',
        zIndex: 1,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerDecor1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerDecor2: {
        position: 'absolute',
        bottom: -20,
        left: 40,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    filterBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        paddingVertical: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    attendanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    checkIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardContent: {
        flex: 1,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    cardMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        marginLeft: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyState: {
        margin: 20,
        alignItems: 'center',
        padding: 40,
        borderRadius: 20,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
});
