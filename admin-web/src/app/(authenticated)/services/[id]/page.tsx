'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import LiveQR from '@/components/LiveQR';
import toast from 'react-hot-toast';
import {
    Calendar, Clock, MapPin, Users, ChevronLeft, Search,
    Download, RefreshCw, CheckCircle, XCircle, UserPlus,
    QrCode, Smartphone, Keyboard, TrendingUp, Play, X,
    AlertTriangle, Link2, UserCheck
} from 'lucide-react';

interface ServiceDetail {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    template: {
        name: string;
        campus: string;
        type: string;
    };
}

interface AttendanceRecord {
    id: string;
    member: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
    visitorName?: string;
    visitorPhone?: string;
    category?: string;
    notes?: string;
    checkInTime: string;
    method: string;
}

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [service, setService] = useState<ServiceDetail | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showManualCheckIn, setShowManualCheckIn] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [linkSearchTerm, setLinkSearchTerm] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchData(params.id as string);
        }
    }, [params.id]);

    // Auto-refresh attendance every 30 seconds for live services
    useEffect(() => {
        if (!service) return;

        const now = new Date();
        const serviceDate = new Date(service.date);
        const isToday = serviceDate.toDateString() === now.toDateString();

        if (!isToday) return;

        const interval = setInterval(() => {
            refreshAttendance();
        }, 30000);

        return () => clearInterval(interval);
    }, [service]);

    const fetchData = async (id: string) => {
        try {
            const [serviceRes, attendanceRes, membersRes] = await Promise.all([
                api.get(`/services/occurrences/${id}`),
                api.get(`/attendance/service/${id}`),
                api.get('/members'),
            ]);
            setService(serviceRes.data);
            setAttendance(attendanceRes.data);
            setMembers(membersRes.data);
        } catch (error) {
            console.error('Failed to fetch service details', error);
            toast.error('Failed to load service');
        } finally {
            setLoading(false);
        }
    };

    const refreshAttendance = async () => {
        if (!service) return;
        setRefreshing(true);
        try {
            const { data } = await api.get(`/attendance/service/${service.id}`);
            setAttendance(data);
        } catch (error) {
            console.error('Failed to refresh', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleManualCheckIn = async (memberId: string) => {
        if (!service) return;
        try {
            await api.post('/attendance/check-in', {
                memberId,
                serviceOccurrenceId: service.id,
                method: 'MANUAL'
            });
            toast.success('Member checked in successfully');
            refreshAttendance();
            setShowManualCheckIn(false);
            setSearchTerm('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to check in');
        }
    };

    const handleExport = async () => {
        if (!service) return;
        try {
            const csvContent = [
                'Name,Email/Phone,Check-in Time,Method,Type',
                ...attendance.map(r => {
                    const name = r.member
                        ? `${r.member.firstName} ${r.member.lastName}`
                        : (r.visitorName || 'Unknown');
                    const contact = r.member
                        ? r.member.email
                        : (r.visitorPhone || '');
                    const type = r.member ? 'Member' : (r.category || 'Visitor');
                    return `"${name}","${contact}","${new Date(r.checkInTime).toLocaleString()}","${r.method}","${type}"`;
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `attendance-${service.template.name}-${service.date}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Attendance exported');
        } catch (error) {
            toast.error('Failed to export');
        }
    };

    const handleLinkMember = async (memberId: string) => {
        if (!selectedRecord) return;
        try {
            await api.patch(`/attendance/${selectedRecord.id}/link`, { memberId });
            toast.success('Attendance linked to member successfully');
            refreshAttendance();
            setShowLinkModal(false);
            setSelectedRecord(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to link member');
        }
    };

    const handleCreateMember = async () => {
        if (!selectedRecord) return;
        try {
            // First create the member
            const nameParts = (selectedRecord.visitorName || '').split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.slice(1).join(' ') || '';

            const { data: newMember } = await api.post('/members', {
                firstName,
                lastName,
                phone: selectedRecord.visitorPhone || '',
                status: 'ACTIVE',
            });

            // Then link the attendance record
            await api.patch(`/attendance/${selectedRecord.id}/link`, { memberId: newMember.id });

            toast.success(`Member "${firstName} ${lastName}" created and linked!`);
            refreshAttendance();
            // Refresh members list
            const { data: membersData } = await api.get('/members');
            setMembers(membersData);
            setShowLinkModal(false);
            setSelectedRecord(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create member');
        }
    };

    // Members for link modal (all members)
    const linkableMembers = members.filter(m =>
        linkSearchTerm === '' ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(linkSearchTerm.toLowerCase())
    );

    // Members not yet checked in
    const availableMembers = members.filter(m =>
        !attendance.some(a => a.member?.id === m.id) &&
        (searchTerm === '' ||
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Check if service is live
    const isLive = (() => {
        if (!service) return false;
        const now = new Date();
        const serviceDate = new Date(service.date);
        if (serviceDate.toDateString() !== now.toDateString()) return false;
        const start = new Date(service.startTime);
        const end = new Date(service.endTime);
        return now >= start && now <= end;
    })();

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

    if (!service) {
        return (
            <div className="flex h-screen" style={{ background: 'var(--background)' }}>
                <Sidebar />
                <div className="flex flex-1 flex-col">
                    <Header />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                            <p style={{ color: 'var(--foreground-muted)' }}>Service not found</p>
                            <button onClick={() => router.push('/services')} className="btn-primary mt-4">
                                Back to Services
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
                    {/* Back & Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <button
                            onClick={() => router.push('/services')}
                            className="flex items-center gap-2 mb-4 text-sm hover:text-indigo-600 transition"
                            style={{ color: 'var(--foreground-muted)' }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Services
                        </button>

                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                                        {service.template.name}
                                    </h1>
                                    {isLive && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 text-sm font-medium">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            LIVE
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(service.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {new Date(service.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {' - '}
                                        {new Date(service.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {service.template.campus && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {service.template.campus}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={refreshAttendance}
                                    disabled={refreshing}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                                <button
                                    onClick={() => setShowManualCheckIn(true)}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Manual Check-in
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {[
                            {
                                label: 'Total Checked In',
                                value: attendance.length,
                                icon: Users,
                                color: '#6366f1'
                            },
                            {
                                label: 'Members',
                                value: attendance.filter(a => a.member).length,
                                icon: UserCheck,
                                color: '#10b981'
                            },
                            {
                                label: 'Visitors',
                                value: attendance.filter(a => !a.member && a.category === 'VISITOR').length,
                                icon: UserPlus,
                                color: '#f59e0b'
                            },
                            {
                                label: 'Unverified',
                                value: attendance.filter(a => !a.member && a.category === 'MEMBER').length,
                                icon: AlertTriangle,
                                color: '#ef4444'
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-5"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                            {stat.label}
                                        </p>
                                        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div
                                        className="p-3 rounded-xl"
                                        style={{ backgroundColor: stat.color + '20' }}
                                    >
                                        <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* QR Code */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-1"
                        >
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                    Check-in QR Code
                                </h3>
                                <LiveQR occurrenceId={service.id} />
                                <p className="text-sm text-center mt-4" style={{ color: 'var(--foreground-muted)' }}>
                                    Scan to check in to this service
                                </p>
                            </div>
                        </motion.div>

                        {/* Attendance List */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2"
                        >
                            <div className="glass-card overflow-hidden">
                                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                                    <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                                        Attendance List
                                    </h3>
                                    <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--primary)', color: 'white' }}>
                                        {attendance.length} attendees
                                    </span>
                                </div>

                                <div className="max-h-[500px] overflow-y-auto">
                                    {attendance.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                                            <p style={{ color: 'var(--foreground-muted)' }}>No one has checked in yet</p>
                                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                                Share the QR code or use manual check-in
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {attendance.map((record, i) => {
                                                const displayName = record.member
                                                    ? `${record.member.firstName} ${record.member.lastName}`
                                                    : (record.visitorName || 'Unknown');
                                                const displayInitial = record.member
                                                    ? record.member.firstName[0]
                                                    : (record.visitorName?.[0] || '?');
                                                const displayContact = record.member
                                                    ? record.member.email
                                                    : (record.visitorPhone || '');
                                                const isLinkedMember = !!record.member;
                                                const isVisitor = !record.member && record.category === 'VISITOR';
                                                const isUnverifiedMember = !record.member && record.category === 'MEMBER';

                                                // Determine avatar color
                                                let avatarGradient = 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)';
                                                if (isVisitor) {
                                                    avatarGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                                                } else if (isUnverifiedMember) {
                                                    avatarGradient = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                                                }

                                                return (
                                                    <motion.div
                                                        key={record.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="p-4 flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold relative"
                                                                style={{ background: avatarGradient }}
                                                            >
                                                                {displayInitial}
                                                                {isUnverifiedMember && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                                                        <AlertTriangle className="w-2.5 h-2.5 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                                        {displayName}
                                                                    </p>
                                                                    {isVisitor && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                                            Visitor
                                                                        </span>
                                                                    )}
                                                                    {isUnverifiedMember && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            Unverified
                                                                        </span>
                                                                    )}
                                                                    {isLinkedMember && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                            Member
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                                    {displayContact}
                                                                </p>
                                                                {record.notes && record.notes.includes('[Claimed Member not found]') && (
                                                                    <p className="text-xs text-red-500 mt-0.5">
                                                                        Not found in member database
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isUnverifiedMember && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRecord(record);
                                                                        setShowLinkModal(true);
                                                                        setLinkSearchTerm('');
                                                                    }}
                                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition"
                                                                    title="Link to existing member or create new"
                                                                >
                                                                    <Link2 className="w-3 h-3" />
                                                                    Link
                                                                </button>
                                                            )}
                                                            <div className="text-right">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${record.method === 'QR'
                                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                    }`}>
                                                                    {record.method === 'QR' ? <QrCode className="w-3 h-3" /> : <Keyboard className="w-3 h-3" />}
                                                                    {record.method}
                                                                </span>
                                                                <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                                                    {new Date(record.checkInTime).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>

            {/* Manual Check-in Modal */}
            <AnimatePresence>
                {showManualCheckIn && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowManualCheckIn(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card p-6 w-full max-w-md max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                                    Manual Check-in
                                </h2>
                                <button
                                    onClick={() => setShowManualCheckIn(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    className="input-modern w-full pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {availableMembers.length === 0 ? (
                                    <div className="py-8 text-center" style={{ color: 'var(--foreground-muted)' }}>
                                        {searchTerm ? 'No members found' : 'All members have checked in'}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {availableMembers.slice(0, 20).map((member) => (
                                            <button
                                                key={member.id}
                                                onClick={() => handleManualCheckIn(member.id)}
                                                className="w-full p-3 rounded-lg flex items-center gap-3 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                    style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)' }}
                                                >
                                                    {member.firstName[0]}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                        {member.firstName} {member.lastName}
                                                    </p>
                                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Link Member Modal */}
            <AnimatePresence>
                {showLinkModal && selectedRecord && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowLinkModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card p-6 w-full max-w-md max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                                    Link to Member
                                </h2>
                                <button
                                    onClick={() => setShowLinkModal(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Selected Record Info */}
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-700 dark:text-red-400">Unverified Check-in</span>
                                </div>
                                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                                    <strong>{selectedRecord.visitorName}</strong>
                                </p>
                                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                    {selectedRecord.visitorPhone}
                                </p>
                            </div>

                            {/* Create New Member Button */}
                            <button
                                onClick={handleCreateMember}
                                className="w-full mb-4 p-3 rounded-lg border-2 border-dashed border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center justify-center gap-2 text-green-700 dark:text-green-400"
                            >
                                <UserPlus className="w-5 h-5" />
                                <span className="font-medium">Create New Member</span>
                            </button>

                            <div className="text-center text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
                                — or link to existing member —
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    className="input-modern w-full pl-10"
                                    value={linkSearchTerm}
                                    onChange={(e) => setLinkSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {linkableMembers.length === 0 ? (
                                    <div className="py-8 text-center" style={{ color: 'var(--foreground-muted)' }}>
                                        No members found
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {linkableMembers.slice(0, 20).map((member) => (
                                            <button
                                                key={member.id}
                                                onClick={() => handleLinkMember(member.id)}
                                                className="w-full p-3 rounded-lg flex items-center gap-3 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                    style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)' }}
                                                >
                                                    {member.firstName[0]}
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                        {member.firstName} {member.lastName}
                                                    </p>
                                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                        {member.email}
                                                    </p>
                                                </div>
                                                <Link2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
