'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Plus, MoreHorizontal, Trash2, Edit2, Search, Filter, Calendar,
    User, Clock, AlertCircle, CheckCircle2, Circle, ArrowRight,
    Phone, Mail, MapPin, TrendingUp, Users, ListTodo, RefreshCw,
    X, ChevronDown, ExternalLink
} from 'lucide-react';

interface FollowUpTask {
    id: string;
    type: 'NEW_VISITOR' | 'INACTIVE_MEMBER' | 'GENERAL_PASTORAL';
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
    notes: string | null;
    dueDate: string | null;
    assigneeId: string | null;
    memberId: string;
    member: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
    };
    createdAt: string;
    updatedAt: string;
}

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
}

const COLUMNS = [
    {
        id: 'OPEN',
        title: 'To Do',
        color: 'from-red-500/20 to-orange-500/20',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-500',
        icon: Circle
    },
    {
        id: 'IN_PROGRESS',
        title: 'In Progress',
        color: 'from-amber-500/20 to-yellow-500/20',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-500',
        icon: Clock
    },
    {
        id: 'COMPLETED',
        title: 'Completed',
        color: 'from-emerald-500/20 to-green-500/20',
        borderColor: 'border-emerald-500/30',
        iconColor: 'text-emerald-500',
        icon: CheckCircle2
    },
];

const TASK_TYPES = [
    { value: 'NEW_VISITOR', label: 'New Visitor', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    { value: 'INACTIVE_MEMBER', label: 'Inactive Member', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    { value: 'GENERAL_PASTORAL', label: 'Pastoral Care', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
];

const PRIORITY_LEVELS = [
    { value: 'HIGH', label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
];

export default function FollowUpsPage() {
    const [tasks, setTasks] = useState<FollowUpTask[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTask, setEditingTask] = useState<FollowUpTask | null>(null);
    const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterAssignee, setFilterAssignee] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, membersRes] = await Promise.all([
                api.get('/follow-ups'),
                api.get('/members')
            ]);
            setTasks(tasksRes.data);
            setMembers(membersRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load follow-ups');
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
        toast.success('Refreshed');
    };

    const updateStatus = async (taskId: string, newStatus: string) => {
        try {
            await api.patch(`/follow-ups/${taskId}`, { status: newStatus });
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
            toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.title}`);
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this follow-up?')) return;
        try {
            await api.delete(`/follow-ups/${taskId}`);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            toast.success('Follow-up deleted');
        } catch (error) {
            console.error('Failed to delete', error);
            toast.error('Failed to delete');
        }
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = searchTerm === '' ||
            `${task.member.firstName} ${task.member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === '' || task.type === filterType;
        const matchesAssignee = filterAssignee === '' || task.assigneeId === filterAssignee;
        return matchesSearch && matchesType && matchesAssignee;
    });

    // Stats
    const stats = {
        total: tasks.length,
        open: tasks.filter(t => t.status === 'OPEN').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter(t => t.status === 'COMPLETED').length,
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
    };

    const getTypeConfig = (type: string) => TASK_TYPES.find(t => t.value === type) || TASK_TYPES[2];

    const isOverdue = (task: FollowUpTask) =>
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

    const getDaysRemaining = (dueDate: string | null) => {
        if (!dueDate) return null;
        const diff = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return diff;
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

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-6">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                                Follow-Ups
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                Manage pastoral care and member follow-ups
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={refreshData}
                                disabled={refreshing}
                                className="p-2 rounded-lg glass-card hover:scale-105 transition-transform"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--foreground-muted)' }} />
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                New Follow-Up
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Total</p>
                                    <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{stats.total}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                    <ListTodo className="w-5 h-5 text-indigo-500" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Open</p>
                                    <p className="text-2xl font-bold text-red-500">{stats.open}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                                    <Circle className="w-5 h-5 text-red-500" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>In Progress</p>
                                    <p className="text-2xl font-bold text-amber-500">{stats.inProgress}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Completed</p>
                                    <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Overdue</p>
                                    <p className="text-2xl font-bold text-rose-500">{stats.overdue}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-rose-500" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Search & Filters */}
                    <div className="glass-card p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search by name or notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-modern w-full pl-10"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="input-modern"
                                >
                                    <option value="">All Types</option>
                                    {TASK_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                                {(searchTerm || filterType || filterAssignee) && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterType('');
                                            setFilterAssignee('');
                                        }}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Kanban Board */}
                    <div className="flex gap-6 overflow-x-auto pb-6" style={{ minHeight: '500px' }}>
                        {COLUMNS.map((column, colIndex) => {
                            const columnTasks = filteredTasks.filter(t => t.status === column.id);
                            const Icon = column.icon;

                            return (
                                <motion.div
                                    key={column.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: colIndex * 0.1 }}
                                    className="flex-shrink-0 w-80"
                                >
                                    {/* Column Header */}
                                    <div className={`glass-card p-3 mb-4 bg-gradient-to-r ${column.color} border-l-4 ${column.borderColor}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-5 h-5 ${column.iconColor}`} />
                                                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                    {column.title}
                                                </h3>
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium glass-card">
                                                {columnTasks.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column Tasks */}
                                    <div className="space-y-3 min-h-[400px]">
                                        <AnimatePresence>
                                            {columnTasks.map((task, index) => {
                                                const typeConfig = getTypeConfig(task.type);
                                                const overdue = isOverdue(task);
                                                const daysRemaining = getDaysRemaining(task.dueDate);

                                                return (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`glass-card p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${overdue ? 'border border-red-500/50' : ''}`}
                                                        onClick={() => setSelectedTask(task)}
                                                    >
                                                        {/* Task Header */}
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                                                                {typeConfig.label}
                                                            </span>
                                                            <div className="relative group">
                                                                <button
                                                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                                                </button>
                                                                <div className="absolute right-0 mt-1 hidden w-40 rounded-lg glass-card shadow-lg group-hover:block z-20">
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingTask(task);
                                                                                setShowCreateModal(true);
                                                                            }}
                                                                            className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                            style={{ color: 'var(--foreground)' }}
                                                                        >
                                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </button>
                                                                        {COLUMNS.filter(col => col.id !== task.status).map(col => (
                                                                            <button
                                                                                key={col.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    updateStatus(task.id, col.id);
                                                                                }}
                                                                                className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                                style={{ color: 'var(--foreground)' }}
                                                                            >
                                                                                <ArrowRight className="mr-2 h-4 w-4" />
                                                                                Move to {col.title}
                                                                            </button>
                                                                        ))}
                                                                        <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDelete(task.id);
                                                                            }}
                                                                            className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Member Info */}
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                                                {task.member.firstName[0]}{task.member.lastName[0]}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                                    {task.member.firstName} {task.member.lastName}
                                                                </h4>
                                                                {task.member.phone && (
                                                                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                                                        {task.member.phone}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Notes */}
                                                        {task.notes && (
                                                            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--foreground-muted)' }}>
                                                                {task.notes}
                                                            </p>
                                                        )}

                                                        {/* Footer */}
                                                        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {task.dueDate ? (
                                                                    <span className={overdue ? 'text-red-500 font-medium' : ''}>
                                                                        {overdue ? 'Overdue' : daysRemaining === 0 ? 'Today' : daysRemaining === 1 ? 'Tomorrow' : `${daysRemaining} days`}
                                                                    </span>
                                                                ) : (
                                                                    <span>No due date</span>
                                                                )}
                                                            </div>
                                                            <span>
                                                                {new Date(task.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>

                                        {columnTasks.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <Icon className={`w-12 h-12 mb-3 opacity-30 ${column.iconColor}`} />
                                                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                    No tasks
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </main>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateFollowUpModal
                        members={members}
                        editingTask={editingTask}
                        onClose={() => {
                            setShowCreateModal(false);
                            setEditingTask(null);
                        }}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            setEditingTask(null);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Task Detail Modal */}
            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onEdit={() => {
                            setEditingTask(selectedTask);
                            setSelectedTask(null);
                            setShowCreateModal(true);
                        }}
                        onStatusChange={(status) => {
                            updateStatus(selectedTask.id, status);
                            setSelectedTask(null);
                        }}
                        onDelete={() => {
                            handleDelete(selectedTask.id);
                            setSelectedTask(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Create/Edit Modal Component
function CreateFollowUpModal({
    members,
    editingTask,
    onClose,
    onSuccess
}: {
    members: Member[];
    editingTask: FollowUpTask | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: editingTask?.type || 'NEW_VISITOR',
        memberId: editingTask?.memberId || '',
        notes: editingTask?.notes || '',
        dueDate: editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '',
        assigneeId: editingTask?.assigneeId || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.memberId) {
            toast.error('Please select a member');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                type: form.type,
                memberId: form.memberId,
                notes: form.notes || undefined,
                dueDate: form.dueDate || undefined,
                assigneeId: form.assigneeId || undefined,
            };

            if (editingTask) {
                await api.patch(`/follow-ups/${editingTask.id}`, payload);
                toast.success('Follow-up updated');
            } else {
                await api.post('/follow-ups', payload);
                toast.success('Follow-up created');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save');
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
                className="glass-card p-6 w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                        {editingTask ? 'Edit Follow-Up' : 'New Follow-Up'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Member *
                        </label>
                        <select
                            required
                            className="input-modern w-full"
                            value={form.memberId}
                            onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                        >
                            <option value="">Select a member</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.firstName} {m.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Type *
                        </label>
                        <select
                            required
                            className="input-modern w-full"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            {TASK_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Due Date
                        </label>
                        <input
                            type="date"
                            className="input-modern w-full"
                            value={form.dueDate}
                            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Notes
                        </label>
                        <textarea
                            rows={4}
                            className="input-modern w-full"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Add details about the follow-up..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : editingTask ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Task Detail Modal
function TaskDetailModal({
    task,
    onClose,
    onEdit,
    onStatusChange,
    onDelete
}: {
    task: FollowUpTask;
    onClose: () => void;
    onEdit: () => void;
    onStatusChange: (status: string) => void;
    onDelete: () => void;
}) {
    const typeConfig = TASK_TYPES.find(t => t.value === task.type) || TASK_TYPES[0];
    const column = COLUMNS.find(c => c.id === task.status)!;

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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeConfig.color}`}>
                        {typeConfig.label}
                    </span>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Member Info */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                        {task.member.firstName[0]}{task.member.lastName[0]}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                            {task.member.firstName} {task.member.lastName}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                            {task.member.phone && (
                                <div className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {task.member.phone}
                                </div>
                            )}
                            {task.member.email && (
                                <div className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {task.member.email}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                        Status
                    </label>
                    <div className="flex gap-2">
                        {COLUMNS.map(col => (
                            <button
                                key={col.id}
                                onClick={() => onStatusChange(col.id)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${task.status === col.id
                                        ? `bg-gradient-to-r ${col.color} ${col.borderColor} border`
                                        : 'glass-card hover:scale-105'
                                    }`}
                                style={{ color: 'var(--foreground)' }}
                            >
                                {col.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Due Date */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        <Calendar className="w-4 h-4" />
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</span>
                    </div>
                </div>

                {/* Notes */}
                {task.notes && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                            Notes
                        </label>
                        <div className="glass-card p-3 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                            {task.notes}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                    <button onClick={onEdit} className="btn-primary flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
