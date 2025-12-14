'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import EmojiPicker from '@/components/EmojiPicker';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    MessageCircle,
    Send,
    User,
    Clock,
    CheckCheck,
    Search,
    Filter,
    MoreVertical,
    X,
    UserCheck,
    Archive,
    Paperclip,
    FileText,
    Image as ImageIcon,
    Download,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3333';

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    isAdmin: boolean;
    content: string;
    readAt: string | null;
    createdAt: string;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
}

interface Chat {
    id: string;
    userId: string;
    userEmail: string;
    userName: string | null;
    subject: string | null;
    status: 'OPEN' | 'CLOSED';
    assignedTo: string | null;
    lastMessageAt: string;
    createdAt: string;
    messages?: ChatMessage[];
    _count?: { messages: number };
}

export default function SupportPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'OPEN' | 'CLOSED'>('OPEN');
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchChats();
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchChats, 5000);
        return () => clearInterval(interval);
    }, [statusFilter]);

    useEffect(() => {
        if (selectedChat) {
            scrollToBottom();
        }
    }, [selectedChat?.messages]);

    const fetchChats = async () => {
        try {
            const status = statusFilter === 'all' ? undefined : statusFilter;
            const { data } = await api.get('/chat/admin/all', { params: { status } });
            setChats(data);

            // Update selected chat if it exists
            if (selectedChat) {
                const updated = data.find((c: Chat) => c.id === selectedChat.id);
                if (updated) {
                    // Fetch full chat with messages
                    const { data: fullChat } = await api.get(`/chat/${selectedChat.id}`);
                    setSelectedChat(fullChat);
                }
            }
        } catch (error) {
            console.error('Failed to fetch chats', error);
        } finally {
            setLoading(false);
        }
    };

    const selectChat = async (chat: Chat) => {
        try {
            const { data } = await api.get(`/chat/${chat.id}`);
            setSelectedChat(data);
            // Mark as read
            await api.post(`/chat/${chat.id}/read`);
        } catch (error) {
            console.error('Failed to load chat', error);
            toast.error('Failed to load chat');
        }
    };

    const sendMessage = async (attachmentData?: { url: string; type: string; name: string }) => {
        if ((!messageInput.trim() && !attachmentData) || !selectedChat || sending) return;

        setSending(true);
        try {
            await api.post(`/chat/${selectedChat.id}/messages`, {
                content: attachmentData
                    ? (attachmentData.type === 'image' ? '📷 Image' : `📄 ${attachmentData.name}`)
                    : messageInput.trim(),
                attachmentUrl: attachmentData?.url,
                attachmentType: attachmentData?.type,
                attachmentName: attachmentData?.name,
            });
            setMessageInput('');

            // Refresh chat
            const { data } = await api.get(`/chat/${selectedChat.id}`);
            setSelectedChat(data);
            fetchChats();
        } catch (error) {
            console.error('Failed to send message', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await sendMessage({
                url: data.url,
                type: data.type,
                name: data.name || file.name,
            });
        } catch (error) {
            console.error('File upload failed:', error);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setMessageInput(prev => prev + emoji);
    };

    const closeChat = async (chatId: string) => {
        try {
            await api.patch(`/chat/${chatId}/status`, { status: 'CLOSED' });
            toast.success('Chat closed');
            fetchChats();
            if (selectedChat?.id === chatId) {
                setSelectedChat(null);
            }
        } catch (error) {
            toast.error('Failed to close chat');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString();
    };

    const filteredChats = chats.filter(chat => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                chat.userEmail.toLowerCase().includes(query) ||
                chat.userName?.toLowerCase().includes(query) ||
                chat.subject?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const unreadCount = chats.filter(c =>
        c.status === 'OPEN' &&
        c.messages &&
        c.messages.length > 0 &&
        !c.messages[0].isAdmin
    ).length;

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-hidden flex">
                    {/* Chat List */}
                    <div className="w-80 border-r flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                                <MessageCircle className="w-5 h-5" />
                                Support Chats
                                {unreadCount > 0 && (
                                    <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </h2>
                        </div>

                        {/* Filters */}
                        <div className="p-3 space-y-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-modern w-full pl-9 text-sm"
                                />
                            </div>
                            <div className="flex gap-1">
                                {(['all', 'OPEN', 'CLOSED'] as const).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === status
                                            ? 'bg-indigo-500 text-white'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        style={{ color: statusFilter === status ? 'white' : 'var(--foreground)' }}
                                    >
                                        {status === 'all' ? 'All' : status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredChats.length === 0 ? (
                                <div className="text-center py-8 px-4" style={{ color: 'var(--foreground-muted)' }}>
                                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No chats found</p>
                                </div>
                            ) : (
                                filteredChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => selectChat(chat)}
                                        className={`w-full p-3 border-b text-left transition-colors ${selectedChat?.id === chat.id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {chat.userEmail[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
                                                        {chat.userName || chat.userEmail.split('@')[0]}
                                                    </span>
                                                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>
                                                        {formatTime(chat.lastMessageAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                                                    {chat.messages?.[0]?.content || 'No messages'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-1.5 py-0.5 text-xs rounded ${chat.status === 'OPEN'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                        }`}>
                                                        {chat.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Detail */}
                    <div className="flex-1 flex flex-col">
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                            {selectedChat.userEmail[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                {selectedChat.userName || selectedChat.userEmail.split('@')[0]}
                                            </h3>
                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                {selectedChat.userEmail}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedChat.status === 'OPEN' && (
                                            <button
                                                onClick={() => closeChat(selectedChat.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                                style={{ color: 'var(--foreground)' }}
                                            >
                                                <Archive className="w-4 h-4" />
                                                Close
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedChat(null)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        >
                                            <X className="w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'var(--background)' }}>
                                    {selectedChat.messages?.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-3 rounded-2xl ${message.isAdmin
                                                    ? 'bg-indigo-500 text-white rounded-br-sm'
                                                    : 'rounded-bl-sm'
                                                    }`}
                                                style={!message.isAdmin ? { background: 'var(--card-bg)' } : undefined}
                                            >
                                                {!message.isAdmin && (
                                                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                                                        {message.senderName}
                                                    </p>
                                                )}
                                                {/* Attachment Display */}
                                                {message.attachmentType === 'image' && message.attachmentUrl && (
                                                    <a
                                                        href={`${API_BASE}${message.attachmentUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block mb-2"
                                                    >
                                                        <img
                                                            src={`${API_BASE}${message.attachmentUrl}`}
                                                            alt="Attachment"
                                                            className="max-w-full rounded-lg max-h-48 object-cover"
                                                        />
                                                    </a>
                                                )}
                                                {message.attachmentType === 'document' && message.attachmentUrl && (
                                                    <a
                                                        href={`${API_BASE}${message.attachmentUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${message.isAdmin ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}
                                                    >
                                                        <FileText className="w-5 h-5" />
                                                        <span className="text-sm truncate flex-1">{message.attachmentName || 'Document'}</span>
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {(!message.attachmentUrl || !message.content.startsWith('📷')) && (
                                                    <p className={message.isAdmin ? 'text-white' : ''} style={!message.isAdmin ? { color: 'var(--foreground)' } : undefined}>
                                                        {message.content}
                                                    </p>
                                                )}
                                                <div className={`flex items-center justify-end gap-1 mt-1 ${message.isAdmin ? 'text-white/70' : ''}`}>
                                                    <span className="text-xs" style={!message.isAdmin ? { color: 'var(--foreground-muted)' } : undefined}>
                                                        {formatTime(message.createdAt)}
                                                    </span>
                                                    {message.isAdmin && (
                                                        <CheckCheck className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                {selectedChat.status === 'OPEN' && (
                                    <div className="p-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                                        <div className="flex items-end gap-2">
                                            {/* File Upload */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf,.doc,.docx"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Attach file"
                                            >
                                                {uploading ? (
                                                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Paperclip className="w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                                )}
                                            </button>
                                            {/* Emoji Picker */}
                                            <EmojiPicker onSelect={handleEmojiSelect} />
                                            <textarea
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        sendMessage();
                                                    }
                                                }}
                                                placeholder="Type your reply..."
                                                className="input-modern flex-1 resize-none"
                                                rows={2}
                                            />
                                            <button
                                                onClick={() => sendMessage()}
                                                disabled={!messageInput.trim() || sending}
                                                className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--background)' }}>
                                <div className="text-center">
                                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--foreground-muted)' }} />
                                    <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                        Select a conversation
                                    </h3>
                                    <p style={{ color: 'var(--foreground-muted)' }}>
                                        Choose a chat from the list to start responding
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
