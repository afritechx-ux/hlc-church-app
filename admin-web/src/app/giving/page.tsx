'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Plus, DollarSign, PieChart, TrendingUp, TrendingDown,
    Calendar, Filter, Download, Search, Users, X,
    ChevronLeft, ChevronRight, ArrowUpDown, CreditCard, Wallet,
    Target, BarChart3
} from 'lucide-react';

interface Donation {
    id: string;
    date: string;
    amount: number;
    method: string;
    note?: string;
    member?: { id: string; firstName: string; lastName: string };
    fund: { id: string; name: string };
}

interface Fund {
    id: string;
    name: string;
    description?: string;
    goal?: number;
    _count?: { donations: number };
}

type ActiveTab = 'overview' | 'donations' | 'funds' | 'payment-methods';

export default function GivingPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    // Payment Configs
    const [paymentConfigs, setPaymentConfigs] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Missing state variables
    const [loading, setLoading] = useState(true);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [funds, setFunds] = useState<Fund[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [donationsRes, fundsRes, membersRes, configsRes] = await Promise.all([
                api.get('/giving/donations'),
                api.get('/giving/funds'),
                api.get('/members'),
                api.get('/giving/payment-configs/admin')
            ]);
            setDonations(donationsRes.data);
            setFunds(fundsRes.data);
            setMembers(membersRes.data);
            setPaymentConfigs(configsRes.data);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // ... analytics ...

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'donations', label: 'Donations', icon: DollarSign },
        { id: 'funds', label: 'Funds', icon: Target },
        { id: 'payment-methods', label: 'Payment Configs', icon: CreditCard },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Giving & Finance" />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ActiveTab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700"
                            >
                                <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Overview Dashboard</h3>
                                <p className="text-gray-500">Analytics temporarily unavailable.</p>
                            </motion.div>
                        )}

                        {activeTab === 'donations' && (
                            <motion.div
                                key="donations"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                            >
                                <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="font-bold text-lg">Donations Record</h3>
                                    <button
                                        onClick={() => setShowRecordModal(true)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Record Donation
                                    </button>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-500">Donations list will be restored here.</p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'funds' && (
                            <motion.div
                                key="funds"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                <button
                                    onClick={() => setShowFundModal(true)}
                                    className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                                >
                                    <Plus className="w-10 h-10 text-indigo-400 mb-2" />
                                    <span className="font-medium text-indigo-600">Create New Fund</span>
                                </button>
                                {funds.map(fund => (
                                    <div key={fund.id} className="glass-card p-6">
                                        <h3 className="font-bold text-lg mb-2">{fund.name}</h3>
                                        <p className="text-sm text-gray-500">{fund.description}</p>
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Target: GHS {fund.goal || 'N/A'}</span>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'payment-methods' && (
                            <motion.div
                                key="payment-methods"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {paymentConfigs.map((config, i) => (
                                        <motion.div
                                            key={config.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="glass-card p-6"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                                                            {config.provider}
                                                        </span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {config.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-indigo-600">
                                                        {config.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                                                    <CreditCard className="w-5 h-5 text-indigo-600" />
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Account Name</p>
                                                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>{config.accountName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Account Number</p>
                                                    <p className="font-mono bg-gray-50 dark:bg-gray-800 p-1 rounded" style={{ color: 'var(--foreground)' }}>
                                                        {config.accountNumber}
                                                    </p>
                                                </div>
                                                {config.description && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase">Instructions</p>
                                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{config.description}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Are you sure you want to delete this payment method?')) {
                                                            try {
                                                                await api.delete(`/giving/payment-configs/${config.id}`);
                                                                toast.success('Deleted');
                                                                fetchAllData();
                                                            } catch (e) { toast.error('Failed to delete'); }
                                                        }
                                                    }}
                                                    className="flex-1 btn-secondary text-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await api.patch(`/giving/payment-configs/${config.id}`, { isActive: !config.isActive });
                                                            fetchAllData();
                                                        } catch (e) { toast.error('Failed to update'); }
                                                    }}
                                                    className="flex-1 btn-secondary text-sm"
                                                >
                                                    {config.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Add New Config Card */}
                                    <motion.button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-xl border-2 border-dashed transition hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <Plus className="w-10 h-10" style={{ color: 'var(--foreground-muted)' }} />
                                        <span className="mt-2 font-medium" style={{ color: 'var(--foreground)' }}>
                                            Add Payment Method
                                        </span>
                                    </motion.button>
                                </div>
                            </motion.div >
                        )
                        }
                    </AnimatePresence >
                </main >


                {/* Modals... */}
                {/* Payment Config Modal */}
                <AnimatePresence>
                    {showPaymentModal && (
                        <CreatePaymentConfigModal
                            onClose={() => setShowPaymentModal(false)}
                            onSuccess={() => {
                                setShowPaymentModal(false);
                                fetchAllData();
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Other Modals */}
                <AnimatePresence>
                    {showRecordModal && (
                        <RecordDonationModal
                            onClose={() => setShowRecordModal(false)}
                            onSuccess={() => {
                                setShowRecordModal(false);
                                fetchAllData();
                            }}
                            funds={funds}
                            members={members}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showFundModal && (
                        <CreateFundModal
                            onClose={() => setShowFundModal(false)}
                            onSuccess={() => {
                                setShowFundModal(false);
                                fetchAllData();
                            }}
                        />
                    )}
                </AnimatePresence>
            </div >
            );
}

            // Payment Config Modal
            function CreatePaymentConfigModal({onClose, onSuccess}: {onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
            const [form, setForm] = useState({
                type: 'MOBILE_MONEY',
            provider: '',
            accountName: '',
            accountNumber: '',
            description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
            setLoading(true);
            try {
                await api.post('/giving/payment-configs', form);
            toast.success('Payment Method added');
            onSuccess();
        } catch (error: any) {
                toast.error('Failed to add payment method');
        } finally {
                setLoading(false);
        }
    };

            return (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <motion.div className="glass-card p-6 w-full max-w-md bg-white dark:bg-slate-900">
                    <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Add Payment Channel</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Channel Type</label>
                            <select
                                className="input-modern w-full"
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="USSD">USSD</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Provider Name</label>
                            <input
                                className="input-modern w-full"
                                placeholder="e.g. MTN MoMo, Ecobank"
                                value={form.provider}
                                onChange={e => setForm({ ...form, provider: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Account Number / Code</label>
                            <input
                                className="input-modern w-full"
                                placeholder="055..."
                                value={form.accountNumber}
                                onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Account Name</label>
                            <input
                                className="input-modern w-full"
                                placeholder="Church Name"
                                value={form.accountName}
                                onChange={e => setForm({ ...form, accountName: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Instructions (Optional)</label>
                            <textarea
                                className="input-modern w-full"
                                placeholder="Dial *170#..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Adding...' : 'Add Channel'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
            );
}

            // Record Donation Modal
            function RecordDonationModal({onClose, onSuccess, funds, members}: {
                onClose: () => void;
    onSuccess: () => void;
            funds: Fund[];
            members: any[];
}) {
    const [loading, setLoading] = useState(false);
            const [form, setForm] = useState({
                memberId: '',
            fundId: funds[0]?.id || '',
            amount: '',
            method: 'CASH',
            date: new Date().toISOString().split('T')[0],
            note: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
            if (!form.fundId || !form.amount) {
                toast.error('Please fill in required fields');
            return;
        }
            setLoading(true);
            try {
                await api.post('/giving/donations', {
                    ...form,
                    amount: parseFloat(form.amount),
                    memberId: form.memberId || null,
                });
            toast.success('Donation recorded successfully');
            onSuccess();
        } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to record donation');
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
                            Record Donation
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Donor (Optional)
                            </label>
                            <select
                                className="input-modern w-full"
                                value={form.memberId}
                                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                            >
                                <option value="">Anonymous</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Fund *
                            </label>
                            <select
                                required
                                className="input-modern w-full"
                                value={form.fundId}
                                onChange={(e) => setForm({ ...form, fundId: e.target.value })}
                            >
                                {funds.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                    Amount (GHS) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="input-modern w-full"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                    Date
                                </label>
                                <input
                                    type="date"
                                    className="input-modern w-full"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Payment Method
                            </label>
                            <select
                                className="input-modern w-full"
                                value={form.method}
                                onChange={(e) => setForm({ ...form, method: e.target.value })}
                            >
                                <option value="CASH">Cash</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CARD">Card</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Note (Optional)
                            </label>
                            <textarea
                                className="input-modern w-full"
                                rows={2}
                                value={form.note}
                                onChange={(e) => setForm({ ...form, note: e.target.value })}
                                placeholder="Any additional notes..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Recording...' : 'Record Donation'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
            );
}

            // Create Fund Modal
            function CreateFundModal({onClose, onSuccess}: {onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
            const [form, setForm] = useState({
                name: '',
            description: '',
            goal: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
            if (!form.name) {
                toast.error('Please enter a fund name');
            return;
        }
            setLoading(true);
            try {
                await api.post('/giving/funds', {
                    name: form.name,
                    description: form.description || null,
                    goal: form.goal ? parseFloat(form.goal) : null,
                });
            toast.success('Fund created successfully');
            onSuccess();
        } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to create fund');
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
                            Create New Fund
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Fund Name *
                            </label>
                            <input
                                type="text"
                                required
                                className="input-modern w-full"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g., Building Fund"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Description
                            </label>
                            <textarea
                                className="input-modern w-full"
                                rows={2}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe the purpose of this fund..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                                Goal Amount (GHS)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="input-modern w-full"
                                value={form.goal}
                                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                                placeholder="Leave empty for no goal"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Creating...' : 'Create Fund'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
            );
}
