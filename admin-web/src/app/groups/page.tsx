'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    UserPlus,
    UserMinus,
    Calendar,
    MapPin,
    Clock,
    Filter,
    MoreVertical,
    ChevronDown,
    BarChart3,
    Send,
    Link,
    Copy,
    CheckCircle,
    Bell,
} from 'lucide-react';

interface GroupMember {
    id: string;
    memberId: string;
    role: string;
    joinedAt: string;
    member?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
    };
}

interface Group {
    id: string;
    name: string;
    description?: string;
    type: string;
    meetingDay?: string;
    meetingTime?: string;
    location?: string;
    leaderId?: string;
    isActive: boolean;
    memberCount: number;
    members: GroupMember[];
    createdAt: string;
}

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

const GROUP_TYPES = [
    { value: 'SMALL_GROUP', label: 'Small Group' },
    { value: 'BIBLE_STUDY', label: 'Bible Study' },
    { value: 'PRAYER_GROUP', label: 'Prayer Group' },
    { value: 'FELLOWSHIP', label: 'Fellowship' },
    { value: 'OUTREACH', label: 'Outreach' },
    { value: 'OTHER', label: 'Other' },
];

const MEETING_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function GroupsPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [inviteCode, setInviteCode] = useState('');
    const [announcement, setAnnouncement] = useState({ title: '', message: '' });
    const [copiedInvite, setCopiedInvite] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'SMALL_GROUP',
        meetingDay: '',
        meetingTime: '',
        location: '',
        leaderId: '',
    });

    useEffect(() => {
        fetchGroups();
        fetchMembers();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get('/members');
            setMembers(res.data);
        } catch (error) {
            console.error('Failed to fetch members', error);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/groups', formData);
            setShowCreateModal(false);
            resetForm();
            fetchGroups();
        } catch (error) {
            console.error('Failed to create group', error);
            alert('Failed to create group');
        }
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;
        try {
            await api.patch(`/groups/${selectedGroup.id}`, formData);
            setShowEditModal(false);
            resetForm();
            fetchGroups();
        } catch (error) {
            console.error('Failed to update group', error);
            alert('Failed to update group');
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Are you sure you want to delete this group?')) return;
        try {
            await api.delete(`/groups/${groupId}`);
            fetchGroups();
        } catch (error) {
            console.error('Failed to delete group', error);
            alert('Failed to delete group');
        }
    };

    const handleAddMember = async (memberId: string) => {
        if (!selectedGroup) return;
        try {
            await api.post(`/groups/${selectedGroup.id}/members`, { memberId });
            fetchGroups();
            setShowAddMemberModal(false);
            // Refresh selected group
            const updated = await api.get(`/groups/${selectedGroup.id}`);
            setSelectedGroup(updated.data);
        } catch (error: any) {
            console.error('Failed to add member', error);
            alert(error.response?.data?.message || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!selectedGroup) return;
        if (!confirm('Remove this member from the group?')) return;
        try {
            await api.delete(`/groups/${selectedGroup.id}/members/${memberId}`);
            fetchGroups();
            // Refresh selected group
            const updated = await api.get(`/groups/${selectedGroup.id}`);
            setSelectedGroup(updated.data);
        } catch (error) {
            console.error('Failed to remove member', error);
            alert('Failed to remove member');
        }
    };

    const openEditModal = (group: Group) => {
        setSelectedGroup(group);
        setFormData({
            name: group.name,
            description: group.description || '',
            type: group.type,
            meetingDay: group.meetingDay || '',
            meetingTime: group.meetingTime || '',
            location: group.location || '',
            leaderId: group.leaderId || '',
        });
        setShowEditModal(true);
    };

    const openMembersModal = async (group: Group) => {
        const res = await api.get(`/groups/${group.id}`);
        setSelectedGroup(res.data);
        setShowMembersModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'SMALL_GROUP',
            meetingDay: '',
            meetingTime: '',
            location: '',
            leaderId: '',
        });
        setSelectedGroup(null);
    };

    // ======== ENTERPRISE HANDLERS ========

    const openAnalyticsModal = async (group: Group) => {
        setSelectedGroup(group);
        try {
            const res = await api.get(`/groups/${group.id}/analytics`);
            setAnalytics(res.data);
            setShowAnalyticsModal(true);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
            alert('Failed to load analytics');
        }
    };

    const openAnnouncementModal = (group: Group) => {
        setSelectedGroup(group);
        setAnnouncement({ title: '', message: '' });
        setShowAnnouncementModal(true);
    };

    const handleSendAnnouncement = async () => {
        if (!selectedGroup || !announcement.title || !announcement.message) return;
        try {
            await api.post(`/groups/${selectedGroup.id}/announce`, announcement);
            alert('Announcement sent successfully!');
            setShowAnnouncementModal(false);
            setAnnouncement({ title: '', message: '' });
        } catch (error) {
            console.error('Failed to send announcement', error);
            alert('Failed to send announcement');
        }
    };

    const openInviteModal = async (group: Group) => {
        setSelectedGroup(group);
        setCopiedInvite(false);
        try {
            const res = await api.post(`/groups/${group.id}/invite`);
            setInviteCode(res.data.inviteCode);
            setShowInviteModal(true);
        } catch (error) {
            console.error('Failed to generate invite', error);
            alert('Failed to generate invite link');
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/join/${inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
    };

    const filteredGroups = groups.filter(group => {
        const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !typeFilter || group.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            SMALL_GROUP: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
            BIBLE_STUDY: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            PRAYER_GROUP: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
            FELLOWSHIP: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
            OUTREACH: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
            OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        };
        return colors[type] || colors.OTHER;
    };

    if (loading) {
        return (
            <div className="flex h-screen" style={{ background: 'var(--background)' }}>
                <Sidebar />
                <div className="flex flex-1 flex-col">
                    <Header />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                    <div className="space-y-6">
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <Users className="h-8 w-8 text-primary-600" />
                                    Connect Groups
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Manage small groups, bible studies, and fellowship groups
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg font-semibold"
                            >
                                <Plus className="h-5 w-5" />
                                + Create New Group
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search groups..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">All Types</option>
                                {GROUP_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{groups.length}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Total Groups</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {groups.reduce((sum, g) => sum + g.memberCount, 0)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Total Members</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {groups.filter(g => g.type === 'SMALL_GROUP').length}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Small Groups</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {groups.filter(g => g.type === 'BIBLE_STUDY').length}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Bible Studies</div>
                            </div>
                        </div>

                        {/* Groups Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredGroups.map((group) => (
                                <div
                                    key={group.id}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {group.name}
                                                </h3>
                                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadgeColor(group.type)}`}>
                                                    {GROUP_TYPES.find(t => t.value === group.type)?.label || group.type}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(group)}
                                                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGroup(group.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {group.description && (
                                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {group.description}
                                            </p>
                                        )}

                                        <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                            {group.meetingDay && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {group.meetingDay} {group.meetingTime && `at ${group.meetingTime}`}
                                                </div>
                                            )}
                                            {group.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    {group.location}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            {/* Enterprise Actions */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <button
                                                    onClick={() => openAnalyticsModal(group)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                    title="View Analytics"
                                                >
                                                    <BarChart3 className="h-3.5 w-3.5" />
                                                    Analytics
                                                </button>
                                                <button
                                                    onClick={() => openAnnouncementModal(group)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                    title="Send Announcement"
                                                >
                                                    <Bell className="h-3.5 w-3.5" />
                                                    Announce
                                                </button>
                                                <button
                                                    onClick={() => openInviteModal(group)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                    title="Generate Invite Link"
                                                >
                                                    <Link className="h-3.5 w-3.5" />
                                                    Invite
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => openMembersModal(group)}
                                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                                >
                                                    Manage Members
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredGroups.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No groups found</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {searchQuery || typeFilter ? 'Try adjusting your filters' : 'Create your first group to get started'}
                                </p>
                            </div>
                        )}

                        {/* Create/Edit Modal */}
                        {(showCreateModal || showEditModal) && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                            {showEditModal ? 'Edit Group' : 'Create New Group'}
                                        </h2>
                                        <form onSubmit={showEditModal ? handleUpdateGroup : handleCreateGroup} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Group Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Type
                                                    </label>
                                                    <select
                                                        value={formData.type}
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    >
                                                        {GROUP_TYPES.map(type => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Meeting Day
                                                    </label>
                                                    <select
                                                        value={formData.meetingDay}
                                                        onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="">Select day</option>
                                                        {MEETING_DAYS.map(day => (
                                                            <option key={day} value={day}>{day}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Meeting Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={formData.meetingTime}
                                                        onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Location
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCreateModal(false);
                                                        setShowEditModal(false);
                                                        resetForm();
                                                    }}
                                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                                >
                                                    {showEditModal ? 'Save Changes' : 'Create Group'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Members Modal */}
                        {showMembersModal && selectedGroup && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {selectedGroup.name} - Members
                                            </h2>
                                            <button
                                                onClick={() => setShowAddMemberModal(true)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                Add Member
                                            </button>
                                        </div>

                                        {selectedGroup.members.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedGroup.members.map((gm) => (
                                                    <div
                                                        key={gm.id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                                    >
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                {gm.member?.firstName} {gm.member?.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {gm.member?.email || 'No email'}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${gm.role === 'LEADER'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                                                }`}>
                                                                {gm.role}
                                                            </span>
                                                            <button
                                                                onClick={() => handleRemoveMember(gm.memberId)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                            >
                                                                <UserMinus className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                No members in this group yet
                                            </div>
                                        )}

                                        <div className="flex justify-end mt-6">
                                            <button
                                                onClick={() => {
                                                    setShowMembersModal(false);
                                                    setSelectedGroup(null);
                                                }}
                                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add Member Modal */}
                        {showAddMemberModal && selectedGroup && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                            Add Member to Group
                                        </h2>
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                            {members
                                                .filter(m => !selectedGroup.members.some(gm => gm.memberId === m.id))
                                                .map((member) => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                                                        onClick={() => handleAddMember(member.id)}
                                                    >
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                {member.firstName} {member.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {member.email || 'No email'}
                                                            </div>
                                                        </div>
                                                        <UserPlus className="h-5 w-5 text-primary-600" />
                                                    </div>
                                                ))}
                                            {members.filter(m => !selectedGroup.members.some(gm => gm.memberId === m.id)).length === 0 && (
                                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                    All members are already in this group
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-end mt-6">
                                            <button
                                                onClick={() => setShowAddMemberModal(false)}
                                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Analytics Modal */}
                        {showAnalyticsModal && selectedGroup && analytics && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg">
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <BarChart3 className="h-6 w-6 text-primary-600" />
                                            {selectedGroup.name} - Analytics
                                        </h2>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalMembers}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Members</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {analytics.lastActivity ? new Date(analytics.lastActivity).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Last Activity</div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Role Distribution</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(analytics.roleDistribution || {}).map(([role, count]) => (
                                                        <span key={role} className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded">
                                                            {role}: {count as number}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Monthly Growth (Last 6 Months)</h4>
                                                <div className="flex items-end gap-2 h-20">
                                                    {(analytics.monthlyGrowth || []).map((item: any, i: number) => (
                                                        <div key={i} className="flex-1 flex flex-col items-center">
                                                            <div
                                                                className="w-full bg-primary-600 rounded-t"
                                                                style={{ height: `${Math.max(item.count * 10, 4)}px` }}
                                                            ></div>
                                                            <span className="text-xs text-gray-500 mt-1">{item.month}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-6">
                                            <button
                                                onClick={() => setShowAnalyticsModal(false)}
                                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Announcement Modal */}
                        {showAnnouncementModal && selectedGroup && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg">
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Bell className="h-6 w-6 text-primary-600" />
                                            Send Announcement to {selectedGroup.name}
                                        </h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Title *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={announcement.title}
                                                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="Announcement title..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Message *
                                                </label>
                                                <textarea
                                                    value={announcement.message}
                                                    onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                                                    rows={4}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="Write your announcement..."
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                This will send a notification to all {selectedGroup.memberCount} members of this group.
                                            </p>
                                        </div>
                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                onClick={() => setShowAnnouncementModal(false)}
                                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSendAnnouncement}
                                                disabled={!announcement.title || !announcement.message}
                                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Send className="h-4 w-4" />
                                                Send Announcement
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Invite Modal */}
                        {showInviteModal && selectedGroup && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Link className="h-6 w-6 text-primary-600" />
                                            Invite to {selectedGroup.name}
                                        </h2>
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Invite Link
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`}
                                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                    />
                                                    <button
                                                        onClick={copyInviteLink}
                                                        className={`px-3 py-2 rounded-lg flex items-center gap-1 ${copiedInvite ? 'bg-green-600 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                                                    >
                                                        {copiedInvite ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                        {copiedInvite ? 'Copied!' : 'Copy'}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Share this link with people you want to invite to this group.
                                            </p>
                                        </div>
                                        <div className="flex justify-end mt-6">
                                            <button
                                                onClick={() => setShowInviteModal(false)}
                                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
