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
    QrCode, Smartphone, Keyboard, TrendingUp, Play, X
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
    };
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
                'Name,Email,Check-in Time,Method',
                ...attendance.map(r =>
                    `"${r.member.firstName} ${r.member.lastName}","${r.member.email}","${new Date(r.checkInTime).toLocaleString()}","${r.method}"`
                )
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

    // Members not yet checked in
    const availableMembers = members.filter(m =>
        !attendance.some(a => a.member.id === m.id) &&
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {[
                            {
                                label: 'Total Checked In',
                                value: attendance.length,
                                icon: Users,
                                color: '#6366f1'
                            },
                            {
                                label: 'QR Check-ins',
                                value: attendance.filter(a => a.method === 'QR').length,
                                icon: QrCode,
                                color: '#8b5cf6'
                            },
                            {
                                label: 'Manual Check-ins',
                                value: attendance.filter(a => a.method === 'MANUAL').length,
                                icon: Keyboard,
                                color: '#10b981'
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
                                            {attendance.map((record, i) => (
                                                <motion.div
                                                    key={record.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="p-4 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)' }}
                                                        >
                                                            {record.member.firstName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                                {record.member.firstName} {record.member.lastName}
                                                            </p>
                                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                                {record.member.email}
                                                            </p>
                                                        </div>
                                                    </div>
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
                                                </motion.div>
                                            ))}
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
        </div>
    );
}
