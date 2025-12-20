'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Home, Plus, Edit2, Trash2, X, Search, Users,
    UserPlus, MapPin, ChevronRight, Crown, Heart,
    Grid, List
} from 'lucide-react';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
}

interface Household {
    id: string;
    name: string;
    address: string | null;
    members: Member[];
    createdAt: string;
}

const HOUSEHOLD_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
];

export default function HouseholdsPage() {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
    const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [householdsRes, membersRes] = await Promise.all([
                api.get('/households'),
                api.get('/members'),
            ]);
            setHouseholds(householdsRes.data);
            setAllMembers(membersRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load households');
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const stats = useMemo(() => ({
        total: households.length,
        totalMembers: households.reduce((sum, h) => sum + (h.members?.length || 0), 0),
        avgSize: households.length ? Math.round(households.reduce((sum, h) => sum + (h.members?.length || 0), 0) / households.length * 10) / 10 : 0,
        withAddress: households.filter(h => h.address).length,
    }), [households]);

    const filteredHouseholds = useMemo(() => {
        if (!searchTerm) return households;
        return households.filter(h =>
            h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.members?.some(m =>
                `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [households, searchTerm]);

    // CRUD Handlers
    const handleSaveHousehold = async (data: { name: string; address: string }) => {
        try {
            if (editingHousehold) {
                await api.patch(`/households/${editingHousehold.id}`, data);
                toast.success('Household updated');
            } else {
                await api.post('/households', data);
                toast.success('Household created');
            }
            fetchData();
            setShowModal(false);
            setEditingHousehold(null);
        } catch (error) {
            toast.error('Failed to save household');
        }
    };

    const handleDeleteHousehold = async (id: string) => {
        if (!confirm('Delete this household? Members will be unassigned.')) return;
        try {
            await api.delete(`/households/${id}`);
            toast.success('Household deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete household');
        }
    };

    const handleAddMember = async (memberId: string) => {
        if (!selectedHousehold) return;
        try {
            // Update member's householdId
            await api.patch(`/members/${memberId}`, { householdId: selectedHousehold.id });
            toast.success('Member added to household');
            fetchData();
            setShowMemberModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Remove this member from the household?')) return;
        try {
            await api.patch(`/members/${memberId}`, { householdId: null });
            toast.success('Member removed');
            fetchData();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    const getAvailableMembers = () => {
        const assignedIds = new Set(households.flatMap(h => h.members?.map(m => m.id) || []));
        return allMembers.filter(m => !assignedIds.has(m.id));
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
                                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
                                    <Home className="w-7 h-7 text-white" />
                                </div>
                                Households
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                Manage family units and household groupings
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingHousehold(null);
                                setShowModal(true);
                            }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            New Household
                        </button>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Households', value: stats.total, icon: Home, color: 'from-rose-500 to-pink-500' },
                            { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'from-blue-500 to-cyan-500' },
                            { label: 'Avg Family Size', value: stats.avgSize, icon: Heart, color: 'from-amber-500 to-orange-500' },
                            { label: 'With Address', value: stats.withAddress, icon: MapPin, color: 'from-emerald-500 to-teal-500' },
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
                                    placeholder="Search households or members..."
                                    className="input-modern w-full pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-rose-500 text-white' : ''}`}
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-rose-500 text-white' : ''}`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Households */}
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
                    ) : filteredHouseholds.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card p-12 text-center"
                        >
                            <Home className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                                {searchTerm ? 'No households found' : 'No households yet'}
                            </h3>
                            <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>
                                {searchTerm ? 'Try adjusting your search' : 'Create your first household to group family members'}
                            </p>
                            {!searchTerm && (
                                <button onClick={() => setShowModal(true)} className="btn-primary">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Household
                                </button>
                            )}
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredHouseholds.map((household, index) => (
                                <HouseholdCard
                                    key={household.id}
                                    household={household}
                                    colorIndex={index}
                                    onEdit={() => {
                                        setEditingHousehold(household);
                                        setShowModal(true);
                                    }}
                                    onDelete={() => handleDeleteHousehold(household.id)}
                                    onAddMember={() => {
                                        setSelectedHousehold(household);
                                        setShowMemberModal(true);
                                    }}
                                    onRemoveMember={handleRemoveMember}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredHouseholds.map((household, index) => (
                                <HouseholdListItem
                                    key={household.id}
                                    household={household}
                                    colorIndex={index}
                                    onEdit={() => {
                                        setEditingHousehold(household);
                                        setShowModal(true);
                                    }}
                                    onDelete={() => handleDeleteHousehold(household.id)}
                                    onAddMember={() => {
                                        setSelectedHousehold(household);
                                        setShowMemberModal(true);
                                    }}
                                    onRemoveMember={handleRemoveMember}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Household Modal */}
            <AnimatePresence>
                {showModal && (
                    <HouseholdModal
                        household={editingHousehold}
                        onClose={() => {
                            setShowModal(false);
                            setEditingHousehold(null);
                        }}
                        onSave={handleSaveHousehold}
                    />
                )}
            </AnimatePresence>

            {/* Add Member Modal */}
            <AnimatePresence>
                {showMemberModal && selectedHousehold && (
                    <AddMemberModal
                        household={selectedHousehold}
                        availableMembers={getAvailableMembers()}
                        onClose={() => {
                            setShowMemberModal(false);
                            setSelectedHousehold(null);
                        }}
                        onAdd={handleAddMember}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Household Card Component
function HouseholdCard({
    household,
    colorIndex,
    onEdit,
    onDelete,
    onAddMember,
    onRemoveMember,
}: {
    household: Household;
    colorIndex: number;
    onEdit: () => void;
    onDelete: () => void;
    onAddMember: () => void;
    onRemoveMember: (memberId: string) => void;
}) {
    const color = HOUSEHOLD_COLORS[colorIndex % HOUSEHOLD_COLORS.length];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card overflow-hidden group"
        >
            {/* Header */}
            <div className={`p-4 bg-gradient-to-r ${color}`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            {household.name}
                        </h3>
                        {household.address && (
                            <p className="text-sm text-white/80 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {household.address}
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

            {/* Members */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                        <Users className="w-4 h-4" />
                        Family Members ({household.members?.length || 0})
                    </p>
                </div>

                {household.members && household.members.length > 0 ? (
                    <div className="space-y-2 mb-4">
                        {household.members.map((member, i) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-2 rounded-lg group/member"
                                style={{ background: 'var(--background)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-xs font-bold text-white`}>
                                        {member.firstName[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                            {member.firstName} {member.lastName}
                                        </p>
                                        {i === 0 && (
                                            <span className="text-xs text-amber-500 flex items-center gap-1">
                                                <Crown className="w-3 h-3" /> Head
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemoveMember(member.id)}
                                    className="opacity-0 group-hover/member:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                >
                                    <X className="w-3 h-3 text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--foreground-muted)' }}>
                        No members assigned
                    </p>
                )}

                <button
                    onClick={onAddMember}
                    className="w-full btn-secondary text-sm flex items-center justify-center gap-1"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                </button>
            </div>
        </motion.div>
    );
}

// Household List Item Component
function HouseholdListItem({
    household,
    colorIndex,
    onEdit,
    onDelete,
    onAddMember,
    onRemoveMember,
}: {
    household: Household;
    colorIndex: number;
    onEdit: () => void;
    onDelete: () => void;
    onAddMember: () => void;
    onRemoveMember: (memberId: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const color = HOUSEHOLD_COLORS[colorIndex % HOUSEHOLD_COLORS.length];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card overflow-hidden"
        >
            <div className="flex items-center gap-4 p-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Home className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                        {household.name}
                    </h3>
                    <p className="text-sm flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                        <MapPin className="w-3 h-3" />
                        {household.address || 'No address'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="font-bold" style={{ color: 'var(--foreground)' }}>
                            {household.members?.length || 0}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Members</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setExpanded(!expanded)} className="btn-secondary text-sm">
                            {expanded ? 'Hide' : 'Show'} Members
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

            <AnimatePresence>
                {expanded && household.members && household.members.length > 0 && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 flex flex-wrap gap-2">
                            {household.members.map((member, i) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg group"
                                    style={{ background: 'var(--background)' }}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-[10px] font-bold text-white`}>
                                        {member.firstName[0]}
                                    </div>
                                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                        {member.firstName} {member.lastName}
                                    </span>
                                    {i === 0 && <Crown className="w-3 h-3 text-amber-500" />}
                                    <button
                                        onClick={() => onRemoveMember(member.id)}
                                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                    >
                                        <X className="w-3 h-3 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Household Modal
function HouseholdModal({
    household,
    onClose,
    onSave,
}: {
    household: Household | null;
    onClose: () => void;
    onSave: (data: { name: string; address: string }) => void;
}) {
    const [name, setName] = useState(household?.name || '');
    const [address, setAddress] = useState(household?.address || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await onSave({ name, address });
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
                    <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                        <Home className="w-5 h-5" />
                        {household ? 'Edit Household' : 'New Household'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Household Name *
                        </label>
                        <input
                            type="text"
                            required
                            className="input-modern w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., The Smith Family"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Address
                        </label>
                        <input
                            type="text"
                            className="input-modern w-full"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g., 123 Main St, Accra"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving || !name.trim()} className="btn-primary">
                            {saving ? 'Saving...' : household ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Add Member Modal
function AddMemberModal({
    household,
    availableMembers,
    onClose,
    onAdd,
}: {
    household: Household;
    availableMembers: Member[];
    onClose: () => void;
    onAdd: (memberId: string) => void;
}) {
    const [search, setSearch] = useState('');

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
                            Add to {household.name}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                            {availableMembers.length} unassigned members
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

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

                <div className="flex-1 overflow-y-auto space-y-2">
                    {filtered.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p style={{ color: 'var(--foreground-muted)' }}>
                                {search ? 'No members found' : 'All members are assigned to households'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => onAdd(member.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {member.firstName[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                        {member.firstName} {member.lastName}
                                    </p>
                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                        {member.email || member.phone || 'No contact'}
                                    </p>
                                </div>
                                <UserPlus className="w-5 h-5 text-rose-500" />
                            </button>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
