import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
    ActionSheetIOS,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Send,
    ArrowLeft,
    Paperclip,
    Smile,
    Users,
    FileText,
    MoreVertical,
    Phone,
    Video,
    Image as ImageIcon,
    Camera,
    File,
    Mic,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import client from '../api/client';
import EmojiPicker from '../components/EmojiPicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3333';

interface GroupChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    memberId?: string;
    content: string;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
    createdAt: string;
}

interface RouteParams {
    chatId: string;
    chatName: string;
    chatType: 'GROUP' | 'DEPARTMENT';
}

// Logo-based gradient colors
// Primary: Deep Navy Blue (#001F3F)
// Secondary: Golden Yellow (#FFBF00)
const GRADIENTS = {
    primary: ['#001F3F', '#003366'], // Navy gradient
    header: ['#001F3F', '#002952', '#003366'], // Rich navy header
    messageSent: ['#001F3F', '#002952'], // Navy message bubbles
    success: ['#10b981', '#059669'],
    gold: ['#FFBF00', '#F5A623', '#FFD700'], // Gold accent gradient
};

// Avatar colors for different users - brand-aligned
const AVATAR_COLORS = [
    ['#001F3F', '#003366'], // Navy
    ['#FFBF00', '#FFD700'], // Gold
    ['#3B82F6', '#2563EB'], // Blue
    ['#10b981', '#059669'], // Green
    ['#8B5CF6', '#7C3AED'], // Purple
    ['#a18cd1', '#fbc2eb'],
];

const getAvatarGradient = (name: string) => {
    const index = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

export default function GroupChatScreen({ navigation, route }: any) {
    const { chatId, chatName, chatType } = route.params as RouteParams;
    const { theme } = useTheme();
    const colors = theme.colors;
    const { user } = useAuth();

    const [messages, setMessages] = useState<GroupChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const lastMessageTime = useRef<string | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const attachMenuAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchChat();
        startPolling();

        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, []);

    const toggleAttachMenu = () => {
        const toValue = showAttachMenu ? 0 : 1;
        setShowAttachMenu(!showAttachMenu);
        Animated.spring(attachMenuAnim, {
            toValue,
            tension: 65,
            friction: 10,
            useNativeDriver: true,
        }).start();
    };

    const fetchChat = async () => {
        try {
            const { data } = await client.get(`/group-chat/${chatId}`);
            setMessages(data.messages || []);
            if (data.messages?.length > 0) {
                lastMessageTime.current = data.messages[data.messages.length - 1].createdAt;
            }
            await client.post(`/group-chat/${chatId}/read`);
        } catch (error) {
            console.error('Failed to fetch chat:', error);
            Alert.alert('Error', 'Failed to load chat');
        } finally {
            setLoading(false);
        }
    };

    const startPolling = () => {
        pollInterval.current = setInterval(async () => {
            if (lastMessageTime.current) {
                try {
                    const { data } = await client.get(
                        `/group-chat/${chatId}/messages/new?since=${encodeURIComponent(lastMessageTime.current)}`
                    );
                    if (data?.length > 0) {
                        setMessages((prev) => [...prev, ...data]);
                        lastMessageTime.current = data[data.length - 1].createdAt;
                        await client.post(`/group-chat/${chatId}/read`);
                    }
                } catch (e) {
                    console.log('Polling error:', e);
                }
            }
        }, 3000);
    };

    const sendMessage = async () => {
        if (!inputText.trim() && !uploading) return;

        const content = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            const { data } = await client.post(`/group-chat/${chatId}/messages`, { content });
            setMessages((prev) => [...prev, data]);
            lastMessageTime.current = data.createdAt;
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message');
            setInputText(content);
        } finally {
            setSending(false);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setInputText((prev) => prev + emoji);
    };

    const pickImage = async () => {
        toggleAttachMenu();
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow access to photos');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            uploadAndSend(result.assets[0].uri, 'image');
        }
    };

    const takePhoto = async () => {
        toggleAttachMenu();
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow camera access');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled && result.assets[0]) {
            uploadAndSend(result.assets[0].uri, 'image');
        }
    };

    const pickDocument = async () => {
        toggleAttachMenu();
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
        if (!result.canceled && result.assets?.[0]) {
            uploadAndSend(result.assets[0].uri, 'document', result.assets[0].name);
        }
    };

    const uploadAndSend = async (uri: string, type: string, name?: string) => {
        setUploading(true);
        try {
            const formData = new FormData();
            const filename = name || uri.split('/').pop() || 'file';
            formData.append('file', {
                uri,
                type: type === 'image' ? 'image/jpeg' : 'application/octet-stream',
                name: filename,
            } as any);

            const { data: uploadData } = await client.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { data } = await client.post(`/group-chat/${chatId}/messages`, {
                content: type === 'image' ? '📷 Photo' : `📎 ${filename}`,
                attachmentUrl: uploadData.url,
                attachmentType: type,
                attachmentName: filename,
            });
            setMessages((prev) => [...prev, data]);
            lastMessageTime.current = data.createdAt;
        } catch (error) {
            console.error('Failed to upload:', error);
            Alert.alert('Error', 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const shouldShowDateHeader = (index: number) => {
        if (index === 0) return true;
        const currentDate = new Date(messages[index].createdAt).toDateString();
        const prevDate = new Date(messages[index - 1].createdAt).toDateString();
        return currentDate !== prevDate;
    };

    const renderMessage = ({ item, index }: { item: GroupChatMessage; index: number }) => {
        const isFirst = index === 0 || messages[index - 1].senderId !== item.senderId;
        const isLast = index === messages.length - 1 || messages[index + 1]?.senderId !== item.senderId;
        const isUser = item.senderId === user?.id;
        const hasImage = item.attachmentType === 'image' && item.attachmentUrl;
        const hasDocument = item.attachmentType === 'document' && item.attachmentUrl;
        const showDate = shouldShowDateHeader(index);

        return (
            <>
                {showDate && (
                    <View style={styles.dateHeaderContainer}>
                        <View style={[styles.dateHeaderBadge, { backgroundColor: colors.surfaceElevated }]}>
                            <Text style={[styles.dateHeaderText, { color: colors.textSecondary }]}>
                                {formatDateHeader(item.createdAt)}
                            </Text>
                        </View>
                    </View>
                )}
                <Animated.View
                    style={[
                        styles.messageRow,
                        isUser ? styles.userMessageRow : styles.otherMessageRow,
                        isFirst && { marginTop: 12 },
                        !isLast && { marginBottom: 2 },
                    ]}
                >
                    {/* Avatar for other users */}
                    {!isUser && isFirst && (
                        <LinearGradient
                            colors={getAvatarGradient(item.senderName)}
                            style={styles.avatar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.avatarText}>
                                {item.senderName.charAt(0).toUpperCase()}
                            </Text>
                        </LinearGradient>
                    )}
                    {!isUser && !isFirst && <View style={styles.avatarPlaceholder} />}

                    {/* Message bubble */}
                    <View
                        style={[
                            styles.messageBubble,
                            isUser ? styles.userBubble : [styles.otherBubble, { backgroundColor: colors.card }],
                            isFirst && (isUser ? styles.userBubbleFirst : styles.otherBubbleFirst),
                            isLast && (isUser ? styles.userBubbleLast : styles.otherBubbleLast),
                        ]}
                    >
                        {isUser ? (
                            <LinearGradient
                                colors={GRADIENTS.messageSent}
                                style={styles.bubbleGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {hasImage && (
                                    <Image
                                        source={{ uri: `${API_BASE}${item.attachmentUrl}` }}
                                        style={styles.attachmentImage}
                                        resizeMode="cover"
                                    />
                                )}
                                {hasDocument && (
                                    <View style={styles.documentContainer}>
                                        <FileText size={20} color="#fff" />
                                        <Text style={styles.documentName} numberOfLines={1}>
                                            {item.attachmentName || 'Document'}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.userMessageText}>{item.content}</Text>
                                <Text style={styles.userTimestamp}>{formatTime(item.createdAt)}</Text>
                            </LinearGradient>
                        ) : (
                            <>
                                {isFirst && (
                                    <Text style={[styles.senderName, { color: getAvatarGradient(item.senderName)[0] }]}>
                                        {item.senderName}
                                    </Text>
                                )}
                                {hasImage && (
                                    <Image
                                        source={{ uri: `${API_BASE}${item.attachmentUrl}` }}
                                        style={styles.attachmentImage}
                                        resizeMode="cover"
                                    />
                                )}
                                {hasDocument && (
                                    <View style={[styles.documentContainer, { backgroundColor: colors.inputBackground }]}>
                                        <FileText size={20} color={colors.primary} />
                                        <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
                                            {item.attachmentName || 'Document'}
                                        </Text>
                                    </View>
                                )}
                                <Text style={[styles.messageText, { color: colors.text }]}>{item.content}</Text>
                                <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                                    {formatTime(item.createdAt)}
                                </Text>
                            </>
                        )}
                    </View>
                </Animated.View>
            </>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading chat...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Premium Header */}
            <LinearGradient
                colors={GRADIENTS.header}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerCenter} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                        style={styles.headerAvatar}
                    >
                        <Users size={20} color="#fff" />
                    </LinearGradient>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{chatName}</Text>
                        <View style={styles.headerStatus}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.headerSubtitle}>
                                {chatType === 'GROUP' ? 'Group Chat' : 'Department Chat'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerActionBtn}>
                        <MoreVertical size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Messages */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 30}
            >
                <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <LinearGradient
                                    colors={['rgba(99,102,241,0.1)', 'rgba(139,92,246,0.1)']}
                                    style={styles.emptyIcon}
                                >
                                    <Users size={40} color={colors.primary} />
                                </LinearGradient>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    Start the conversation!
                                </Text>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    Be the first to send a message to this group
                                </Text>
                            </View>
                        }
                    />
                </Animated.View>

                {/* Attachment Menu */}
                {showAttachMenu && (
                    <Animated.View
                        style={[
                            styles.attachMenu,
                            { backgroundColor: colors.card },
                            {
                                opacity: attachMenuAnim,
                                transform: [{ scale: attachMenuAnim }],
                            },
                        ]}
                    >
                        <TouchableOpacity style={styles.attachOption} onPress={pickImage}>
                            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.attachOptionIcon}>
                                <ImageIcon size={22} color="#fff" />
                            </LinearGradient>
                            <Text style={[styles.attachOptionText, { color: colors.text }]}>Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.attachOption} onPress={takePhoto}>
                            <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.attachOptionIcon}>
                                <Camera size={22} color="#fff" />
                            </LinearGradient>
                            <Text style={[styles.attachOptionText, { color: colors.text }]}>Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.attachOption} onPress={pickDocument}>
                            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.attachOptionIcon}>
                                <File size={22} color="#fff" />
                            </LinearGradient>
                            <Text style={[styles.attachOptionText, { color: colors.text }]}>Document</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Input Area */}
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
                        <TouchableOpacity style={styles.inputButton} onPress={() => setShowEmojiPicker(true)}>
                            <Smile size={24} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={2000}
                        />

                        <TouchableOpacity style={styles.inputButton} onPress={toggleAttachMenu}>
                            {uploading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Paperclip size={24} color={colors.textMuted} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || sending}
                    >
                        <LinearGradient
                            colors={inputText.trim() ? GRADIENTS.primary : ['#94a3b8', '#94a3b8']}
                            style={styles.sendButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Send size={20} color="#fff" style={{ marginLeft: 2 }} />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                {Platform.OS === 'android' && <View style={{ height: 20 }} />}
            </KeyboardAvoidingView>

            {/* Emoji Picker */}
            <EmojiPicker
                visible={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onSelect={handleEmojiSelect}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
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
        fontWeight: '500',
    },

    // Header Styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
        position: 'relative',
        overflow: 'hidden',
    },
    headerDecor1: {
        position: 'absolute',
        top: -30,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerDecor2: {
        position: 'absolute',
        bottom: -40,
        left: 30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInfo: {
        marginLeft: 12,
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.3,
    },
    headerStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80',
        marginRight: 6,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Messages
    messagesList: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 16,
    },
    dateHeaderContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateHeaderBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dateHeaderText: {
        fontSize: 12,
        fontWeight: '600',
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    userMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    avatarPlaceholder: {
        width: 36,
        marginRight: 8,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Message Bubbles
    messageBubble: {
        maxWidth: SCREEN_WIDTH * 0.75,
        borderRadius: 20,
        overflow: 'hidden',
    },
    userBubble: {
        borderBottomRightRadius: 6,
    },
    otherBubble: {
        borderBottomLeftRadius: 6,
    },
    userBubbleFirst: {
        borderTopRightRadius: 20,
    },
    otherBubbleFirst: {
        borderTopLeftRadius: 20,
    },
    userBubbleLast: {
        borderBottomRightRadius: 20,
    },
    otherBubbleLast: {
        borderBottomLeftRadius: 20,
    },
    bubbleGradient: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    senderName: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
        marginHorizontal: 14,
        marginTop: 10,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
        marginHorizontal: 14,
        marginVertical: 6,
    },
    userMessageText: {
        fontSize: 15,
        lineHeight: 21,
        color: '#fff',
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
        marginHorizontal: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    userTimestamp: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        textAlign: 'right',
        fontWeight: '500',
    },
    attachmentImage: {
        width: SCREEN_WIDTH * 0.55,
        height: 180,
        borderRadius: 12,
        marginBottom: 8,
    },
    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 10,
    },
    documentName: {
        fontSize: 13,
        flex: 1,
        fontWeight: '500',
        color: '#fff',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 90,
        height: 90,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Attachment Menu
    attachMenu: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        paddingHorizontal: 24,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    attachOption: {
        alignItems: 'center',
        gap: 8,
    },
    attachOptionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    attachOptionText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Input Area
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 10,
        borderTopWidth: 1,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 24,
        paddingHorizontal: 4,
        minHeight: 48,
    },
    inputButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 120,
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    sendButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    sendButtonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
