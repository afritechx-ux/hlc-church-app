'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Search, Plus, Filter, Download, Trash2,
    ChevronLeft, ChevronRight, Check, X,
    Users, UserPlus, UserCheck, AlertCircle,
    MoreHorizontal, Mail, Phone, Building,
    ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    address?: string;
    dateOfBirth?: string;
    createdAt: string;
    departments: { department: { id: string; name: string } }[];
}

interface Department {
    id: string;
    name: string;
}

type SortField = 'name' | 'email' | 'createdAt' | 'status';
type SortOrder = 'asc' | 'desc';

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [membersRes, deptRes] = await Promise.all([
                api.get('/members'),
                api.get('/departments')
            ]);
            setMembers(membersRes.data);
            setDepartments(deptRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    // Filter, sort, and paginate
    const processedMembers = useMemo(() => {
        let result = [...members];

        // Search filter
        if (searchTerm) {
            result = result.filter((m) =>
                `${m.firstName} ${m.lastName} ${m.email} ${m.phone}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter((m) => m.status === statusFilter);
        }

        // Department filter
        if (departmentFilter !== 'all') {
            result = result.filter((m) =>
                m.departments?.some((d) => d.department.id === departmentFilter)
            );
        }

        // Sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                    break;
                case 'email':
                    comparison = a.email.localeCompare(b.email);
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'status':
                    comparison = (a.status || '').localeCompare(b.status || '');
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [members, searchTerm, statusFilter, departmentFilter, sortField, sortOrder]);

    // Pagination
    const totalPages = Math.ceil(processedMembers.length / itemsPerPage);
    const paginatedMembers = processedMembers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Selection handlers
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        setShowBulkActions(newSelected.size > 0);
    };

    const selectAll = () => {
        if (selectedIds.size === paginatedMembers.length) {
            setSelectedIds(new Set());
            setShowBulkActions(false);
        } else {
            setSelectedIds(new Set(paginatedMembers.map((m) => m.id)));
            setShowBulkActions(true);
        }
    };

    // Sort handler
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
        return sortOrder === 'asc'
            ? <ArrowUp className="w-4 h-4" />
            : <ArrowDown className="w-4 h-4" />;
    };

    // Export handler
    const handleExport = async () => {
        try {
            const response = await api.get('/reports/members/csv', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Members exported successfully');
        } catch (error) {
            toast.error('Failed to export members');
        }
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        try {
            await Promise.all(
                Array.from(selectedIds).map((id) => api.delete(`/members/${id}`))
            );
            toast.success(`Deleted ${selectedIds.size} members`);
            setSelectedIds(new Set());
            setShowBulkActions(false);
            setShowDeleteConfirm(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete members');
        }
    };

    // Stats
    const stats = useMemo(() => ({
        total: members.length,
        active: members.filter(m => m.status === 'ACTIVE').length,
        newThisMonth: members.filter(m => {
            const created = new Date(m.createdAt);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length,
        inactive: members.filter(m => m.status === 'INACTIVE').length,
    }), [members]);

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Page Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                                    Members
                                </h1>
                                <p style={{ color: 'var(--foreground-muted)' }}>
                                    Manage your church members
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExport}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Member
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Members', value: stats.total, icon: Users, color: 'var(--primary)' },
                            { label: 'Active', value: stats.active, icon: UserCheck, color: '#10b981' },
                            { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, color: '#0ea5e9' },
                            { label: 'Inactive', value: stats.inactive, icon: AlertCircle, color: '#f59e0b' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ backgroundColor: stat.color + '20' }}
                                    >
                                        <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                                            {stat.value}
                                        </p>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-4 mb-6"
                    >
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, phone..."
                                    className="input-modern w-full pl-10"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-indigo-500' : ''}`}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                {(statusFilter !== 'all' || departmentFilter !== 'all') && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                )}
                            </button>

                            {/* Items per page */}
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="input-modern"
                            >
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                            </select>
                        </div>

                        {/* Filter Options */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                        <div>
                                            <label className="block text-sm mb-1" style={{ color: 'var(--foreground-muted)' }}>
                                                Status
                                            </label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => {
                                                    setStatusFilter(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="input-modern"
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="VISITOR">Visitor</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1" style={{ color: 'var(--foreground-muted)' }}>
                                                Department
                                            </label>
                                            <select
                                                value={departmentFilter}
                                                onChange={(e) => {
                                                    setDepartmentFilter(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="input-modern"
                                            >
                                                <option value="all">All Departments</option>
                                                {departments.map((d) => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setStatusFilter('all');
                                                setDepartmentFilter('all');
                                                setSearchTerm('');
                                            }}
                                            className="self-end btn-secondary"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Bulk Actions Bar */}
                    <AnimatePresence>
                        {showBulkActions && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="glass-card p-4 mb-4 flex items-center justify-between"
                                style={{ background: 'var(--primary)', color: 'white' }}
                            >
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">{selectedIds.size} selected</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedIds(new Set());
                                            setShowBulkActions(false);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-white/20 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Members Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card overflow-hidden"
                    >
                        <table className="modern-table w-full">
                            <thead>
                                <tr>
                                    <th className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === paginatedMembers.length && paginatedMembers.length > 0}
                                            onChange={selectAll}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th>
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center gap-1 hover:text-indigo-600"
                                        >
                                            Name {getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th>Contact</th>
                                    <th>Departments</th>
                                    <th>
                                        <button
                                            onClick={() => handleSort('status')}
                                            className="flex items-center gap-1 hover:text-indigo-600"
                                        >
                                            Status {getSortIcon('status')}
                                        </button>
                                    </th>
                                    <th>
                                        <button
                                            onClick={() => handleSort('createdAt')}
                                            className="flex items-center gap-1 hover:text-indigo-600"
                                        >
                                            Joined {getSortIcon('createdAt')}
                                        </button>
                                    </th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={7}>
                                                <div className="skeleton h-12 w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : paginatedMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12">
                                            <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                                            <p style={{ color: 'var(--foreground-muted)' }}>No members found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedMembers.map((member, index) => (
                                        <motion.tr
                                            key={member.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={selectedIds.has(member.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(member.id)}
                                                    onChange={() => toggleSelect(member.id)}
                                                    className="rounded border-gray-300"
                                                />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                                                        style={{ background: `linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)` }}
                                                    >
                                                        {member.firstName[0]}{member.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                                    <span style={{ color: 'var(--foreground)' }}>{member.phone || '-'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {member.departments?.slice(0, 2).map((d, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                            style={{
                                                                background: 'var(--primary)',
                                                                color: 'white',
                                                                opacity: 0.9
                                                            }}
                                                        >
                                                            {d.department.name}
                                                        </span>
                                                    ))}
                                                    {member.departments?.length > 2 && (
                                                        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                                            +{member.departments.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : member.status === 'INACTIVE'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}
                                                >
                                                    {member.status || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--foreground-muted)' }}>
                                                    {new Date(member.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/members/${member.id}`}
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition inline-block"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedMembers.length)} of {processedMembers.length} members
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="btn-secondary p-2 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        const page = i + 1;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-lg font-medium transition ${currentPage === page
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }`}
                                                style={currentPage !== page ? { color: 'var(--foreground)' } : {}}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="btn-secondary p-2 disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card p-6 max-w-md mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                                    Delete Members?
                                </h3>
                            </div>
                            <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>
                                Are you sure you want to delete {selectedIds.size} member(s)? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Member Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddMemberModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchData();
                        }}
                        departments={departments}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Add Member Modal Component
function AddMemberModal({
    onClose,
    onSuccess,
    departments
}: {
    onClose: () => void;
    onSuccess: () => void;
    departments: Department[];
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        gender: '',
        dateOfBirth: '',
        createUserAccount: false,
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Only send fields the backend accepts
            const payload: any = {
                firstName: form.firstName,
                lastName: form.lastName,
            };
            if (form.email) payload.email = form.email;
            if (form.phone) payload.phone = form.phone;
            if (form.address) payload.address = form.address;
            if (form.gender) payload.gender = form.gender;
            if (form.dateOfBirth) payload.dateOfBirth = new Date(form.dateOfBirth).toISOString();

            // User account creation
            if (form.createUserAccount) {
                payload.createUserAccount = true;
                if (form.password) payload.password = form.password;
            }

            await api.post('/members', payload);
            toast.success(form.createUserAccount
                ? 'Member added with login account created!'
                : 'Member added successfully');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add member');
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
                className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                        Add New Member
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                First Name *
                            </label>
                            <input
                                type="text"
                                required
                                className="input-modern w-full"
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Last Name *
                            </label>
                            <input
                                type="text"
                                required
                                className="input-modern w-full"
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Email {form.createUserAccount && '*'}
                        </label>
                        <input
                            type="email"
                            className="input-modern w-full"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder={form.createUserAccount ? "Required for login" : "optional"}
                            required={form.createUserAccount}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Phone
                        </label>
                        <input
                            type="tel"
                            className="input-modern w-full"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            className="input-modern w-full"
                            value={form.dateOfBirth}
                            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Address
                        </label>
                        <input
                            type="text"
                            className="input-modern w-full"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Gender
                        </label>
                        <select
                            className="input-modern w-full"
                            value={form.gender}
                            onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        >
                            <option value="">Select gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>

                    {/* Create User Account Section */}
                    <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.createUserAccount}
                                onChange={(e) => setForm({ ...form, createUserAccount: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                                    Create login account
                                </span>
                                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                    Allow this member to log in to the mobile app
                                </p>
                            </div>
                        </label>

                        {form.createUserAccount && (
                            <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--background)' }}>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                    Password (optional)
                                </label>
                                <input
                                    type="password"
                                    className="input-modern w-full"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Default: password123"
                                />
                                <p className="text-xs mt-2" style={{ color: 'var(--foreground-muted)' }}>
                                    If left blank, default password is: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">password123</code>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
