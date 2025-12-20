'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Send, MessageSquare, Users, Gift, Calendar, Search, Filter,
    Plus, Edit2, Trash2, X, Check, ChevronDown, Mail, Bell,
    Smartphone, Clock, CheckCircle2, AlertCircle, Star, Sparkles,
    UserCheck, Heart, PartyPopper, RefreshCw, Copy, Eye
} from 'lucide-react';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    photoUrl: string | null;
}

interface Department {
    id: string;
    name: string;
}

interface MessageTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    type: string;
}

interface SentMessage {
    id: string;
    subject: string;
    body: string;
    recipientType: string;
    type: string;
    channel: string;
    createdAt: string;
    _count?: { recipients: number };
    recipients?: { id: string; memberName: string; status: string }[];
}

export default function MessagesPage() {
    const [activeTab, setActiveTab] = useState<'compose' | 'birthdays' | 'history' | 'templates'>('compose');
    const [members, setMembers] = useState<Member[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Compose state
    const [recipient, setRecipient] = useState<'all' | 'department' | 'individual' | 'birthday'>('all');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [channel, setChannel] = useState<'NOTIFICATION' | 'EMAIL' | 'SMS'>('NOTIFICATION');

    // Birthday state
    const [todayBirthdays, setTodayBirthdays] = useState<Member[]>([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState<Member[]>([]);

    // Templates
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

    // History
    const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'birthdays') {
            fetchBirthdays();
        } else if (activeTab === 'history') {
            fetchHistory();
        } else if (activeTab === 'templates') {
            fetchTemplates();
        }
    }, [activeTab]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [membersRes, deptRes, birthdaysRes, templatesRes] = await Promise.all([
                api.get('/members'),
                api.get('/departments'),
                api.get('/messaging/birthdays/today').catch(() => ({ data: [] })),
                api.get('/messaging/templates').catch(() => ({ data: [] })),
            ]);

            setMembers(membersRes.data);
            setDepartments(deptRes.data);
            setTodayBirthdays(birthdaysRes.data);
            setTemplates(templatesRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchBirthdays = async () => {
        try {
            const [todayRes, upcomingRes] = await Promise.all([
                api.get('/messaging/birthdays/today'),
                api.get('/messaging/birthdays/upcoming?days=7'),
            ]);
            setTodayBirthdays(todayRes.data);
            setUpcomingBirthdays(upcomingRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/messaging/history');
            setSentMessages(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const { data } = await api.get('/messaging/templates');
            setTemplates(data);
        } catch (error) {
            console.error(error);
        }
    };

    const applyTemplate = (template: MessageTemplate) => {
        setSubject(template.subject || '');
        setBody(template.body);
        toast.success(`Template "${template.name}" applied`);
    };

    const sendMessage = async () => {
        if (!subject.trim() || !body.trim()) {
            toast.error('Please enter subject and message');
            return;
        }

        setSending(true);
        try {
            const payload: any = {
                subject,
                body,
                channel,
                type: recipient === 'birthday' ? 'birthday' : 'announcement',
                recipientType: recipient,
            };

            if (recipient === 'department') {
                payload.departmentId = selectedDepartment;
            } else if (recipient === 'individual') {
                payload.memberIds = selectedMembers;
            }

            const { data } = await api.post('/messaging/send', payload);
            toast.success(data.message || `Message sent to ${data.recipientCount} recipient(s)!`);

            // Reset form
            setSubject('');
            setBody('');
            setSelectedMembers([]);

        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const sendBirthdayWish = async (member: Member) => {
        const template = templates.find(t => t.type === 'birthday');

        setSending(true);
        try {
            const payload = {
                subject: template?.subject || '🎂 Happy Birthday!',
                body: template?.body || `Dear ${member.firstName},\n\nWishing you a wonderful birthday!\n\nHigher Life Chapel`,
                channel: 'NOTIFICATION',
                type: 'birthday',
                recipientType: 'individual',
                memberIds: [member.id],
            };

            await api.post('/messaging/send', payload);
            toast.success(`Birthday message sent to ${member.firstName}!`);
        } catch (error) {
            toast.error('Failed to send birthday wish');
        } finally {
            setSending(false);
        }
    };

    const saveTemplate = async (templateData: Partial<MessageTemplate>) => {
        try {
            if (editingTemplate?.id && !editingTemplate.id.startsWith('default-')) {
                await api.patch(`/messaging/templates/${editingTemplate.id}`, templateData);
                toast.success('Template updated');
            } else {
                await api.post('/messaging/templates', templateData);
                toast.success('Template created');
            }
            fetchTemplates();
            setShowTemplateModal(false);
            setEditingTemplate(null);
        } catch (error) {
            toast.error('Failed to save template');
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        try {
            await api.delete(`/messaging/templates/${id}`);
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const filteredMembers = members.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                    >
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                                <MessageSquare className="w-6 h-6 text-indigo-500" />
                                Message Center
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                Send messages, birthday wishes, and announcements to members
                            </p>
                        </div>

                        {/* Birthday Alert */}
                        {todayBirthdays.length > 0 && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30"
                            >
                                <PartyPopper className="w-5 h-5 text-pink-500" />
                                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                    {todayBirthdays.length} birthday{todayBirthdays.length > 1 ? 's' : ''} today!
                                </span>
                                <button
                                    onClick={() => setActiveTab('birthdays')}
                                    className="text-pink-500 text-sm hover:underline"
                                >
                                    View
                                </button>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {[
                            { id: 'compose', label: 'Compose', icon: Edit2 },
                            { id: 'birthdays', label: 'Birthdays', icon: Gift, badge: todayBirthdays.length },
                            { id: 'history', label: 'History', icon: Clock },
                            { id: 'templates', label: 'Templates', icon: Copy },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-indigo-500 text-white'
                                    : 'glass-card hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                style={{ color: activeTab === tab.id ? 'white' : 'var(--foreground)' }}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {tab.badge && tab.badge > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Compose Tab */}
                        {activeTab === 'compose' && (
                            <motion.div
                                key="compose"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                            >
                                {/* Message Composer */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="glass-card p-6">
                                        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                                            Compose Message
                                        </h3>

                                        {/* Recipient Selection */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                                                Recipients
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {[
                                                    { id: 'all', label: 'All Members', icon: Users },
                                                    { id: 'department', label: 'Department', icon: UserCheck },
                                                    { id: 'individual', label: 'Individual', icon: Mail },
                                                    { id: 'birthday', label: "Today's Birthdays", icon: Gift },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setRecipient(opt.id as any)}
                                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${recipient === opt.id
                                                            ? 'border-indigo-500 bg-indigo-500/10'
                                                            : 'border-transparent glass-card hover:border-gray-300 dark:hover:border-gray-700'
                                                            }`}
                                                    >
                                                        <opt.icon className={`w-5 h-5 ${recipient === opt.id ? 'text-indigo-500' : ''}`} style={{ color: recipient === opt.id ? undefined : 'var(--foreground-muted)' }} />
                                                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                                                            {opt.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Department selector */}
                                        {recipient === 'department' && (
                                            <div className="mb-4">
                                                <select
                                                    className="input-modern w-full"
                                                    value={selectedDepartment}
                                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                                >
                                                    <option value="">Select department...</option>
                                                    {departments.map((d) => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Individual member selector */}
                                        {recipient === 'individual' && (
                                            <div className="mb-4">
                                                <div className="relative mb-2">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search members..."
                                                        className="input-modern w-full pl-10"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <div className="max-h-40 overflow-y-auto border rounded-xl p-2" style={{ borderColor: 'var(--border)' }}>
                                                    {filteredMembers.slice(0, 20).map((m) => (
                                                        <label
                                                            key={m.id}
                                                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMembers.includes(m.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedMembers([...selectedMembers, m.id]);
                                                                    } else {
                                                                        setSelectedMembers(selectedMembers.filter(id => id !== m.id));
                                                                    }
                                                                }}
                                                                className="w-4 h-4 rounded"
                                                            />
                                                            <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                                                {m.firstName} {m.lastName}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {selectedMembers.length > 0 && (
                                                    <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                                        {selectedMembers.length} selected
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Channel Selection */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                                                Channel
                                            </label>
                                            <div className="flex gap-2">
                                                {[
                                                    { id: 'NOTIFICATION', label: 'In-App', icon: Bell },
                                                    { id: 'EMAIL', label: 'Email', icon: Mail },
                                                    { id: 'SMS', label: 'SMS', icon: Smartphone },
                                                ].map((ch) => (
                                                    <button
                                                        key={ch.id}
                                                        onClick={() => setChannel(ch.id as any)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${channel === ch.id
                                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                                                            : 'border-transparent glass-card'
                                                            }`}
                                                    >
                                                        <ch.icon className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{ch.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                Subject
                                            </label>
                                            <input
                                                type="text"
                                                className="input-modern w-full"
                                                placeholder="Enter message subject..."
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                            />
                                        </div>

                                        {/* Message Body */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                Message
                                            </label>
                                            <textarea
                                                rows={6}
                                                className="input-modern w-full"
                                                placeholder="Write your message here... Use {firstName} and {lastName} for personalization."
                                                value={body}
                                                onChange={(e) => setBody(e.target.value)}
                                            />
                                            <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                                Tip: Use {'{firstName}'} and {'{lastName}'} for personalization
                                            </p>
                                        </div>

                                        {/* Send Button */}
                                        <button
                                            onClick={sendMessage}
                                            disabled={sending || !subject || !body}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            {sending ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Send Message
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Templates */}
                                <div className="space-y-4">
                                    <div className="glass-card p-4">
                                        <h4 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                                            Quick Templates
                                        </h4>
                                        <div className="space-y-2">
                                            {templates.slice(0, 4).map((template) => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => applyTemplate(template)}
                                                    className="w-full text-left p-3 rounded-xl glass-card hover:scale-[1.02] transition-transform"
                                                >
                                                    <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                                                        {template.name}
                                                    </p>
                                                    <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>
                                                        {template.subject}
                                                    </p>
                                                </button>
                                            ))}
                                            {templates.length === 0 && (
                                                <p className="text-sm text-center py-4" style={{ color: 'var(--foreground-muted)' }}>
                                                    No templates yet
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="glass-card p-4">
                                        <h4 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                                            Quick Stats
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Total Members</span>
                                                <span className="font-bold" style={{ color: 'var(--foreground)' }}>{members.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Today's Birthdays</span>
                                                <span className="font-bold text-pink-500">{todayBirthdays.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Templates</span>
                                                <span className="font-bold" style={{ color: 'var(--foreground)' }}>{templates.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Birthdays Tab */}
                        {activeTab === 'birthdays' && (
                            <motion.div
                                key="birthdays"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Today's Birthdays */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <PartyPopper className="w-5 h-5 text-pink-500" />
                                        <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                                            Today's Birthdays
                                        </h3>
                                        {todayBirthdays.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs">
                                                {todayBirthdays.length}
                                            </span>
                                        )}
                                    </div>

                                    {todayBirthdays.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {todayBirthdays.map((member) => (
                                                <motion.div
                                                    key={member.id}
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="glass-card p-4 border-2 border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                                            {member.firstName[0]}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                                {member.firstName} {member.lastName}
                                                            </h4>
                                                            <p className="text-sm flex items-center gap-1 text-pink-500">
                                                                <Gift className="w-4 h-4" />
                                                                Birthday Today! 🎉
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => sendBirthdayWish(member)}
                                                        disabled={sending}
                                                        className="mt-4 w-full btn-primary flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500"
                                                    >
                                                        <Heart className="w-4 h-4" />
                                                        Send Birthday Wish
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="glass-card p-8 text-center">
                                            <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p style={{ color: 'var(--foreground-muted)' }}>
                                                No birthdays today
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Upcoming Birthdays */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar className="w-5 h-5 text-amber-500" />
                                        <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                                            Upcoming This Week
                                        </h3>
                                    </div>

                                    {upcomingBirthdays.length > 0 ? (
                                        <div className="glass-card divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {upcomingBirthdays.map((member) => {
                                                const dob = new Date(member.dateOfBirth!);
                                                const today = new Date();
                                                const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                                                const daysUntil = Math.ceil((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                                                return (
                                                    <div key={member.id} className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                                                                {member.firstName[0]}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                                    {member.firstName} {member.lastName}
                                                                </h4>
                                                                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                                    {thisYearBday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                            In {daysUntil} day{daysUntil > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="glass-card p-8 text-center">
                                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p style={{ color: 'var(--foreground-muted)' }}>
                                                No upcoming birthdays this week
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="glass-card overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Subject</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Type</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Recipients</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Channel</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Sent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sentMessages.map((msg) => (
                                                <tr key={msg.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <td className="p-4">
                                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>{msg.subject}</p>
                                                        <p className="text-sm truncate max-w-xs" style={{ color: 'var(--foreground-muted)' }}>{msg.body}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${msg.type === 'birthday' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                                                            msg.type === 'reminder' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                msg.type === 'welcome' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                                            }`}>
                                                            {msg.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4" style={{ color: 'var(--foreground)' }}>
                                                        {msg._count?.recipients || msg.recipients?.length || 0}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                            {msg.channel}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                        {new Date(msg.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {sentMessages.length === 0 && (
                                        <div className="p-8 text-center">
                                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p style={{ color: 'var(--foreground-muted)' }}>No messages sent yet</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Templates Tab */}
                        {activeTab === 'templates' && (
                            <motion.div
                                key="templates"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                                        Message Templates
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setEditingTemplate(null);
                                            setShowTemplateModal(true);
                                        }}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        New Template
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map((template) => (
                                        <div key={template.id} className="glass-card p-4 group">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${template.type === 'birthday' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                                                        template.type === 'welcome' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            template.type === 'reminder' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}>
                                                        {template.type}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTemplate(template);
                                                            setShowTemplateModal(true);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <Edit2 className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTemplate(template.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h4 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                                                {template.name}
                                            </h4>
                                            <p className="text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                                                {template.subject}
                                            </p>
                                            <p className="text-xs line-clamp-2" style={{ color: 'var(--foreground-muted)' }}>
                                                {template.body}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    applyTemplate(template);
                                                    setActiveTab('compose');
                                                }}
                                                className="mt-3 w-full btn-secondary text-sm"
                                            >
                                                Use Template
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {templates.length === 0 && (
                                    <div className="glass-card p-8 text-center">
                                        <Copy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p style={{ color: 'var(--foreground-muted)' }}>No templates yet</p>
                                        <button
                                            onClick={() => setShowTemplateModal(true)}
                                            className="mt-4 btn-primary"
                                        >
                                            Create Template
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Template Modal */}
                    <AnimatePresence>
                        {showTemplateModal && (
                            <TemplateModal
                                template={editingTemplate}
                                onClose={() => {
                                    setShowTemplateModal(false);
                                    setEditingTemplate(null);
                                }}
                                onSave={saveTemplate}
                            />
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

// Template Modal Component
function TemplateModal({
    template,
    onClose,
    onSave
}: {
    template: MessageTemplate | null;
    onClose: () => void;
    onSave: (data: Partial<MessageTemplate>) => void;
}) {
    const [form, setForm] = useState({
        name: template?.name || '',
        type: template?.type || 'custom',
        subject: template?.subject || '',
        body: template?.body || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card p-6 w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                        {template ? 'Edit Template' : 'New Template'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Template Name *
                        </label>
                        <input
                            type="text"
                            required
                            className="input-modern w-full"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., Birthday Wishes"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Type
                        </label>
                        <select
                            className="input-modern w-full"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="birthday">Birthday</option>
                            <option value="welcome">Welcome</option>
                            <option value="reminder">Reminder</option>
                            <option value="announcement">Announcement</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Subject
                        </label>
                        <input
                            type="text"
                            className="input-modern w-full"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="Message subject..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Message Body *
                        </label>
                        <textarea
                            rows={6}
                            required
                            className="input-modern w-full"
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            placeholder="Message content... Use {firstName} and {lastName} for personalization."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
