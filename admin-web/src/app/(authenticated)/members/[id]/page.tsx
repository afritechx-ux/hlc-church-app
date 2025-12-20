'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    User, Mail, Phone, MapPin, Calendar, Edit2, Save, X,
    ChevronLeft, Award, DollarSign, Clock, CheckCircle, AlertCircle,
    TrendingUp, Activity, History, Flame, RefreshCw
} from 'lucide-react';

interface MemberDetail {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    dateOfBirth: string;
    createdAt: string;
    departments: { department: { id: string; name: string } }[];
    engagement?: {
        attendanceScore: number;
        servingScore: number;
        givingScore: number;
    }
}

const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'attendance', label: 'Attendance', icon: CheckCircle },
    { id: 'giving', label: 'Giving', icon: DollarSign },
    { id: 'follow-ups', label: 'Follow-ups', icon: Clock },
];

export default function MemberDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [member, setMember] = useState<MemberDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ phone: '', address: '', status: '', dateOfBirth: '' });
    const [saving, setSaving] = useState(false);
    const [streak, setStreak] = useState<{ currentStreak: number; maxStreak: number } | null>(null);
    const [recalculating, setRecalculating] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchMember(params.id as string);
        }
    }, [params.id]);

    const fetchMember = async (id: string) => {
        try {
            const { data } = await api.get(`/members/${id}`);
            // Fetch engagement score
            try {
                const scoreRes = await api.get(`/engagement/members/${id}`);
                if (scoreRes.data) {
                    data.engagement = scoreRes.data;
                }
            } catch (e) { }
            // Fetch attendance streak
            try {
                const streakRes = await api.get(`/attendance/streak/${id}`);
                if (streakRes.data) {
                    setStreak(streakRes.data);
                }
            } catch (e) { }
            setMember(data);
            setEditForm({
                phone: data.phone || '',
                address: data.address || '',
                status: data.status || 'ACTIVE',
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
            });
        } catch (error) {
            console.error('Failed to fetch member details', error);
            toast.error('Failed to load member');
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculateEngagement = async () => {
        if (!member) return;
        setRecalculating(true);
        try {
            const { data } = await api.post(`/engagement/calculate/${member.id}`);
            setMember({ ...member, engagement: data });
            toast.success('Engagement score recalculated');
        } catch (error) {
            toast.error('Failed to recalculate');
        } finally {
            setRecalculating(false);
        }
    };

    const handleSave = async () => {
        if (!member) return;
        setSaving(true);
        try {
            const payload: any = { ...editForm };
            if (editForm.dateOfBirth) {
                payload.dateOfBirth = new Date(editForm.dateOfBirth).toISOString();
            }
            await api.patch(`/members/${member.id}`, payload);
            setMember({ ...member, ...editForm });
            setIsEditing(false);
            toast.success('Member updated successfully');
        } catch (error) {
            toast.error('Failed to update member');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen" style={{ background: 'var(--background)' }}>
                <Sidebar />
                <div className="flex flex-1 flex-col">
                    <Header />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="flex h-screen" style={{ background: 'var(--background)' }}>
                <Sidebar />
                <div className="flex flex-1 flex-col">
                    <Header />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <User className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                            <p style={{ color: 'var(--foreground-muted)' }}>Member not found</p>
                            <button onClick={() => router.push('/members')} className="btn-primary mt-4">
                                Back to Members
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Back Button & Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <button
                            onClick={() => router.push('/members')}
                            className="flex items-center gap-2 mb-4 text-sm hover:text-indigo-600 transition"
                            style={{ color: 'var(--foreground-muted)' }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Members
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                                    {member.firstName} {member.lastName}
                                </h1>
                                <p style={{ color: 'var(--foreground-muted)' }}>
                                    Member since {new Date(member.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`btn-secondary flex items-center gap-2 ${isEditing ? 'ring-2 ring-indigo-500' : ''}`}
                            >
                                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                                {isEditing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left Column: Profile */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            {/* Profile Card */}
                            <div className="glass-card p-6">
                                <div className="flex flex-col items-center">
                                    <div
                                        className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4"
                                        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)' }}
                                    >
                                        {member.firstName[0]}{member.lastName[0]}
                                    </div>
                                    <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                                        {member.firstName} {member.lastName}
                                    </h2>
                                    <span
                                        className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${member.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}
                                    >
                                        {member.status || 'ACTIVE'}
                                    </span>
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                        {member.departments?.map((d, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 rounded-full text-xs font-medium"
                                                style={{ background: 'var(--primary)', color: 'white' }}
                                            >
                                                {d.department.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ background: 'var(--primary)' + '20' }}>
                                            <Mail className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                                        </div>
                                        <span style={{ color: 'var(--foreground)' }}>{member.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ background: '#10b981' + '20' }}>
                                            <Phone className="w-5 h-5" style={{ color: '#10b981' }} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                className="input-modern flex-1"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                placeholder="Phone number"
                                            />
                                        ) : (
                                            <span style={{ color: 'var(--foreground)' }}>{member.phone || 'No phone'}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ background: '#f59e0b' + '20' }}>
                                            <MapPin className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="input-modern flex-1"
                                                value={editForm.address}
                                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                placeholder="Address"
                                            />
                                        ) : (
                                            <span style={{ color: 'var(--foreground)' }}>{member.address || 'No address'}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ background: '#8b5cf6' + '20' }}>
                                            <Calendar className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                className="input-modern flex-1"
                                                value={editForm.dateOfBirth}
                                                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                            />
                                        ) : (
                                            <span style={{ color: 'var(--foreground)' }}>
                                                {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'No DOB'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                                            Status
                                        </label>
                                        <select
                                            className="input-modern w-full"
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="VISITOR">Visitor</option>
                                        </select>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                                        >
                                            {saving ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Attendance Streak */}
                            {streak && (
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                                        <Flame className="w-5 h-5 text-orange-500" />
                                        Attendance Streak
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                                            <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                                                <Flame className="w-6 h-6" />
                                                {streak.currentStreak}
                                            </div>
                                            <div className="text-xs text-white/80">Current Streak</div>
                                        </div>
                                        <div className="p-4 rounded-xl" style={{ background: 'var(--background)' }}>
                                            <div className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                                                {streak.maxStreak}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Best Streak</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Engagement Score */}
                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                                        Engagement Score
                                    </h3>
                                    <button
                                        onClick={handleRecalculateEngagement}
                                        disabled={recalculating}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                        title="Recalculate engagement score"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} style={{ color: 'var(--foreground-muted)' }} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    {[
                                        { label: 'Attendance', value: member.engagement?.attendanceScore || 0, color: '#6366f1' },
                                        { label: 'Giving', value: member.engagement?.givingScore || 0, color: '#10b981' },
                                        { label: 'Serving', value: member.engagement?.servingScore || 0, color: '#8b5cf6' },
                                    ].map((score) => (
                                        <div key={score.label}>
                                            <div
                                                className="text-3xl font-bold"
                                                style={{ color: score.color }}
                                            >
                                                {score.value}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                                {score.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column: Tabs */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2"
                        >
                            <div className="glass-card overflow-hidden">
                                {/* Tab Navigation */}
                                <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition relative ${activeTab === tab.id
                                                ? 'text-indigo-600'
                                                : ''
                                                }`}
                                            style={activeTab !== tab.id ? { color: 'var(--foreground-muted)' } : {}}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <motion.div
                                                    layoutId="tab-indicator"
                                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="p-6">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'overview' && (
                                            <motion.div
                                                key="overview"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <OverviewTab member={member} />
                                            </motion.div>
                                        )}
                                        {activeTab === 'attendance' && (
                                            <motion.div
                                                key="attendance"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <AttendanceTab memberId={member.id} />
                                            </motion.div>
                                        )}
                                        {activeTab === 'giving' && (
                                            <motion.div
                                                key="giving"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <GivingTab memberId={member.id} />
                                            </motion.div>
                                        )}
                                        {activeTab === 'follow-ups' && (
                                            <motion.div
                                                key="follow-ups"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <FollowUpsTab memberId={member.id} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function OverviewTab({ member }: { member: MemberDetail }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'var(--background)' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>Activity Summary</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Active member with regular attendance and participation.
                    </p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--background)' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>Member Since</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        {new Date(member.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>
            <div className="text-center py-8" style={{ color: 'var(--foreground-muted)' }}>
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Recent activity and timeline coming soon</p>
            </div>
        </div>
    );
}

function AttendanceTab({ memberId }: { memberId: string }) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/attendance/member/${memberId}`)
            .then(({ data }) => setRecords(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [memberId]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton h-12 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                <p style={{ color: 'var(--foreground-muted)' }}>No attendance records yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {records.map((r, i) => (
                <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{ background: 'var(--background)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                {r.serviceOccurrence?.template?.name || 'Service'}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                {new Date(r.checkInTime).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {r.method}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}

function GivingTab({ memberId }: { memberId: string }) {
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        api.get(`/giving/donations/member/${memberId}`)
            .then(({ data }) => {
                setDonations(data);
                setTotal(data.reduce((sum: number, d: any) => sum + (d.amount || 0), 0));
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [memberId]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton h-12 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div>
            {/* Total Summary */}
            <div className="p-4 rounded-lg mb-6" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <p className="text-white/80 text-sm">Total Giving</p>
                <p className="text-3xl font-bold text-white">GHS {total.toLocaleString()}</p>
            </div>

            {donations.length === 0 ? (
                <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                    <p style={{ color: 'var(--foreground-muted)' }}>No donations recorded yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {donations.map((d, i) => (
                        <motion.div
                            key={d.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-lg"
                            style={{ background: 'var(--background)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                        {d.fund?.name || 'General Fund'}
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                        {new Date(d.date).toLocaleDateString()} • {d.method}
                                    </p>
                                </div>
                            </div>
                            <span className="font-semibold text-green-600">
                                GHS {d.amount?.toLocaleString()}
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FollowUpsTab({ memberId }: { memberId: string }) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/follow-ups')
            .then(({ data }) => {
                const memberTasks = data.filter((t: any) => t.memberId === memberId);
                setTasks(memberTasks);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [memberId]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-20 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                <p style={{ color: 'var(--foreground-muted)' }}>No follow-up tasks</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map((t, i) => (
                <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--background)' }}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                {t.title}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                {t.description}
                            </p>
                            <p className="text-xs mt-2" style={{ color: 'var(--foreground-muted)' }}>
                                Due: {new Date(t.dueDate).toLocaleDateString()}
                            </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : t.status === 'IN_PROGRESS'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {t.status}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
