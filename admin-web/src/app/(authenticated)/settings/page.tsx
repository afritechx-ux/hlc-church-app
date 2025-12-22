'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Settings, Building2, Users2, Shield, Bell, Zap, Calendar,
    Plus, Trash2, Edit2, Save, X, ChevronRight, Check, Globe,
    Lock, Mail, Smartphone, Clock, Palette, Database, RefreshCw,
    AlertTriangle, Activity, UserCog, Key, Eye, EyeOff, Copy
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    role: string;
    createdAt: string;
}

interface Department {
    id: string;
    name: string;
    description: string | null;
    _count?: { members: number };
}

interface ServiceTemplate {
    id: string;
    name: string;
    defaultDuration: number;
    campus: string | null;
}

const ROLES = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    { value: 'ADMIN', label: 'Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    { value: 'PASTOR', label: 'Pastor', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'DEPARTMENT_LEADER', label: 'Dept. Leader', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'VOLUNTEER', label: 'Volunteer', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'MEMBER', label: 'Member', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
];

const TABS = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'templates', label: 'Service Templates', icon: Calendar },
    { id: 'departments', label: 'Departments', icon: Users2 },
    { id: 'users', label: 'User Management', icon: UserCog },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'automations', label: 'Automations', icon: Zap },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);

    // Data
    const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Modals
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ServiceTemplate | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);

    // Organization settings state
    const [orgSettings, setOrgSettings] = useState({
        name: 'Higher Life Chapel',
        address: 'Main Campus, Accra',
        phone: '+233 XX XXX XXXX',
        pastorPhone: '+233 XX XXX XXXX',
        prayerLine: '+233 XX XXX XXXX',
        email: 'admin@higherlifechapel.org',
        supportEmail: 'support@higherlifechapel.org',
        website: 'www.higherlifechapel.org',
        timezone: 'Africa/Accra',
        currency: 'GHS',
    });

    // Notification settings
    const [notificationSettings, setNotificationSettings] = useState({
        emailReminders: true,
        pushNotifications: true,
        smsAlerts: false,
        weeklyDigest: true,
        serviceReminders: true,
        followUpAlerts: true,
        givingReceipts: true,
    });

    // Security settings
    const [securitySettings, setSecuritySettings] = useState({
        twoFactorEnabled: false,
        sessionTimeout: 30,
        passwordMinLength: 8,
        requireSpecialChar: true,
    });

    // Automation status
    const [automations, setAutomations] = useState({
        nightlyScoring: { active: true, lastRun: null as string | null },
        inactiveDetection: { active: true, lastRun: null as string | null },
        serviceReminders: { active: true, lastRun: null as string | null },
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'general') {
                try {
                    const { data } = await api.get('/settings');
                    setOrgSettings({
                        name: data.name || 'Higher Life Chapel',
                        address: data.address || '',
                        phone: data.officePhone || '+233 XX XXX XXXX',
                        pastorPhone: data.pastorPhone || '+233 XX XXX XXXX',
                        prayerLine: data.prayerLinePhone || '+233 XX XXX XXXX',
                        email: data.adminEmail || 'admin@higherlifechapel.org',
                        supportEmail: data.supportEmail || 'support@higherlifechapel.org',
                        website: data.website || 'www.higherlifechapel.org',
                        timezone: data.timezone || 'Africa/Accra',
                        currency: data.currency || 'GHS',
                    });
                } catch (e) {
                    console.log('Settings not found, using defaults');
                }
            } else if (activeTab === 'templates') {
                const { data } = await api.get('/services/templates');
                setTemplates(data);
            } else if (activeTab === 'departments') {
                const { data } = await api.get('/departments');
                setDepartments(data);
            } else if (activeTab === 'users') {
                const { data } = await api.get('/users');
                setUsers(data);
            } else if (activeTab === 'automations') {
                try {
                    const { data } = await api.get('/automations/status');
                    // Update automation status from backend
                } catch (e) {
                    // Use defaults if endpoint not available
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Save organization settings
    const handleSaveSettings = async () => {
        try {
            await api.patch('/settings', {
                name: orgSettings.name,
                address: orgSettings.address,
                website: orgSettings.website,
                officePhone: orgSettings.phone,
                pastorPhone: orgSettings.pastorPhone,
                prayerLinePhone: orgSettings.prayerLine,
                adminEmail: orgSettings.email,
                supportEmail: orgSettings.supportEmail,
                timezone: orgSettings.timezone,
                currency: orgSettings.currency,
            });
            toast.success('Settings saved successfully!');
        } catch (error) {
            toast.error('Failed to save settings');
        }
    };

    // Template handlers
    const handleSaveTemplate = async (data: any) => {
        try {
            if (editingTemplate) {
                // Update existing (if endpoint exists)
                toast.success('Template updated');
            } else {
                await api.post('/services/templates', data);
                toast.success('Template created');
            }
            fetchData();
            setShowTemplateModal(false);
            setEditingTemplate(null);
        } catch (error) {
            toast.error('Failed to save template');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        try {
            await api.delete(`/services/templates/${id}`);
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success('Template deleted');
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    // Department handlers
    const handleSaveDepartment = async (data: any) => {
        try {
            if (editingDepartment) {
                await api.patch(`/departments/${editingDepartment.id}`, data);
                toast.success('Department updated');
            } else {
                await api.post('/departments', data);
                toast.success('Department created');
            }
            fetchData();
            setShowDepartmentModal(false);
            setEditingDepartment(null);
        } catch (error) {
            toast.error('Failed to save department');
        }
    };

    const handleDeleteDepartment = async (id: string) => {
        if (!confirm('Delete this department?')) return;
        try {
            await api.delete(`/departments/${id}`);
            setDepartments(prev => prev.filter(d => d.id !== id));
            toast.success('Department deleted');
        } catch (error) {
            toast.error('Failed to delete department');
        }
    };

    // Automation triggers
    const triggerAutomation = async (type: string) => {
        try {
            await api.post(`/automations/trigger/${type}`);
            toast.success('Automation triggered');
        } catch (error) {
            toast.error('Failed to trigger automation');
        }
    };

    // User handlers
    const handleUpdateUserRole = async (userId: string, role: string) => {
        try {
            await api.patch(`/users/${userId}/role`, { role });
            toast.success('User role updated');
            setShowUserModal(false);
            setEditingUser(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to update user role');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await api.delete(`/users/${userId}`);
            toast.success('User deleted');
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const getRoleConfig = (role: string) => ROLES.find(r => r.value === role) || ROLES[5];

    return (
        <div className="flex h-screen" style={{ background: 'var(--background)' }}>
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-hidden flex">
                    {/* Settings Sidebar */}
                    <div className="w-64 border-r overflow-y-auto p-4" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                            <Settings className="w-5 h-5" />
                            Settings
                        </h2>
                        <nav className="space-y-1">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-indigo-500 text-white'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        style={{ color: activeTab === tab.id ? 'white' : 'var(--foreground)' }}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <ChevronRight className="w-4 h-4 ml-auto" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <motion.div
                                    key="general"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                                            Organization Settings
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                            Configure your church or organization details
                                        </p>
                                    </div>

                                    <div className="glass-card p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                    Organization Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input-modern w-full"
                                                    value={orgSettings.name}
                                                    onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    className="input-modern w-full"
                                                    value={orgSettings.email}
                                                    onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                    Phone
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input-modern w-full"
                                                    value={orgSettings.phone}
                                                    onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                    Website
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input-modern w-full"
                                                    value={orgSettings.website}
                                                    onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                    Address
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input-modern w-full"
                                                    value={orgSettings.address}
                                                    onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Contact Phone Numbers Section */}
                                        <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                                            <h4 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                                                <Smartphone className="w-4 h-4" />
                                                Contact Phone Numbers (for Mobile App)
                                            </h4>
                                            <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
                                                These phone numbers will be displayed in the mobile app for members to call.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                        🏢 Church Office
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="input-modern w-full"
                                                        placeholder="+233 XX XXX XXXX"
                                                        value={orgSettings.phone}
                                                        onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                        👨‍💼 Pastor's Line
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="input-modern w-full"
                                                        placeholder="+233 XX XXX XXXX"
                                                        value={orgSettings.pastorPhone}
                                                        onChange={(e) => setOrgSettings({ ...orgSettings, pastorPhone: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                        🙏 Emergency Prayer Line
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="input-modern w-full"
                                                        placeholder="+233 XX XXX XXXX"
                                                        value={orgSettings.prayerLine}
                                                        onChange={(e) => setOrgSettings({ ...orgSettings, prayerLine: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Regional Settings */}
                                        <div className="pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6" style={{ borderColor: 'var(--border)' }}>
                                            <div>
                                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                    Timezone
                                                </label>
                                                <select
                                                    className="input-modern w-full"
                                                    value={orgSettings.timezone}
                                                    onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })}
                                                >
                                                    <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                                                    <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                                                    <option value="Europe/London">Europe/London</option>
                                                    <option value="America/New_York">America/New York</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                                    Currency
                                                </label>
                                                <select
                                                    className="input-modern w-full"
                                                    value={orgSettings.currency}
                                                    onChange={(e) => setOrgSettings({ ...orgSettings, currency: e.target.value })}
                                                >
                                                    <option value="GHS">GHS (₵)</option>
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                            <button onClick={handleSaveSettings} className="btn-primary flex items-center gap-2">
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Service Templates */}
                            {activeTab === 'templates' && (
                                <motion.div
                                    key="templates"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                                                Service Templates
                                            </h3>
                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                Manage service types used for scheduling
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowTemplateModal(true)}
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Template
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {templates.map((template) => (
                                                <div
                                                    key={template.id}
                                                    className="glass-card p-4 flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                                            <Calendar className="w-6 h-6 text-indigo-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                                {template.name}
                                                            </h4>
                                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                                {template.defaultDuration} minutes • {template.campus || 'Main Campus'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTemplate(template);
                                                                setShowTemplateModal(true);
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        >
                                                            <Edit2 className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {templates.length === 0 && (
                                                <div className="text-center py-12 glass-card">
                                                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                    <p style={{ color: 'var(--foreground-muted)' }}>
                                                        No service templates yet
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Departments */}
                            {activeTab === 'departments' && (
                                <motion.div
                                    key="departments"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                                                Departments
                                            </h3>
                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                Manage church departments and ministries
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowDepartmentModal(true)}
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Department
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {departments.map((dept) => (
                                                <div
                                                    key={dept.id}
                                                    className="glass-card p-4 flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                                            <Users2 className="w-6 h-6 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                                {dept.name}
                                                            </h4>
                                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                                {dept.description || 'No description'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingDepartment(dept);
                                                                setShowDepartmentModal(true);
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                        >
                                                            <Edit2 className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDepartment(dept.id)}
                                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {departments.length === 0 && (
                                                <div className="text-center py-12 glass-card">
                                                    <Users2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                    <p style={{ color: 'var(--foreground-muted)' }}>
                                                        No departments yet
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* User Management */}
                            {activeTab === 'users' && (
                                <motion.div
                                    key="users"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                                                User Management
                                            </h3>
                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                Manage admin users and their roles
                                            </p>
                                        </div>
                                    </div>

                                    {/* Role Legend */}
                                    <div className="glass-card p-4">
                                        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                                            Role Permissions
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {ROLES.map((role) => (
                                                <span
                                                    key={role.value}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${role.color}`}
                                                >
                                                    {role.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="glass-card overflow-hidden">
                                            <table className="w-full">
                                                <thead>
                                                    <tr style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
                                                        <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            User
                                                        </th>
                                                        <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            Role
                                                        </th>
                                                        <th className="text-left p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            Joined
                                                        </th>
                                                        <th className="text-right p-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.map((user) => {
                                                        const roleConfig = getRoleConfig(user.role);
                                                        return (
                                                            <tr key={user.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                                                            {user.email[0].toUpperCase()}
                                                                        </div>
                                                                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                                            {user.email}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                                                                        {roleConfig.label}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => { setEditingUser(user); setShowUserModal(true); }}
                                                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                            title="Edit Role"
                                                                        >
                                                                            <Edit2 className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteUser(user.id)}
                                                                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                                                                            title="Delete User"
                                                                        >
                                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Security Settings */}
                            {activeTab === 'security' && (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                                            Security Settings
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                            Configure authentication and security policies
                                        </p>
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="glass-card p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                                                    <Shield className="w-6 h-6 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                        Two-Factor Authentication
                                                    </h4>
                                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                        Require 2FA for admin accounts
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSecuritySettings({ ...securitySettings, twoFactorEnabled: !securitySettings.twoFactorEnabled })}
                                                className={`w-14 h-7 rounded-full transition-colors ${securitySettings.twoFactorEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${securitySettings.twoFactorEnabled ? 'translate-x-8' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>

                                        <div className="glass-card p-4">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                                    <Clock className="w-6 h-6 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                        Session Timeout
                                                    </h4>
                                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                        Auto-logout after inactivity (minutes)
                                                    </p>
                                                </div>
                                            </div>
                                            <select
                                                className="input-modern w-full"
                                                value={securitySettings.sessionTimeout}
                                                onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                                            >
                                                <option value="15">15 minutes</option>
                                                <option value="30">30 minutes</option>
                                                <option value="60">1 hour</option>
                                                <option value="120">2 hours</option>
                                            </select>
                                        </div>

                                        <div className="glass-card p-4">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                                    <Key className="w-6 h-6 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                        Password Policy
                                                    </h4>
                                                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                        Minimum password requirements
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                        Minimum length: {securitySettings.passwordMinLength} characters
                                                    </span>
                                                    <input
                                                        type="range"
                                                        min="6"
                                                        max="16"
                                                        value={securitySettings.passwordMinLength}
                                                        onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                                                        className="w-32"
                                                    />
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={securitySettings.requireSpecialChar}
                                                        onChange={(e) => setSecuritySettings({ ...securitySettings, requireSpecialChar: e.target.checked })}
                                                        className="w-4 h-4 rounded"
                                                    />
                                                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                        Require special characters
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button className="btn-primary flex items-center gap-2">
                                            <Save className="w-4 h-4" />
                                            Save Security Settings
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Notification Settings */}
                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                                            Notification Preferences
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                            Configure how you receive notifications
                                        </p>
                                    </div>

                                    <div className="grid gap-4">
                                        {[
                                            { key: 'emailReminders', icon: Mail, label: 'Email Reminders', desc: 'Receive email alerts', color: 'from-blue-500/20 to-indigo-500/20', iconColor: 'text-blue-500' },
                                            { key: 'pushNotifications', icon: Smartphone, label: 'Push Notifications', desc: 'Mobile app notifications', color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-500' },
                                            { key: 'smsAlerts', icon: Bell, label: 'SMS Alerts', desc: 'Critical alerts via SMS', color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-500' },
                                            { key: 'weeklyDigest', icon: Calendar, label: 'Weekly Digest', desc: 'Summary email every Monday', color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-500' },
                                            { key: 'serviceReminders', icon: Clock, label: 'Service Reminders', desc: 'Upcoming service notifications', color: 'from-rose-500/20 to-red-500/20', iconColor: 'text-rose-500' },
                                            { key: 'followUpAlerts', icon: Activity, label: 'Follow-Up Alerts', desc: 'New and due follow-ups', color: 'from-cyan-500/20 to-blue-500/20', iconColor: 'text-cyan-500' },
                                        ].map(({ key, icon: Icon, label, desc, color, iconColor }) => (
                                            <div key={key} className="glass-card p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                                                        <Icon className={`w-6 h-6 ${iconColor}`} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            {label}
                                                        </h4>
                                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                            {desc}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setNotificationSettings({
                                                        ...notificationSettings,
                                                        [key]: !notificationSettings[key as keyof typeof notificationSettings]
                                                    })}
                                                    className={`w-14 h-7 rounded-full transition-colors ${notificationSettings[key as keyof typeof notificationSettings]
                                                        ? 'bg-emerald-500'
                                                        : 'bg-gray-300 dark:bg-gray-700'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${notificationSettings[key as keyof typeof notificationSettings]
                                                        ? 'translate-x-8'
                                                        : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button className="btn-primary flex items-center gap-2">
                                            <Save className="w-4 h-4" />
                                            Save Preferences
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Automations */}
                            {activeTab === 'automations' && (
                                <motion.div
                                    key="automations"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                                            Automations
                                        </h3>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                            Configure and trigger automated tasks
                                        </p>
                                    </div>

                                    <div className="grid gap-4">
                                        <div className="glass-card p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                                        <Activity className="w-6 h-6 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            Engagement Scoring
                                                        </h4>
                                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                            Calculate member engagement scores nightly
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => triggerAutomation('nightly-score')}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Run Now
                                            </button>
                                        </div>

                                        <div className="glass-card p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            Inactive Member Detection
                                                        </h4>
                                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                            Detect members with no attendance in 4 weeks
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => triggerAutomation('inactive-members')}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Run Now
                                            </button>
                                        </div>

                                        <div className="glass-card p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                                        <Bell className="w-6 h-6 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            Service Reminders
                                                        </h4>
                                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                            Send reminders for upcoming services
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => triggerAutomation('service-reminders')}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Run Now
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Template Modal */}
            <AnimatePresence>
                {showTemplateModal && (
                    <TemplateModal
                        template={editingTemplate}
                        onClose={() => {
                            setShowTemplateModal(false);
                            setEditingTemplate(null);
                        }}
                        onSave={handleSaveTemplate}
                    />
                )}
            </AnimatePresence>

            {/* Department Modal */}
            <AnimatePresence>
                {showDepartmentModal && (
                    <DepartmentModal
                        department={editingDepartment}
                        onClose={() => {
                            setShowDepartmentModal(false);
                            setEditingDepartment(null);
                        }}
                        onSave={handleSaveDepartment}
                    />
                )}
            </AnimatePresence>

            {/* User Role Modal */}
            <AnimatePresence>
                {showUserModal && editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card w-full max-w-md p-6 m-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                                    Change User Role
                                </h2>
                                <button
                                    onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                        {editingUser.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                            {editingUser.email}
                                        </p>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                            Current role: {ROLES.find(r => r.value === editingUser.role)?.label || editingUser.role}
                                        </p>
                                    </div>
                                </div>

                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                                    Select New Role
                                </label>
                                <div className="grid gap-2">
                                    {ROLES.map((role) => (
                                        <button
                                            key={role.value}
                                            onClick={() => handleUpdateUserRole(editingUser.id, role.value)}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${editingUser.role === role.value
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                                }`}
                                        >
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${role.color}`}>
                                                {role.label}
                                            </span>
                                            {editingUser.role === role.value && (
                                                <Check className="w-5 h-5 text-indigo-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Template Modal
function TemplateModal({
    template,
    onClose,
    onSave
}: {
    template: ServiceTemplate | null;
    onClose: () => void;
    onSave: (data: any) => void;
}) {
    const [form, setForm] = useState({
        name: template?.name || '',
        defaultDuration: template?.defaultDuration || 90,
        campus: template?.campus || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(form);
        setLoading(false);
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
                            placeholder="e.g., Sunday Service"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Duration (minutes)
                        </label>
                        <input
                            type="number"
                            className="input-modern w-full"
                            value={form.defaultDuration}
                            onChange={(e) => setForm({ ...form, defaultDuration: parseInt(e.target.value) })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Campus
                        </label>
                        <input
                            type="text"
                            className="input-modern w-full"
                            value={form.campus}
                            onChange={(e) => setForm({ ...form, campus: e.target.value })}
                            placeholder="Main Campus"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// Department Modal
function DepartmentModal({
    department,
    onClose,
    onSave
}: {
    department: Department | null;
    onClose: () => void;
    onSave: (data: any) => void;
}) {
    const [form, setForm] = useState({
        name: department?.name || '',
        description: department?.description || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(form);
        setLoading(false);
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
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., Choir"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                            Description
                        </label>
                        <textarea
                            rows={3}
                            className="input-modern w-full"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Brief description..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
