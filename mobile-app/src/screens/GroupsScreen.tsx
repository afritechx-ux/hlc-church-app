import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Animated,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import {
    Users,
    Calendar,
    MapPin,
    ChevronRight,
    UserPlus,
    UserMinus,
    Search,
    Filter,
    MessageCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Group {
    id: string;
    name: string;
    description?: string;
    type?: string;
    meetingDay?: string;
    meetingTime?: string;
    location?: string;
    members?: any[];
    leaderId?: string;
}

export default function GroupsScreen({ navigation }: any) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [groups, setGroups] = useState<Group[]>([]);
    const [myGroups, setMyGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState('all');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchData();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchData = async () => {
        try {
            // Get user's member ID
            const meRes = await client.get('/auth/me');
            if (meRes.data.member) {
                setMemberId(meRes.data.member.id);
            }

            // Get all groups
            const groupsRes = await client.get('/groups');
            setGroups(groupsRes.data || []);

            // Get member's groups
            if (meRes.data.member) {
                try {
                    const myGroupsRes = await client.get(`/groups/member/${meRes.data.member.id}`);
                    setMyGroups((myGroupsRes.data || []).map((g: Group) => g.id));
                } catch (e) {
                    console.log('Could not fetch member groups');
                }
            }
        } catch (error) {
            console.error('Failed to fetch groups', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleJoinGroup = async (groupId: string) => {
        if (!memberId) {
            Alert.alert('Error', 'Please complete your profile to join groups');
            return;
        }

        try {
            await client.post(`/groups/${groupId}/members`, { memberId });
            setMyGroups([...myGroups, groupId]);
            Alert.alert('🎉 Joined!', 'You have successfully joined this group');
        } catch (error) {
            console.error('Failed to join group', error);
            Alert.alert('Error', 'Failed to join group. Please try again.');
        }
    };

    const handleLeaveGroup = async (groupId: string) => {
        if (!memberId) return;

        Alert.alert(
            'Leave Group',
            'Are you sure you want to leave this group?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.delete(`/groups/${groupId}/members/${memberId}`);
                            setMyGroups(myGroups.filter((id) => id !== groupId));
                            Alert.alert('Left Group', 'You have left this group');
                        } catch (error) {
                            console.error('Failed to leave group', error);
                            Alert.alert('Error', 'Failed to leave group');
                        }
                    },
                },
            ]
        );
    };

    const handleOpenGroupChat = async (group: Group) => {
        try {
            // Get or create group chat
            const { data } = await client.post('/group-chat/chat', {
                type: 'GROUP',
                groupId: group.id,
            });
            navigation.navigate('GroupChat', {
                chatId: data.id,
                chatName: group.name,
                chatType: 'GROUP',
            });
        } catch (error) {
            console.error('Failed to open group chat:', error);
            Alert.alert('Error', 'Failed to open group chat');
        }
    };

    const filteredGroups = groups.filter((group) => {
        if (selectedFilter === 'my') return myGroups.includes(group.id);
        if (selectedFilter === 'available') return !myGroups.includes(group.id);
        return true;
    });

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={['#f59e0b', '#d97706', '#b45309']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Connect Groups</Text>
                    <Text style={styles.headerSubtitle}>Join a community, grow together</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{groups.length}</Text>
                        <Text style={styles.statLabel}>Groups</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{myGroups.length}</Text>
                        <Text style={styles.statLabel}>Joined</Text>
                    </View>
                </View>

                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />
            </LinearGradient>

            {/* Filter Tabs */}
            <View style={[styles.filterBar, { backgroundColor: colors.surface }]}>
                {['all', 'my', 'available'].map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterChip,
                            selectedFilter === filter && { backgroundColor: colors.primary + '15' },
                        ]}
                        onPress={() => setSelectedFilter(filter)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: selectedFilter === filter ? colors.primary : colors.textSecondary },
                            ]}
                        >
                            {filter === 'all' ? 'All Groups' : filter === 'my' ? 'My Groups' : 'Available'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => {
                            const isJoined = myGroups.includes(group.id);
                            return (
                                <View
                                    key={group.id}
                                    style={[styles.groupCard, { backgroundColor: colors.card }]}
                                >
                                    <View style={styles.groupHeader}>
                                        <View style={[styles.groupIcon, { backgroundColor: '#f59e0b' + '20' }]}>
                                            <Users size={24} color="#f59e0b" />
                                        </View>
                                        <View style={styles.groupInfo}>
                                            <Text style={[styles.groupName, { color: colors.text }]}>
                                                {group.name}
                                            </Text>
                                            {group.type && (
                                                <View style={[styles.typeBadge, { backgroundColor: colors.primary + '15' }]}>
                                                    <Text style={[styles.typeText, { color: colors.primary }]}>
                                                        {group.type}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        {isJoined && (
                                            <View style={[styles.joinedBadge, { backgroundColor: colors.success + '15' }]}>
                                                <Text style={[styles.joinedText, { color: colors.success }]}>
                                                    Joined
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {group.description && (
                                        <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>
                                            {group.description}
                                        </Text>
                                    )}

                                    <View style={styles.groupMeta}>
                                        {group.meetingDay && (
                                            <View style={styles.metaItem}>
                                                <Calendar size={14} color={colors.textMuted} />
                                                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                                    {group.meetingDay} {group.meetingTime && `at ${group.meetingTime}`}
                                                </Text>
                                            </View>
                                        )}
                                        {group.location && (
                                            <View style={styles.metaItem}>
                                                <MapPin size={14} color={colors.textMuted} />
                                                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                                    {group.location}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.metaItem}>
                                            <Users size={14} color={colors.textMuted} />
                                            <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                                {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.groupActions}>
                                        {isJoined ? (
                                            <>
                                                <TouchableOpacity
                                                    style={[styles.chatButton, { backgroundColor: colors.primary + '15' }]}
                                                    onPress={() => handleOpenGroupChat(group)}
                                                >
                                                    <MessageCircle size={16} color={colors.primary} />
                                                    <Text style={[styles.chatButtonText, { color: colors.primary }]}>
                                                        Chat
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.leaveButton, { borderColor: colors.error }]}
                                                    onPress={() => handleLeaveGroup(group.id)}
                                                >
                                                    <UserMinus size={16} color={colors.error} />
                                                    <Text style={[styles.leaveButtonText, { color: colors.error }]}>
                                                        Leave
                                                    </Text>
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.joinButton}
                                                onPress={() => handleJoinGroup(group.id)}
                                            >
                                                <LinearGradient
                                                    colors={['#f59e0b', '#d97706']}
                                                    style={styles.joinButtonGradient}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                >
                                                    <UserPlus size={16} color="#fff" />
                                                    <Text style={styles.joinButtonText}>Join Group</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                            <View style={[styles.emptyIconBg, { backgroundColor: '#f59e0b' + '15' }]}>
                                <Users size={40} color="#f59e0b" />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                {selectedFilter === 'my' ? 'No Groups Joined' : 'No Groups Available'}
                            </Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {selectedFilter === 'my'
                                    ? 'Join a group to connect with others'
                                    : 'Check back later for new groups'}
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
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
        justifyContent: 'center',
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    groupCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    groupIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    joinedBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    joinedText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    groupDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    groupMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        marginLeft: 6,
    },
    groupActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    joinButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    joinButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    leaveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginRight: 8,
    },
    chatButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    emptyState: {
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
