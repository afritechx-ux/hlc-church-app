'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Plus, Calendar, Clock, MapPin, Users, QrCode,
    ChevronLeft, ChevronRight, Grid, List, Filter,
    TrendingUp, Eye, CheckCircle, XCircle, Play, Pause
} from 'lucide-react';

interface ServiceOccurrence {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    template: {
        id: string;
        name: string;
        campus: string;
        type: string;
    };
    _count?: {
        attendances: number;
    };
}

interface ServiceTemplate {
    id: string;
    name: string;
    campus: string;
    type: string;
}

type ViewMode = 'grid' | 'calendar';
type TabFilter = 'all' | 'upcoming' | 'past' | 'live';

export default function ServicesPage() {
    const [services, setServices] = useState<ServiceOccurrence[]>([]);
    const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // View options
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [tabFilter, setTabFilter] = useState<TabFilter>('upcoming');
    const [templateFilter, setTemplateFilter] = useState('all');

    // Calendar
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [servicesRes, templatesRes] = await Promise.all([
                api.get('/services/occurrences'),
                api.get('/services/templates')
            ]);
            setServices(servicesRes.data);
            setTemplates(templatesRes.data);
        } catch (error) {
            console.error('Failed to fetch services', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        const upcoming = services.filter(s => new Date(s.date) >= now);
        const past = services.filter(s => new Date(s.date) < now);
        const totalAttendance = services.reduce((sum, s) => sum + (s._count?.attendances || 0), 0);
        const avgAttendance = past.length > 0
            ? Math.round(totalAttendance / past.length)
            : 0;

        // Find live service (happening now)
        const live = services.find(s => {
            const serviceDate = new Date(s.date).toDateString();
            const today = now.toDateString();
            if (serviceDate !== today) return false;
            const start = new Date(s.startTime);
            const end = new Date(s.endTime);
            return now >= start && now <= end;
        });

        return {
            total: services.length,
            upcoming: upcoming.length,
            past: past.length,
            avgAttendance,
            totalAttendance,
            live
        };
    }, [services]);

    // Filtered services
    const filteredServices = useMemo(() => {
        let result = [...services];
        const now = new Date();

        // Tab filter
        switch (tabFilter) {
            case 'upcoming':
                result = result.filter(s => new Date(s.date) >= now);
                break;
            case 'past':
                result = result.filter(s => new Date(s.date) < now);
                break;
            case 'live':
                result = result.filter(s => {
                    const serviceDate = new Date(s.date).toDateString();
                    const today = now.toDateString();
                    if (serviceDate !== today) return false;
                    const start = new Date(s.startTime);
                    const end = new Date(s.endTime);
                    return now >= start && now <= end;
                });
                break;
        }

        // Template filter
        if (templateFilter !== 'all') {
            result = result.filter(s => s.template.id === templateFilter);
        }

        // Sort by date
        result.sort((a, b) => {
            if (tabFilter === 'past') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        return result;
    }, [services, tabFilter, templateFilter]);

    // Calendar helpers
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();

        const days = [];

        // Previous month padding
        for (let i = 0; i < startPadding; i++) {
            const date = new Date(year, month, -startPadding + i + 1);
            days.push({ date, isCurrentMonth: false });
        }

        // Current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push({ date, isCurrentMonth: true });
        }

        // Next month padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(year, month + 1, i);
            days.push({ date, isCurrentMonth: false });
        }

        return days;
    }, [currentMonth]);

    const getServicesForDate = (date: Date) => {
        return services.filter(s =>
            new Date(s.date).toDateString() === date.toDateString()
        );
    };

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const tabs = [
        { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: stats.upcoming },
        { id: 'past', label: 'Past', icon: CheckCircle, count: stats.past },
        { id: 'live', label: 'Live Now', icon: Play, count: stats.live ? 1 : 0 },
        { id: 'all', label: 'All', icon: Grid, count: stats.total },
    ];

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
                        className="mb-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                                    Services
                                </h1>
                                <p style={{ color: 'var(--foreground-muted)' }}>
                                    Manage church services and attendance
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Schedule Service
                            </button>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: '#6366f1' },
                            { label: 'Total Services', value: stats.total, icon: Grid, color: '#10b981' },
                            { label: 'Avg Attendance', value: stats.avgAttendance, icon: Users, color: '#f59e0b' },
                            { label: 'Total Attended', value: stats.totalAttendance, icon: TrendingUp, color: '#8b5cf6' },
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

                    {/* Live Service Banner */}
                    {stats.live && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-4 rounded-xl flex items-center justify-between"
                            style={{
                                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                color: 'white'
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-3 h-3 rounded-full bg-white animate-ping absolute" />
                                    <div className="w-3 h-3 rounded-full bg-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{stats.live.template.name}</p>
                                    <p className="text-sm opacity-90">Live Now • {stats.live._count?.attendances || 0} attendees</p>
                                </div>
                            </div>
                            <Link
                                href={`/services/${stats.live.id}`}
                                className="px-4 py-2 rounded-lg bg-white text-red-600 font-medium hover:bg-gray-100 transition flex items-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                View Service
                            </Link>
                        </motion.div>
                    )}

                    {/* Tabs & View Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTabFilter(tab.id as TabFilter)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition ${tabFilter === tab.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    style={tabFilter !== tab.id ? { color: 'var(--foreground)' } : {}}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${tabFilter === tab.id
                                            ? 'bg-white/20'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={templateFilter}
                                onChange={(e) => setTemplateFilter(e.target.value)}
                                className="input-modern"
                            >
                                <option value="all">All Templates</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>

                            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 transition ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : ''}`}
                                    style={viewMode !== 'grid' ? { color: 'var(--foreground)' } : {}}
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`p-2.5 transition ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : ''}`}
                                    style={viewMode !== 'calendar' ? { color: 'var(--foreground)' } : {}}
                                >
                                    <Calendar className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Grid View */}
                        {viewMode === 'grid' && (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <div key={i} className="skeleton h-48 rounded-xl" />
                                    ))
                                ) : filteredServices.length === 0 ? (
                                    <div className="col-span-full py-12 text-center">
                                        <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                                        <p style={{ color: 'var(--foreground-muted)' }}>No services found</p>
                                    </div>
                                ) : (
                                    filteredServices.map((service, i) => (
                                        <ServiceCard key={service.id} service={service} index={i} />
                                    ))
                                )}
                            </motion.div>
                        )}

                        {/* Calendar View */}
                        {viewMode === 'calendar' && (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="glass-card p-6"
                            >
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                            className="btn-secondary p-2"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentMonth(new Date())}
                                            className="btn-secondary px-3"
                                        >
                                            Today
                                        </button>
                                        <button
                                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                            className="btn-secondary p-2"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                        <div
                                            key={day}
                                            className="text-center text-sm font-medium py-2"
                                            style={{ color: 'var(--foreground-muted)' }}
                                        >
                                            {day}
                                        </div>
                                    ))}
                                    {calendarDays.map(({ date, isCurrentMonth }, i) => {
                                        const dayServices = getServicesForDate(date);
                                        const today = isToday(date);

                                        return (
                                            <div
                                                key={i}
                                                className={`min-h-[100px] p-2 rounded-lg border transition ${today
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                                            >
                                                <div className={`text-sm font-medium mb-1 ${today ? 'text-indigo-600' : ''
                                                    }`} style={!today ? { color: 'var(--foreground)' } : {}}>
                                                    {date.getDate()}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayServices.slice(0, 2).map((s) => (
                                                        <Link
                                                            key={s.id}
                                                            href={`/services/${s.id}`}
                                                            className="block text-xs p-1 rounded truncate"
                                                            style={{
                                                                background: 'var(--primary)',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            {s.template.name}
                                                        </Link>
                                                    ))}
                                                    {dayServices.length > 2 && (
                                                        <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                                            +{dayServices.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Create Service Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateServiceModal
                        templates={templates}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Service Card Component
function ServiceCard({ service, index }: { service: ServiceOccurrence; index: number }) {
    const now = new Date();
    const serviceDate = new Date(service.date);
    const isPast = serviceDate < now;
    const isLive = (() => {
        if (serviceDate.toDateString() !== now.toDateString()) return false;
        const start = new Date(service.startTime);
        const end = new Date(service.endTime);
        return now >= start && now <= end;
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link
                href={`/services/${service.id}`}
                className="glass-card p-5 block transition hover:shadow-lg group"
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold group-hover:text-indigo-600 transition" style={{ color: 'var(--foreground)' }}>
                            {service.template.name}
                        </h3>
                        {service.template.type && (
                            <span
                                className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                                style={{ background: 'var(--primary)', color: 'white' }}
                            >
                                {service.template.type}
                            </span>
                        )}
                    </div>
                    {isLive && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-medium">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                        </div>
                    )}
                    {isPast && !isLive && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        <Calendar className="w-4 h-4" />
                        {serviceDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        <Clock className="w-4 h-4" />
                        {new Date(service.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(service.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {service.template.campus && (
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                            <MapPin className="w-4 h-4" />
                            {service.template.campus}
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {service._count?.attendances || 0} attendees
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span className="text-sm" style={{ color: 'var(--primary)' }}>
                            QR Check-in
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// Create Service Modal
function CreateServiceModal({
    templates,
    onClose,
    onSuccess
}: {
    templates: ServiceTemplate[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [showCreateTemplate, setShowCreateTemplate] = useState(templates.length === 0);
    const [localTemplates, setLocalTemplates] = useState(templates);
    const [form, setForm] = useState({
        templateId: templates[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
    });
    const [templateForm, setTemplateForm] = useState({
        name: '',
        campus: '',
    });

    const handleCreateTemplate = async () => {
        if (!templateForm.name) {
            toast.error('Please enter a template name');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/services/templates', templateForm);
            toast.success('Template created successfully');
            setLocalTemplates([...localTemplates, data]);
            setForm({ ...form, templateId: data.id });
            setShowCreateTemplate(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create template');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.templateId) {
            toast.error('Please select a service template');
            return;
        }
        setLoading(true);
        try {
            const startDateTime = new Date(`${form.date}T${form.startTime}:00`);
            const endDateTime = new Date(`${form.date}T${form.endTime}:00`);

            await api.post('/services/occurrences', {
                templateId: form.templateId,
                date: form.date,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
            });
            toast.success('Service scheduled successfully');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to schedule service');
        } finally {
            setLoading(false);
        }
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
                className="glass-card p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                        {showCreateTemplate ? 'Create Service Template' : 'Schedule Service'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {showCreateTemplate ? (
                    <div className="space-y-4">
                        <p className="text-sm p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            No service templates found. Create one first to schedule services.
                        </p>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Template Name *
                            </label>
                            <input
                                type="text"
                                required
                                className="input-modern w-full"
                                value={templateForm.name}
                                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                placeholder="e.g., Sunday Service"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Campus / Location
                            </label>
                            <input
                                type="text"
                                className="input-modern w-full"
                                value={templateForm.campus}
                                onChange={(e) => setTemplateForm({ ...templateForm, campus: e.target.value })}
                                placeholder="e.g., Main Campus"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateTemplate}
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Creating...' : 'Create Template'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Service Template *
                            </label>
                            <select
                                required
                                className="input-modern w-full"
                                value={form.templateId}
                                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                            >
                                <option value="">Select a template</option>
                                {localTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowCreateTemplate(true)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                            >
                                + Create new template
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Date *
                            </label>
                            <input
                                type="date"
                                required
                                className="input-modern w-full"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                    Start Time *
                                </label>
                                <input
                                    type="time"
                                    required
                                    className="input-modern w-full"
                                    value={form.startTime}
                                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                    End Time *
                                </label>
                                <input
                                    type="time"
                                    required
                                    className="input-modern w-full"
                                    value={form.endTime}
                                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Scheduling...' : 'Schedule Service'}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </motion.div >
    );
}
