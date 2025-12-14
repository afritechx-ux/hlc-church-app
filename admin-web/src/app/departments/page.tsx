'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Users, Plus, Edit2, Trash2, X, Search, MoreHorizontal,
    UserPlus, ChevronRight, Crown, Building2, Filter,
    TrendingUp, Calendar, CheckCircle, UserMinus, Grid, List,
    Star, Award
} from 'lucide-react';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
}

interface DepartmentMember {
    id: string;
    role: string | null;
    member: Member;
}

interface Department {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    members: DepartmentMember[];
}

// Department color palette
const DEPT_COLORS = [
    { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
    { bg: 'from-blue-500 to-cyan-600', light: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
    { bg: 'from-indigo-500 to-blue-600', light: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
];

const getDeptColor = (index: number) => DEPT_COLORS[index % DEPT_COLORS.length];

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modals
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);

    // Expanded department for detail view
    const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, membersRes] = await Promise.all([
                api.get('/departments'),
                api.get('/members'),
            ]);
            setDepartments(deptRes.data);
            setAllMembers(membersRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const stats = useMemo(() => {
        const totalMembers = departments.reduce((sum, d) => sum + (d.members?.length || 0), 0);
        const leaders = departments.reduce((sum, d) =>
            sum + (d.members?.filter(m => m.role === 'LEADER' || m.role === 'HEAD').length || 0), 0);

        return {
            total: departments.length,
            totalMembers,
            leaders,
            avgSize: departments.length ? Math.round(totalMembers / departments.length) : 0,
        };
    }, [departments]);

    const filteredDepartments = useMemo(() => {
        if (!searchTerm) return departments;
        return departments.filter(d =>
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [departments, searchTerm]);

    // CRUD Handlers
    const handleSaveDepartment = async (data: { name: string; description: string }) => {
        try {
            if (editingDept) {
                await api.patch(`/departments/${editingDept.id}`, data);
                toast.success('Department updated');
            } else {
                await api.post('/departments', data);
                toast.success('Department created');
            }
            fetchData();
            setShowDeptModal(false);
            setEditingDept(null);
        } catch (error) {
            toast.error('Failed to save department');
        }
    };

    const handleDeleteDepartment = async (id: string) => {
        if (!confirm('Delete this department? This will remove all member associations.')) return;
        try {
            await api.delete(`/departments/${id}`);
            toast.success('Department deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete department');
        }
    };

    const handleAddMember = async (memberId: string, role: string = 'MEMBER') => {
        if (!selectedDept) return;
        try {
            await api.post(`/departments/${selectedDept.id}/members/${memberId}`, { role });
            toast.success('Member added to department');
            fetchData();
            setShowMemberModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (deptId: string, memberId: string) => {
        if (!confirm('Remove this member from the department?')) return;
        try {
            await api.delete(`/departments/${deptId}/members/${memberId}`);
            toast.success('Member removed');
            fetchData();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    const getAvailableMembers = (dept: Department) => {
        const existingIds = new Set(dept.members?.map(m => m.member.id) || []);
        return allMembers.filter(m => !existingIds.has(m.id));
    };

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
                            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                                    <Building2 className="w-7 h-7 text-white" />
                                </div>
                                Departments
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                Organize and manage church departments and ministry teams
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingDept(null);
                                setShowDeptModal(true);
                            }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Department
                        </button>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Departments', value: stats.total, icon: Building2, color: 'from-indigo-500 to-purple-500' },
                            { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'from-blue-500 to-cyan-500' },
                            { label: 'Department Leaders', value: stats.leaders, icon: Crown, color: 'from-amber-500 to-orange-500' },
                            { label: 'Avg Members/Dept', value: stats.avgSize, icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                        <stat.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                                            {stat.value}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Search and View Toggle */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-4 mb-6"
                    >
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search departments..."
                                    className="input-modern w-full pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : ''}`}
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-indigo-500 text-white' : ''}`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Departments */}
                    {loading ? (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="glass-card p-6">
                                    <div className="skeleton h-8 w-2/3 mb-4" />
                                    <div className="skeleton h-4 w-full mb-2" />
                                    <div className="skeleton h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : filteredDepartments.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card p-12 text-center"
                        >
                            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                                {searchTerm ? 'No departments found' : 'No departments yet'}
                            </h3>
                            <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>
                                {searchTerm ? 'Try adjusting your search' : 'Create your first department to get started'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => setShowDeptModal(true)}
                                    className="btn-primary"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Department
                                </button>
                            )}
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDepartments.map((dept, index) => (
                                <DepartmentCard
                                    key={dept.id}
                                    department={dept}
                                    colorIndex={index}
                                    onEdit={() => {
                                        setEditingDept(dept);
                                        setShowDeptModal(true);
                                    }}
                                    onDelete={() => handleDeleteDepartment(dept.id)}
                                    onAddMember={() => {
                                        setSelectedDept(dept);
                                        setShowMemberModal(true);
                                    }}
                                    onRemoveMember={(memberId) => handleRemoveMember(dept.id, memberId)}
                                    isExpanded={expandedDeptId === dept.id}
                                    onToggleExpand={() => setExpandedDeptId(expandedDeptId === dept.id ? null : dept.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredDepartments.map((dept, index) => (
                                <DepartmentListItem
                                    key={dept.id}
                                    department={dept}
                                    colorIndex={index}
                                    onEdit={() => {
                                        setEditingDept(dept);
                                        setShowDeptModal(true);
                                    }}
                                    onDelete={() => handleDeleteDepartment(dept.id)}
                                    onAddMember={() => {
                                        setSelectedDept(dept);
                                        setShowMemberModal(true);
                                    }}
                                    onRemoveMember={(memberId) => handleRemoveMember(dept.id, memberId)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Department Modal */}
            <AnimatePresence>
                {showDeptModal && (
                    <DepartmentModal
                        department={editingDept}
                        onClose={() => {
                            setShowDeptModal(false);
                            setEditingDept(null);
                        }}
                        onSave={handleSaveDepartment}
                    />
                )}
            </AnimatePresence>

            {/* Add Member Modal */}
            <AnimatePresence>
                {showMemberModal && selectedDept && (
                    <AddMemberModal
                        department={selectedDept}
                        availableMembers={getAvailableMembers(selectedDept)}
                        onClose={() => {
                            setShowMemberModal(false);
                            setSelectedDept(null);
                        }}
                        onAdd={handleAddMember}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Department Card Component
function DepartmentCard({
    department,
    colorIndex,
    onEdit,
    onDelete,
    onAddMember,
    onRemoveMember,
    isExpanded,
    onToggleExpand,
}: {
    department: Department;
    colorIndex: number;
    onEdit: () => void;
    onDelete: () => void;
    onAddMember: () => void;
    onRemoveMember: (memberId: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}) {
    const color = getDeptColor(colorIndex);
    const leaders = department.members?.filter(m => m.role === 'LEADER' || m.role === 'HEAD') || [];
    const regularMembers = department.members?.filter(m => m.role !== 'LEADER' && m.role !== 'HEAD') || [];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card overflow-hidden group"
        >
            {/* Header with gradient */}
            <div className={`p-4 bg-gradient-to-r ${color.bg}`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">
                            {department.name}
                        </h3>
                        {department.description && (
                            <p className="text-sm text-white/80 mt-1 line-clamp-2">
                                {department.description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={onEdit}
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
                        >
                            <Edit2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-red-500/50 transition"
                        >
                            <Trash2 className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                            {department.members?.length || 0}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Members</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-amber-500">
                            {leaders.length}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Leaders</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-emerald-500">
                            {regularMembers.length}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Team</p>
                    </div>
                </div>
            </div>

            {/* Members Preview / Expanded */}
            <div className="p-4">
                {/* Leaders */}
                {leaders.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                            <Crown className="w-3 h-3 text-amber-500" />
                            Leaders
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {leaders.map((dm) => (
                                <div
                                    key={dm.id}
                                    className="flex items-center gap-2 px-2 py-1 rounded-lg group/member"
                                    style={{ background: 'var(--background)' }}
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
                                        {dm.member.firstName[0]}
                                    </div>
                                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                        {dm.member.firstName} {dm.member.lastName[0]}.
                                    </span>
                                    <button
                                        onClick={() => onRemoveMember(dm.member.id)}
                                        className="opacity-0 group-hover/member:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                    >
                                        <X className="w-3 h-3 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Members */}
                {isExpanded && regularMembers.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-3"
                    >
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--foreground-muted)' }}>
                            Team Members
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {regularMembers.map((dm) => (
                                <div
                                    key={dm.id}
                                    className="flex items-center gap-2 px-2 py-1 rounded-lg group/member"
                                    style={{ background: 'var(--background)' }}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${color.bg} flex items-center justify-center text-[10px] font-bold text-white`}>
                                        {dm.member.firstName[0]}
                                    </div>
                                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                        {dm.member.firstName} {dm.member.lastName[0]}.
                                    </span>
                                    <button
                                        onClick={() => onRemoveMember(dm.member.id)}
                                        className="opacity-0 group-hover/member:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                    >
                                        <X className="w-3 h-3 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Avatar stack for non-expanded */}
                {!isExpanded && department.members && department.members.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {department.members.slice(0, 5).map((dm, i) => (
                                <div
                                    key={dm.id}
                                    className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br ${getDeptColor(i).bg} flex items-center justify-center text-xs font-bold text-white`}
                                    style={{ zIndex: 5 - i }}
                                    title={`${dm.member.firstName} ${dm.member.lastName}`}
                                >
                                    {dm.member.firstName[0]}
                                </div>
                            ))}
                            {department.members.length > 5 && (
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-500 flex items-center justify-center text-xs font-bold text-white"
                                >
                                    +{department.members.length - 5}
                                </div>
                            )}
                        </div>
                        {department.members.length > 0 && (
                            <button
                                onClick={onToggleExpand}
                                className="text-xs text-indigo-500 hover:underline"
                            >
                                View all
                            </button>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onAddMember}
                        className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Member
                    </button>
                    {isExpanded && (
                        <button
                            onClick={onToggleExpand}
                            className="btn-secondary text-sm"
                        >
                            Collapse
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Department List Item Component
function DepartmentListItem({
    department,
    colorIndex,
    onEdit,
    onDelete,
    onAddMember,
    onRemoveMember,
}: {
    department: Department;
    colorIndex: number;
    onEdit: () => void;
    onDelete: () => void;
    onAddMember: () => void;
    onRemoveMember: (memberId: string) => void;
}) {
    const [showMembers, setShowMembers] = useState(false);
    const color = getDeptColor(colorIndex);
    const leaders = department.members?.filter(m => m.role === 'LEADER' || m.role === 'HEAD') || [];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card overflow-hidden"
        >
            <div className="flex items-center gap-4 p-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center`}>
                    <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                        {department.name}
                    </h3>
                    <p className="text-sm truncate" style={{ color: 'var(--foreground-muted)' }}>
                        {department.description || 'No description'}
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="font-bold" style={{ color: 'var(--foreground)' }}>
                            {department.members?.length || 0}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Members</p>
                    </div>
                    <div className="flex -space-x-2">
                        {leaders.slice(0, 3).map((dm, i) => (
                            <div
                                key={dm.id}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white"
                                title={`${dm.member.firstName} ${dm.member.lastName} (Leader)`}
                            >
                                {dm.member.firstName[0]}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMembers(!showMembers)}
                            className="btn-secondary text-sm"
                        >
                            {showMembers ? 'Hide' : 'Show'} Members
                        </button>
                        <button onClick={onAddMember} className="btn-secondary p-2">
                            <UserPlus className="w-4 h-4" />
                        </button>
                        <button onClick={onEdit} className="btn-secondary p-2">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={onDelete} className="btn-secondary p-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Members */}
            <AnimatePresence>
                {showMembers && department.members && department.members.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {department.members.map((dm) => (
                                    <div
                                        key={dm.id}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg group"
                                        style={{ background: 'var(--background)' }}
                                    >
                                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${dm.role === 'LEADER' || dm.role === 'HEAD' ? 'from-amber-500 to-orange-500' : color.bg} flex items-center justify-center text-[10px] font-bold text-white`}>
                                            {dm.member.firstName[0]}
                                        </div>
                                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                            {dm.member.firstName} {dm.member.lastName}
                                        </span>
                                        {(dm.role === 'LEADER' || dm.role === 'HEAD') && (
                                            <Crown className="w-3 h-3 text-amber-500" />
                                        )}
                                        <button
                                            onClick={() => onRemoveMember(dm.member.id)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                        >
                                            <X className="w-3 h-3 text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Department Modal
function DepartmentModal({
    department,
    onClose,
    onSave,
}: {
    department: Department | null;
    onClose: () => void;
    onSave: (data: { name: string; description: string }) => void;
}) {
    const [name, setName] = useState(department?.name || '');
    const [description, setDescription] = useState(department?.description || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave({ name, description });
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
                className="glass-card p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                        {department ? 'Edit Department' : 'New Department'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Department Name *
                        </label>
                        <input
                            type="text"
                            required
                            className="input-modern w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Worship Team, Ushers, Media"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Description
                        </label>
                        <textarea
                            rows={3}
                            className="input-modern w-full"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this department's responsibilities..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving || !name.trim()} className="btn-primary">
                            {saving ? 'Saving...' : department ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Add Member Modal
function AddMemberModal({
    department,
    availableMembers,
    onClose,
    onAdd,
}: {
    department: Department;
    availableMembers: Member[];
    onClose: () => void;
    onAdd: (memberId: string, role: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('MEMBER');

    const filtered = availableMembers.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

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
                className="glass-card p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                            Add Member to {department.name}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                            {availableMembers.length} members available to add
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Role selector */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                        Role in Department
                    </label>
                    <div className="flex gap-2">
                        {['MEMBER', 'LEADER', 'HEAD'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`flex-1 py-2 rounded-lg capitalize transition ${selectedRole === role
                                        ? role === 'LEADER' || role === 'HEAD'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-indigo-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {role.toLowerCase() === 'head' ? 'Head' : role.toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="input-modern w-full pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Member list */}
                <div className="flex-1 overflow-y-auto space-y-2">
                    {filtered.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p style={{ color: 'var(--foreground-muted)' }}>
                                {search ? 'No members found' : 'All members are already in this department'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => onAdd(member.id, selectedRole)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {member.firstName[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                        {member.firstName} {member.lastName}
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                        {member.email || member.phone || 'No contact info'}
                                    </p>
                                </div>
                                <UserPlus className="w-5 h-5 text-indigo-500" />
                            </button>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
