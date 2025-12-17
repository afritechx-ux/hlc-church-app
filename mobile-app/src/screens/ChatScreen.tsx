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
    Animated,
    Alert,
    Image,
    ActionSheetIOS,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Send,
    ArrowLeft,
    Bot,
    Phone,
    Video,
    UserCog,
    Paperclip,
    Smile,
    FileText,
    CheckCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import client from '../api/client';
import EmojiPicker from '../components/EmojiPicker';

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    isAdmin: boolean;
    readAt: string | null;
    createdAt: string;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
}

interface Chat {
    id: string;
    userId: string;
    status: string;
    isEscalated: boolean;
    messages: Message[];
}

const QUICK_REPLIES = [
    "How do I check in?",
    "How do I donate?",
    "Service times",
    "Join a group",
    "Talk to Admin",
];

export default function ChatScreen({ navigation }: any) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { user } = useAuth();

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const typingAnim = useRef(new Animated.Value(0)).current;
    const lastMessageTime = useRef<string | null>(null);

    const API_BASE = client.defaults.baseURL?.replace('/api', '') || 'http://localhost:3333';

    useEffect(() => {
        initializeChat();
    }, []);

    useEffect(() => {
        if (!chat?.id) return;

        const pollMessages = async () => {
            try {
                if (lastMessageTime.current) {
                    const { data } = await client.get(`/chat/${chat.id}/messages/new`, {
                        params: { since: lastMessageTime.current }
                    });
                    if (data.length > 0) {
                        setMessages(prev => {
                            const existingIds = new Set(prev.map(m => m.id));
                            const newMessages = data.filter((m: Message) => !existingIds.has(m.id));
                            if (newMessages.length > 0) {
                                lastMessageTime.current = newMessages[newMessages.length - 1].createdAt;
                                return [...prev, ...newMessages];
                            }
                            return prev;
                        });
                    }
                }
            } catch (error) {
                console.log('Poll error:', error);
            }
        };

        const interval = setInterval(pollMessages, 3000);
        return () => clearInterval(interval);
    }, [chat?.id]);

    useEffect(() => {
        if (isTyping) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(typingAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            typingAnim.setValue(0);
        }
    }, [isTyping]);

    const initializeChat = async () => {
        try {
            setLoading(true);
            const { data } = await client.post('/chat', {});
            setChat(data);
            setMessages(data.messages || []);
            if (data.messages?.length > 0) {
                lastMessageTime.current = data.messages[data.messages.length - 1].createdAt;
            }
        } catch (error: any) {
            console.error('Failed to initialize chat:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            Alert.alert('Connection Error', `Failed to connect: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || !chat?.id || sending) return;

        const tempId = Date.now().toString();
        const tempMessage: Message = {
            id: tempId,
            content: text.trim(),
            senderId: user?.id || '',
            senderName: user?.firstName || 'You',
            isAdmin: false,
            readAt: null,
            createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMessage]);
        setInputText('');
        setSending(true);
        setIsTyping(true);

        try {
            const { data } = await client.post(`/chat/${chat.id}/messages`, {
                content: text.trim()
            });

            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
            lastMessageTime.current = data.createdAt;

            // Artificial delay for AI/Admin 'typing' simulation
            setTimeout(async () => {
                setIsTyping(false);
                try {
                    const { data: chatData } = await client.get(`/chat/${chat.id}`);
                    setMessages(chatData.messages);
                    if (chatData.messages.length > 0) {
                        lastMessageTime.current = chatData.messages[chatData.messages.length - 1].createdAt;
                    }
                } catch (e) {
                    console.log('Failed to refresh:', e);
                }
            }, 1000);

        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            Alert.alert('Error', 'Failed to send message. Please try again.');
            setIsTyping(false);
        } finally {
            setSending(false);
        }
    };

    const handleQuickReply = (reply: string) => {
        sendMessage(reply);
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleCall = (type: 'voice' | 'video') => {
        Alert.alert(
            'Coming Soon',
            `${type === 'voice' ? 'Voice' : 'Video'} calling will be available in a future update!`,
            [{ text: 'OK' }]
        );
    };

    const handleEmojiSelect = (emoji: string) => {
        setInputText(prev => prev + emoji);
    };

    const handleAttachment = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Photo Library', 'Take Photo', 'Document'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) pickImage();
                    else if (buttonIndex === 2) takePhoto();
                    else if (buttonIndex === 3) pickDocument();
                }
            );
        } else {
            Alert.alert('Attach File', 'Choose attachment type', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Photo Library', onPress: pickImage },
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Document', onPress: pickDocument },
            ]);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadAndSendAttachment(result.assets[0].uri, 'image');
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow camera access');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadAndSendAttachment(result.assets[0].uri, 'image');
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            });

            if (!result.canceled && result.assets[0]) {
                await uploadAndSendAttachment(result.assets[0].uri, 'document', result.assets[0].name);
            }
        } catch (error) {
            console.error('Document picker error:', error);
        }
    };

    const uploadAndSendAttachment = async (uri: string, type: string, name?: string) => {
        if (!chat?.id) return;

        setUploading(true);
        try {
            const formData = new FormData();
            const filename = name || uri.split('/').pop() || 'attachment';
            const match = /\.(\w+)$/.exec(filename);
            const fileType = match ? `${type}/${match[1]}` : `${type}/jpeg`;

            formData.append('file', {
                uri,
                name: filename,
                type: fileType,
            } as any);

            const uploadResponse = await client.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { url, type: attachmentType, name: attachmentName } = uploadResponse.data;

            const { data } = await client.post(`/chat/${chat.id}/messages`, {
                content: type === 'image' ? '📷 Image' : `📄 ${attachmentName || 'Document'}`,
                attachmentUrl: url,
                attachmentType,
                attachmentName: attachmentName || filename,
            });

            setMessages(prev => [...prev, data]);
            lastMessageTime.current = data.createdAt;

        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Error', 'Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isFirst = index === 0 || messages[index - 1].isAdmin !== item.isAdmin;
        const isUser = !item.isAdmin;
        const hasImage = item.attachmentType === 'image' && item.attachmentUrl;
        const hasDocument = item.attachmentType === 'document' && item.attachmentUrl;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.aiMessageContainer,
                    isFirst && { marginTop: 12 },
                ]}
            >
                {!isUser && isFirst && (
                    <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                        <Bot size={16} color="#fff" />
                    </View>
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isUser
                            ? [styles.userBubble, { backgroundColor: colors.primary }]
                            : [styles.aiBubble, { backgroundColor: colors.card }],
                        !isFirst && !isUser && { marginLeft: 40 },
                    ]}
                >
                    {hasImage && (
                        <Image
                            source={{ uri: `${API_BASE}${item.attachmentUrl}` }}
                            style={styles.attachmentImage}
                            resizeMode="cover"
                        />
                    )}

                    {hasDocument && (
                        <View style={styles.documentAttachment}>
                            <FileText size={20} color={isUser ? '#fff' : colors.primary} />
                            <Text
                                style={[styles.documentName, { color: isUser ? '#fff' : colors.primary }]}
                                numberOfLines={1}
                            >
                                {item.attachmentName || 'Document'}
                            </Text>
                        </View>
                    )}

                    {(!hasImage || item.content !== '📷 Image') && (
                        <Text style={[styles.messageText, { color: isUser ? '#fff' : colors.text }]}>
                            {item.content}
                        </Text>
                    )}

                    <View style={styles.messageFooter}>
                        <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                            {formatTime(item.createdAt)}
                        </Text>
                        {isUser && (
                            <View style={styles.statusContainer}>
                                {item.readAt ? (
                                    <CheckCheck size={12} color="#60a5fa" />
                                ) : (
                                    <CheckCheck size={12} color="rgba(255,255,255,0.7)" />
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderTypingIndicator = () => {
        if (!isTyping) return null;

        return (
            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                    <Bot size={16} color="#fff" />
                </View>
                <View style={[styles.typingBubble, { backgroundColor: colors.card }]}>
                    <Animated.View style={[styles.typingDot, { backgroundColor: colors.textMuted, opacity: typingAnim }]} />
                    <Animated.View style={[styles.typingDot, { backgroundColor: colors.textMuted, opacity: typingAnim, marginHorizontal: 4 }]} />
                    <Animated.View style={[styles.typingDot, { backgroundColor: colors.textMuted, opacity: typingAnim }]} />
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>Connecting to chat...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={theme.gradients.primary as any}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.headerAvatar}>
                        <Bot size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>HLC Support</Text>
                        <View style={styles.onlineStatus}>
                            <View style={[styles.onlineDot, chat?.isEscalated && { backgroundColor: '#f59e0b' }]} />
                            <Text style={styles.onlineText}>
                                {chat?.isEscalated ? 'Waiting for Admin' : 'AI Assistant'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerAction} onPress={() => handleCall('voice')}>
                        <Phone size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerAction} onPress={() => handleCall('video')}>
                        <Video size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {chat?.isEscalated && (
                <View style={[styles.escalationBanner, { backgroundColor: '#fef3c7' }]}>
                    <UserCog size={16} color="#92400e" />
                    <Text style={styles.escalationText}>You're connected to live support. An admin will respond shortly.</Text>
                </View>
            )}

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={renderTypingIndicator}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {messages.length <= 2 && (
                    <View style={styles.quickRepliesContainer}>
                        <FlatList
                            data={QUICK_REPLIES}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item}
                            contentContainerStyle={styles.quickRepliesList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.quickReply,
                                        { borderColor: item === 'Talk to Admin' ? '#f59e0b' : colors.primary }
                                    ]}
                                    onPress={() => handleQuickReply(item)}
                                >
                                    <Text style={[
                                        styles.quickReplyText,
                                        { color: item === 'Talk to Admin' ? '#f59e0b' : colors.primary }
                                    ]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
                    <TouchableOpacity
                        style={styles.inputAction}
                        onPress={handleAttachment}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Paperclip size={22} color={colors.textMuted} />
                        )}
                    </TouchableOpacity>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.inputBackground }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                        />
                        <TouchableOpacity
                            style={styles.emojiButton}
                            onPress={() => setShowEmojiPicker(true)}
                        >
                            <Smile size={22} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: inputText.trim() && !sending ? colors.primary : colors.border },
                        ]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Send size={20} color={inputText.trim() ? '#fff' : colors.textMuted} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <EmojiPicker
                visible={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onSelect={handleEmojiSelect}
            />
        </SafeAreaView>
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
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
        marginRight: 6,
    },
    onlineText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerAction: {
        padding: 8,
        marginLeft: 4,
    },
    escalationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    escalationText: {
        flex: 1,
        fontSize: 13,
        color: '#92400e',
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    aiMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 18,
    },
    userBubble: {
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },
    attachmentImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 6,
    },
    documentAttachment: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        marginBottom: 6,
        gap: 8,
    },
    documentName: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    timestamp: {
        fontSize: 11,
    },
    statusContainer: {
        marginLeft: 4,
    },
    typingBubble: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    quickRepliesContainer: {
        paddingVertical: 8,
    },
    quickRepliesList: {
        paddingHorizontal: 16,
    },
    quickReply: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        marginRight: 10,
    },
    quickReplyText: {
        fontSize: 13,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    inputAction: {
        padding: 8,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        maxHeight: 120,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingTop: 0,
        paddingBottom: 0,
    },
    emojiButton: {
        padding: 4,
        marginLeft: 8,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
