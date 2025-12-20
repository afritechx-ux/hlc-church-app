'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import { MessageCircle, Send, User, Bot, RefreshCw, Check, CheckCheck, AlertCircle } from 'lucide-react';

interface Chat {
    id: string;
    userId: string;
    userEmail: string;
    userName: string | null;
    subject: string | null;
    status: string;
    isEscalated: boolean;
    lastMessageAt: string;
    messages: Message[];
    _count?: { messages: number };
}

interface Message {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    isAdmin: boolean;
    content: string;
    readAt: string | null;
    createdAt: string;
}

export default function ChatPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'escalated' | 'all'>('all');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, [activeTab]);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
            const interval = setInterval(() => fetchMessages(selectedChat.id), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedChat?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchChats = async () => {
        try {
            setError(null);
            const endpoint = activeTab === 'escalated' ? '/chat/admin/escalated' : '/chat/admin/all';
            console.log('Fetching chats from:', endpoint);
            const { data } = await api.get(endpoint);
            console.log('Chats received:', data);
            setChats(data);
            setLoading(false);
        } catch (err: any) {
            console.error('Failed to fetch chats', err);
            setError(err?.response?.status === 401
                ? 'Please log in to view chats'
                : 'Failed to load chats. Please try again.');
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        try {
            const { data } = await api.get(`/chat/${chatId}`);
            setMessages(data.messages);
            await api.post(`/chat/${chatId}/read`);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;

        setSending(true);
        try {
            await api.post(`/chat/${selectedChat.id}/messages`, {
                content: newMessage,
            });
            setNewMessage('');
            fetchMessages(selectedChat.id);
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setSending(false);
        }
    };

    const handleCloseChat = async (chatId: string) => {
        try {
            await api.patch(`/chat/${chatId}/status`, { status: 'CLOSED' });
            fetchChats();
            if (selectedChat?.id === chatId) {
                setSelectedChat(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to close chat', error);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex flex-1 overflow-hidden p-6">
                    {/* Chat List */}
                    <div className="w-80 rounded-lg shadow mr-4 flex flex-col" style={{ background: 'var(--card)' }}>
                        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Support Chats</h2>
                            <button onClick={fetchChats} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <RefreshCw className="h-4 w-4" style={{ color: 'var(--foreground-muted)' }} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : ''}`}
                                style={{ color: activeTab === 'all' ? undefined : 'var(--foreground-muted)' }}
                            >
                                All Chats
                            </button>
                            <button
                                onClick={() => setActiveTab('escalated')}
                                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'escalated' ? 'border-b-2 border-blue-500 text-blue-600' : ''}`}
                                style={{ color: activeTab === 'escalated' ? undefined : 'var(--foreground-muted)' }}
                            >
                                Escalated
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center" style={{ color: 'var(--foreground-muted)' }}>Loading...</div>
                            ) : error ? (
                                <div className="p-4 text-center text-red-500">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-300" />
                                    <p>{error}</p>
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="p-4 text-center" style={{ color: 'var(--foreground-muted)' }}>
                                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                    <p>No {activeTab === 'escalated' ? 'escalated ' : ''}chats</p>
                                    <p className="text-sm mt-1">
                                        {activeTab === 'escalated'
                                            ? 'Users will appear here when they request to speak with an admin'
                                            : 'No chat conversations yet'}
                                    </p>
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSelectedChat(chat)}
                                        className={`w-full p-4 text-left border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                    {chat.userName || chat.userEmail}
                                                </span>
                                                {chat.isEscalated && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                                                        Escalated
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                                {formatTime(chat.lastMessageAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm truncate mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                            {chat.messages[0]?.content || 'No messages'}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className="flex-1 rounded-lg shadow flex flex-col" style={{ background: 'var(--card)' }}>
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                                    <div>
                                        <h3 className="font-bold" style={{ color: 'var(--foreground)' }}>
                                            {selectedChat.userName || selectedChat.userEmail}
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{selectedChat.userEmail}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCloseChat(selectedChat.id)}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                                        style={{ color: 'var(--foreground)' }}
                                    >
                                        Close Chat
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg p-3 ${msg.isAdmin
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700'
                                                    }`}
                                                style={!msg.isAdmin ? { color: 'var(--foreground)' } : undefined}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    {msg.isAdmin ? (
                                                        <Bot className="h-4 w-4" />
                                                    ) : (
                                                        <User className="h-4 w-4" />
                                                    )}
                                                    <span className="text-xs font-medium">
                                                        {msg.senderName}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className={`text-xs ${msg.isAdmin ? 'text-blue-200' : 'opacity-60'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                    {msg.isAdmin && (
                                                        msg.readAt ? (
                                                            <CheckCheck className="h-3 w-3 text-blue-200" />
                                                        ) : (
                                                            <Check className="h-3 w-3 text-blue-200" />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type your message..."
                                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            style={{
                                                background: 'var(--background)',
                                                borderColor: 'var(--border)',
                                                color: 'var(--foreground)'
                                            }}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={sending || !newMessage.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--foreground-muted)' }}>
                                <div className="text-center">
                                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Select a chat to start messaging</p>
                                    <p className="text-sm">Choose from chats on the left</p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
