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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Send,
    ArrowLeft,
    Paperclip,
    Smile,
    Phone,
    Video,
    FileText,
    CheckCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import client from '../api/client';
import EmojiPicker from '../components/EmojiPicker';

interface DirectMessage {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    readAt: string | null;
    createdAt: string;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
}

interface RouteParams {
    conversationId: string;
    otherParticipant: {
        id: string;
        name: string;
        email: string;
    };
}

export default function DirectChatScreen({ navigation, route }: any) {
    const { conversationId, otherParticipant } = route.params as RouteParams;
    const { theme } = useTheme();
    const colors = theme.colors;
    const { user } = useAuth();

    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const lastMessageTime = useRef<string | null>(null);

    const API_BASE = client.defaults.baseURL?.replace('/api', '') || 'http://localhost:3333';

    useEffect(() => {
        fetchConversation();
    }, [conversationId]);

    // Poll for new messages
    useEffect(() => {
        const pollMessages = async () => {
            try {
                if (lastMessageTime.current) {
                    const { data } = await client.get(
                        `/direct-messages/conversations/${conversationId}/messages/new`,
                        { params: { since: lastMessageTime.current } }
                    );
                    if (data.length > 0) {
                        setMessages(prev => {
                            const existingIds = new Set(prev.map(m => m.id));
                            const newMessages = data.filter((m: DirectMessage) => !existingIds.has(m.id));
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

        const interval = setInterval(pollMessages, 2000);
        return () => clearInterval(interval);
    }, [conversationId]);

    const fetchConversation = async () => {
        try {
            setLoading(true);
            const { data } = await client.get(`/direct-messages/conversations/${conversationId}`);
            setMessages(data.messages || []);
            if (data.messages?.length > 0) {
                lastMessageTime.current = data.messages[data.messages.length - 1].createdAt;
            }
            // Mark as read
            await client.post(`/direct-messages/conversations/${conversationId}/read`);
        } catch (error) {
            console.error('Failed to fetch conversation:', error);
            Alert.alert('Error', 'Failed to load conversation');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || sending) return;

        const tempId = Date.now().toString();
        const tempMessage: DirectMessage = {
            id: tempId,
            content: text.trim(),
            senderId: user?.id || '',
            senderName: 'You',
            readAt: null,
            createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMessage]);
        setInputText('');
        setSending(true);

        try {
            const { data } = await client.post(
                `/direct-messages/conversations/${conversationId}/messages`,
                { content: text.trim() }
            );

            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
            lastMessageTime.current = data.createdAt;
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
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

            const { data } = await client.post(
                `/direct-messages/conversations/${conversationId}/messages`,
                {
                    content: type === 'image' ? '📷 Image' : `📄 ${attachmentName || 'Document'}`,
                    attachmentUrl: url,
                    attachmentType,
                    attachmentName: attachmentName || filename,
                }
            );

            setMessages(prev => [...prev, data]);
            lastMessageTime.current = data.createdAt;
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Error', 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item, index }: { item: DirectMessage; index: number }) => {
        const isFirst = index === 0 || messages[index - 1].senderId !== item.senderId;
        const isUser = item.senderId === user?.id;
        const hasImage = item.attachmentType === 'image' && item.attachmentUrl;
        const hasDocument = item.attachmentType === 'document' && item.attachmentUrl;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.otherMessageContainer,
                    isFirst && { marginTop: 12 },
                ]}
            >
                {!isUser && isFirst && (
                    <View style={[styles.avatarContainer, { backgroundColor: colors.success }]}>
                        <Text style={styles.avatarText}>
                            {otherParticipant.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isUser
                            ? [styles.userBubble, { backgroundColor: colors.primary }]
                            : [styles.otherBubble, { backgroundColor: colors.card }],
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
                    <View style={[styles.headerAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Text style={styles.headerAvatarText}>
                            {otherParticipant.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{otherParticipant.name}</Text>
                        <Text style={styles.headerSubtitle}>Tap here for info</Text>
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

            {/* Messages */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 30}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Bar */}
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
                {Platform.OS === 'android' && <View style={{ height: 20 }} />}
            </KeyboardAvoidingView>

            {/* Emoji Picker Modal */}
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
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerAction: {
        padding: 8,
        marginLeft: 4,
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
    otherMessageContainer: {
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
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 18,
    },
    userBubble: {
        borderBottomRightRadius: 4,
    },
    otherBubble: {
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
