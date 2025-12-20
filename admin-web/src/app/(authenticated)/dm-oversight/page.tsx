'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import EmojiPicker from '@/components/EmojiPicker';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    MessageSquare,
    Send,
    Search,
    Users,
    ArrowLeft,
    CheckCheck,
    FileText,
    Download,
    Paperclip,
    Shield,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3333';

interface Participant {
    id: string;
    name: string;
    email: string;
}

interface DirectMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    readAt: string | null;
    createdAt: string;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
}

interface Conversation {
    id: string;
    participant1: Participant;
    participant2: Participant;
    lastMessage: DirectMessage | null;
    messageCount: number;
    lastMessageAt: string;
}

export default function DMOversightPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<(Conversation & { messages: DirectMessage[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            scrollToBottom();
        }
    }, [selectedConversation?.messages]);

    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/direct-messages/admin/all', {
                params: { search: searchQuery || undefined },
            });
            setConversations(data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const selectConversation = async (conv: Conversation) => {
        try {
            const { data } = await api.get(`/direct-messages/admin/conversation/${conv.id}`);
            setSelectedConversation(data);
        } catch (error: any) {
            console.error('Failed to load conversation:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load conversation';
            toast.error(`Error: ${errorMessage}`);
        }
    };

    const sendMessage = async (attachmentData?: { url: string; type: string; name: string }) => {
        if ((!messageInput.trim() && !attachmentData) || !selectedConversation || sending) return;

        setSending(true);
        try {
            await api.post(`/direct-messages/admin/conversation/${selectedConversation.id}/messages`, {
                content: attachmentData
                    ? (attachmentData.type === 'image' ? '📷 Image' : `📄 ${attachmentData.name}`)
                    : messageInput.trim(),
                attachmentUrl: attachmentData?.url,
                attachmentType: attachmentData?.type,
                attachmentName: attachmentData?.name,
            });
            setMessageInput('');

            // Refresh conversation
            const { data } = await api.get(`/direct-messages/admin/conversation/${selectedConversation.id}`);
            setSelectedConversation(data);
            fetchConversations();
            toast.success('Message sent as admin');
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConversation) return;

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

    const filteredConversations = conversations.filter(conv => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                conv.participant1.name.toLowerCase().includes(query) ||
                conv.participant2.name.toLowerCase().includes(query) ||
                conv.participant1.email?.toLowerCase().includes(query) ||
                conv.participant2.email?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-hidden flex">
                    {/* Conversation List */}
                    <div className="w-80 border-r flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                                <Shield className="w-5 h-5 text-indigo-500" />
                                DM Oversight
                            </h2>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                View & moderate member chats
                            </p>
                        </div>

                        {/* Search */}
                        <div className="p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search by member..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-modern w-full pl-9 text-sm"
                                />
                            </div>
                        </div>

                        {/* Conversation List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="text-center py-8 px-4" style={{ color: 'var(--foreground-muted)' }}>
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No conversations found</p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv)}
                                        className={`w-full p-3 border-b text-left transition-colors ${selectedConversation?.id === conv.id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                                                {conv.participant1.name.charAt(0)}
                                            </div>
                                            <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>↔</span>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                                                {conv.participant2.name.charAt(0)}
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                                            {conv.participant1.name} & {conv.participant2.name}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs truncate flex-1" style={{ color: 'var(--foreground-muted)' }}>
                                                {conv.lastMessage?.content || 'No messages'}
                                            </p>
                                            <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>
                                                {conv.messageCount} msgs
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Conversation Detail */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedConversation(null)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                                                {selectedConversation.participant1.name.charAt(0)}
                                            </div>
                                            <span className="text-lg" style={{ color: 'var(--foreground-muted)' }}>↔</span>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                                {selectedConversation.participant2.name.charAt(0)}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                {selectedConversation.participant1.name} & {selectedConversation.participant2.name}
                                            </h3>
                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                {selectedConversation.messages.length} messages
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                        <Shield className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Admin Mode</span>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'var(--background)' }}>
                                    {selectedConversation.messages.map((message) => {
                                        const isP1 = message.senderId === selectedConversation.participant1.id;
                                        const isAdmin = message.senderName.includes('(Admin)');

                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isP1 ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] p-3 rounded-2xl ${isAdmin
                                                        ? 'bg-amber-500 text-white'
                                                        : isP1
                                                            ? 'bg-green-500 text-white rounded-bl-sm'
                                                            : 'bg-purple-500 text-white rounded-br-sm'
                                                        }`}
                                                >
                                                    <p className="text-xs font-medium mb-1 opacity-80">
                                                        {message.senderName}
                                                    </p>
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
                                                            className="flex items-center gap-2 p-2 rounded-lg mb-2 bg-white/20"
                                                        >
                                                            <FileText className="w-5 h-5" />
                                                            <span className="text-sm truncate flex-1">{message.attachmentName || 'Document'}</span>
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {(!message.attachmentUrl || !message.content.startsWith('📷')) && (
                                                        <p>{message.content}</p>
                                                    )}
                                                    <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                                                        <span className="text-xs">{formatTime(message.createdAt)}</span>
                                                        {message.readAt && <CheckCheck className="w-3 h-3" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Admin Input */}
                                <div className="p-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                                    <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <Shield className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs text-amber-700 dark:text-amber-400">
                                            Messages sent here will appear as "(Admin)" to both participants
                                        </span>
                                    </div>
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
                                                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
                                            placeholder="Send a message as admin..."
                                            className="input-modern flex-1 resize-none"
                                            rows={2}
                                        />
                                        <button
                                            onClick={() => sendMessage()}
                                            disabled={!messageInput.trim() || sending}
                                            className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--background)' }}>
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--foreground-muted)' }} />
                                    <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                        Select a conversation
                                    </h3>
                                    <p style={{ color: 'var(--foreground-muted)' }}>
                                        Choose a member conversation to view or moderate
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
