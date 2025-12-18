import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft,
    Search,
    MessageCircle,
    Users,
    Plus,
    ChevronRight,
    Briefcase,
    User,
    X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';

interface Conversation {
    id: string;
    participant1Id: string;
    participant2Id: string;
    lastMessageAt: string;
    otherParticipant: {
        id: string;
        name: string;
        email: string;
    };
    lastMessage: {
        content: string;
        createdAt: string;
    } | null;
    unreadCount: number;
}

interface MemberItem {
    userId: string;
    memberId: string;
    name: string;
    email: string;
}

interface GroupItem {
    id: string;
    name: string;
    description: string;
    memberCount: number;
}

interface DepartmentItem {
    id: string;
    name: string;
    memberCount: number;
}

type BrowseTab = 'members' | 'groups' | 'departments';

export default function DirectMessagesScreen({ navigation }: any) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { user } = useAuth();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [groups, setGroups] = useState<GroupItem[]>([]);
    const [departments, setDepartments] = useState<DepartmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<BrowseTab>('members');
    const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);
    const [groupMembers, setGroupMembers] = useState<MemberItem[]>([]);
    const [departmentMembers, setDepartmentMembers] = useState<MemberItem[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        fetchConversations();
        fetchMembers();
        fetchGroups();
        fetchDepartments();
    }, []);

    const fetchConversations = async () => {
        try {
            const { data } = await client.get('/direct-messages/conversations');
            setConversations(data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const { data } = await client.get('/direct-messages/members');
            setMembers(data);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        }
    };

    const fetchGroups = async () => {
        try {
            const { data } = await client.get('/groups');
            setGroups(data);
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const { data } = await client.get('/departments');
            setDepartments(data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchGroupMembers = async (groupId: string) => {
        setLoadingMembers(true);
        try {
            const { data } = await client.get(`/groups/${groupId}`);
            // Map group members to MemberItem format
            const mappedMembers = (data.members || []).map((gm: any) => ({
                userId: gm.member.userId,
                memberId: gm.member.id,
                name: `${gm.member.firstName} ${gm.member.lastName}`,
                email: gm.member.email,
            })).filter((m: MemberItem) => m.userId !== user?.id);
            setGroupMembers(mappedMembers);
        } catch (error) {
            console.error('Failed to fetch group members:', error);
            setGroupMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const fetchDepartmentMembers = async (departmentId: string) => {
        setLoadingMembers(true);
        try {
            const { data } = await client.get(`/departments/${departmentId}/members`);
            // Map department members to MemberItem format
            const mappedMembers = (data || []).map((dm: any) => ({
                userId: dm.userId,
                memberId: dm.id,
                name: `${dm.firstName} ${dm.lastName}`,
                email: dm.email,
            })).filter((m: MemberItem) => m.userId !== user?.id);
            setDepartmentMembers(mappedMembers);
        } catch (error) {
            console.error('Failed to fetch department members:', error);
            setDepartmentMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const startConversation = async (participantId: string) => {
        try {
            const { data } = await client.post('/direct-messages/conversations', {
                participantId,
            });
            setShowNewChat(false);
            setSelectedGroup(null);
            setSelectedDepartment(null);
            navigation.navigate('DirectChat', {
                conversationId: data.id,
                otherParticipant: data.otherParticipant,
            });
        } catch (error: any) {
            console.error('Failed to start conversation:', error);
            const errorMessage = error.response?.data?.message || 'Failed to start conversation';
            Alert.alert('Error', errorMessage);
        }
    };

    const openConversation = (conversation: Conversation) => {
        navigation.navigate('DirectChat', {
            conversationId: conversation.id,
            otherParticipant: conversation.otherParticipant,
        });
    };

    const handleGroupSelect = async (group: GroupItem) => {
        try {
            // Get or create group chat
            const { data } = await client.post('/group-chat/chat', {
                type: 'GROUP',
                groupId: group.id,
            });
            setShowNewChat(false);
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

    const handleDepartmentSelect = async (department: DepartmentItem) => {
        try {
            // Get or create department chat
            const { data } = await client.post('/group-chat/chat', {
                type: 'DEPARTMENT',
                departmentId: department.id,
            });
            setShowNewChat(false);
            navigation.navigate('GroupChat', {
                chatId: data.id,
                chatName: department.name,
                chatType: 'DEPARTMENT',
            });
        } catch (error) {
            console.error('Failed to open department chat:', error);
            Alert.alert('Error', 'Failed to open department chat');
        }
    };

    const handleBackFromGroupMembers = () => {
        setSelectedGroup(null);
        setGroupMembers([]);
    };

    const handleBackFromDepartmentMembers = () => {
        setSelectedDepartment(null);
        setDepartmentMembers([]);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderConversation = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={[styles.conversationItem, { backgroundColor: colors.card }]}
            onPress={() => openConversation(item)}
        >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                    {item.otherParticipant.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                    <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                        {item.otherParticipant.name}
                    </Text>
                    {item.lastMessage && (
                        <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                            {formatTime(item.lastMessage.createdAt)}
                        </Text>
                    )}
                </View>
                <View style={styles.conversationPreview}>
                    <Text
                        style={[styles.lastMessage, { color: colors.textMuted }]}
                        numberOfLines={1}
                    >
                        {item.lastMessage?.content || 'No messages yet'}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderMember = ({ item }: { item: MemberItem }) => (
        <TouchableOpacity
            style={[styles.memberItem, { backgroundColor: colors.card }]}
            onPress={() => startConversation(item.userId)}
        >
            <View style={[styles.avatar, { backgroundColor: colors.success }]}>
                <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.memberEmail, { color: colors.textMuted }]}>{item.email}</Text>
            </View>
            <MessageCircle size={20} color={colors.primary} />
        </TouchableOpacity>
    );

    const renderGroup = ({ item }: { item: GroupItem }) => (
        <TouchableOpacity
            style={[styles.groupItem, { backgroundColor: colors.card }]}
            onPress={() => handleGroupSelect(item)}
        >
            <View style={[styles.avatar, { backgroundColor: '#f59e0b' }]}>
                <Users size={22} color="#fff" />
            </View>
            <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.memberEmail, { color: colors.textMuted }]}>
                    {item.memberCount || 0} members
                </Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    const renderDepartment = ({ item }: { item: DepartmentItem }) => (
        <TouchableOpacity
            style={[styles.groupItem, { backgroundColor: colors.card }]}
            onPress={() => handleDepartmentSelect(item)}
        >
            <View style={[styles.avatar, { backgroundColor: '#8b5cf6' }]}>
                <Briefcase size={22} color="#fff" />
            </View>
            <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.memberEmail, { color: colors.textMuted }]}>
                    {item.memberCount || 0} members
                </Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    const renderTabButton = (tab: BrowseTab, icon: any, label: string) => {
        const Icon = icon;
        const isActive = activeTab === tab;
        return (
            <TouchableOpacity
                style={[
                    styles.tabButton,
                    isActive && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                ]}
                onPress={() => {
                    setActiveTab(tab);
                    setSelectedGroup(null);
                    setSelectedDepartment(null);
                }}
            >
                <Icon size={18} color={isActive ? colors.primary : colors.textMuted} />
                <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textMuted }]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <Text style={styles.headerSubtitle}>
                        Chat with church members
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.newChatButton}
                    onPress={() => setShowNewChat(true)}
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* New Chat Modal */}
            {showNewChat && (
                <View style={[styles.newChatOverlay, { backgroundColor: colors.background }]}>
                    <View style={styles.newChatHeader}>
                        <Text style={[styles.newChatTitle, { color: colors.text }]}>
                            {selectedGroup ? `${selectedGroup.name}` :
                                selectedDepartment ? `${selectedDepartment.name}` :
                                    'New Conversation'}
                        </Text>
                        <TouchableOpacity onPress={() => {
                            if (selectedGroup) handleBackFromGroupMembers();
                            else if (selectedDepartment) handleBackFromDepartmentMembers();
                            else setShowNewChat(false);
                        }}>
                            <Text style={{ color: colors.primary }}>
                                {selectedGroup || selectedDepartment ? 'Back' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Browse Tabs */}
                    {!selectedGroup && !selectedDepartment && (
                        <View style={styles.tabsContainer}>
                            {renderTabButton('members', User, 'All Members')}
                            {renderTabButton('groups', Users, 'Groups')}
                            {renderTabButton('departments', Briefcase, 'Departments')}
                        </View>
                    )}

                    <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
                        <Search size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder={
                                selectedGroup ? 'Search group members...' :
                                    selectedDepartment ? 'Search department members...' :
                                        activeTab === 'members' ? 'Search members...' :
                                            activeTab === 'groups' ? 'Search groups...' :
                                                'Search departments...'
                            }
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Show Group Members */}
                    {selectedGroup && (
                        loadingMembers ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={groupMembers}
                                renderItem={renderMember}
                                keyExtractor={(item) => item.userId}
                                contentContainerStyle={styles.membersList}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Users size={48} color={colors.textMuted} />
                                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                            No members in this group
                                        </Text>
                                    </View>
                                }
                            />
                        )
                    )}

                    {/* Show Department Members */}
                    {selectedDepartment && (
                        loadingMembers ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={departmentMembers}
                                renderItem={renderMember}
                                keyExtractor={(item) => item.userId}
                                contentContainerStyle={styles.membersList}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Briefcase size={48} color={colors.textMuted} />
                                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                            No members in this department
                                        </Text>
                                    </View>
                                }
                            />
                        )
                    )}

                    {/* Show All Members Tab */}
                    {!selectedGroup && !selectedDepartment && activeTab === 'members' && (
                        <FlatList
                            data={filteredMembers}
                            renderItem={renderMember}
                            keyExtractor={(item) => item.userId}
                            contentContainerStyle={styles.membersList}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <User size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                        No members found
                                    </Text>
                                </View>
                            }
                        />
                    )}

                    {/* Show Groups Tab */}
                    {!selectedGroup && !selectedDepartment && activeTab === 'groups' && (
                        <FlatList
                            data={filteredGroups}
                            renderItem={renderGroup}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.membersList}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Users size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                        No groups found
                                    </Text>
                                </View>
                            }
                        />
                    )}

                    {/* Show Departments Tab */}
                    {!selectedGroup && !selectedDepartment && activeTab === 'departments' && (
                        <FlatList
                            data={filteredDepartments}
                            renderItem={renderDepartment}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.membersList}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Briefcase size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                        No departments found
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
            )}

            {/* Conversations List */}
            {!showNewChat && (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.conversationsList}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MessageCircle size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                No conversations yet
                            </Text>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                Start a conversation with a church member
                            </Text>
                            <TouchableOpacity
                                style={[styles.startButton, { backgroundColor: colors.primary }]}
                                onPress={() => setShowNewChat(true)}
                            >
                                <Plus size={20} color="#fff" />
                                <Text style={styles.startButtonText}>New Conversation</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    newChatButton: {
        padding: 8,
    },
    conversationsList: {
        padding: 16,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    conversationInfo: {
        flex: 1,
        marginLeft: 14,
    },
    conversationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    conversationName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    timestamp: {
        fontSize: 12,
        marginLeft: 8,
    },
    conversationPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    lastMessage: {
        fontSize: 14,
        flex: 1,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    separator: {
        height: 8,
    },
    newChatOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
    },
    newChatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    newChatTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 6,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    membersList: {
        padding: 16,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
    },
    memberInfo: {
        flex: 1,
        marginLeft: 12,
    },
    memberName: {
        fontSize: 15,
        fontWeight: '600',
    },
    memberEmail: {
        fontSize: 13,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 20,
        gap: 8,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
