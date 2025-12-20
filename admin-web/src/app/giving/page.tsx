'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    BarChart3, DollarSign, Target, CreditCard, X
} from 'lucide-react';

// Components
import GivingDashboard from '@/components/giving/GivingDashboard';
import DonationsTable from '@/components/giving/DonationsTable';
import FundCards from '@/components/giving/FundCards';
import PaymentGatewaySettings from '@/components/giving/PaymentGatewaySettings';

// Types
type ActiveTab = 'overview' | 'donations' | 'funds' | 'payment-methods';

export default function GivingPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [loading, setLoading] = useState(true);

    // Data State
    const [stats, setStats] = useState({
        totalAmount: 0,
        activeDonors: 0,
        monthlyGrowth: 0,
        thisMonthAmount: 0
    });
    const [trends, setTrends] = useState<{ date: string; amount: number }[]>([]);
    const [fundDistribution, setFundDistribution] = useState<{ name: string; amount: number }[]>([]);
    const [donations, setDonations] = useState<any[]>([]);
    const [funds, setFunds] = useState<any[]>([]);
    const [paymentConfigs, setPaymentConfigs] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);

    // Modals
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingFund, setEditingFund] = useState<any>(null);
    const [editingDonation, setEditingDonation] = useState<any>(null);
    const [editingConfig, setEditingConfig] = useState<any>(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                api.get('/giving/analytics/overview'),
                api.get('/giving/analytics/trends'),
                api.get('/giving/analytics/by-fund'),
                api.get('/giving/donations'),
                api.get('/giving/funds'),
                api.get('/giving/payment-configs/admin'),
                api.get('/members')
            ]);

            const [
                statsRes,
                trendsRes,
                fundsDistRes,
                donationsRes,
                fundsRes,
                configsRes,
                membersRes
            ] = results;

            // Handle successes
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            else toast.error('Failed to load: Overview Stats');

            if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data);
            else toast.error('Failed to load: Donation Trends');

            if (fundsDistRes.status === 'fulfilled') setFundDistribution(fundsDistRes.value.data);
            else toast.error('Failed to load: Fund Distribution');

            if (donationsRes.status === 'fulfilled') setDonations(donationsRes.value.data);
            else toast.error('Failed to load: Donations');

            if (fundsRes.status === 'fulfilled') setFunds(fundsRes.value.data);
            else toast.error('Failed to load: Funds List');

            if (configsRes.status === 'fulfilled') setPaymentConfigs(configsRes.value.data);
            else toast.error('Failed to load: Payment Configs');

            if (membersRes.status === 'fulfilled') setMembers(membersRes.value.data);
            else toast.error('Failed to load: Members List');

            // Log detailed errors to console for debugging
            results.forEach((res, index) => {
                if (res.status === 'rejected') {
                    console.error(`Request ${index} failed:`, res.reason);
                }
            });
        } catch (e) {
            console.error('Critical error in fetchAllData:', e);
            toast.error('Critical failure loading dashboard');
            console.error(e);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: BarChart3 },
        { id: 'donations', label: 'Transactions', icon: DollarSign },
        { id: 'funds', label: 'Funds & Goals', icon: Target },
        { id: 'payment-methods', label: 'Gateways', icon: CreditCard },
    ];

    const handleToggleConfig = async (id: string, current: boolean) => {
        try {
            await api.patch(`/giving/payment-configs/${id}`, { isActive: !current });
            fetchAllData();
        } catch (e) { toast.error('Update failed'); }
    };

    const handleDeleteConfig = async (id: string) => {
        if (confirm('Delete this channel?')) {
            try {
                await api.delete(`/giving/payment-configs/${id}`);
                toast.success('Deleted');
                fetchAllData();
            } catch (e) { toast.error('Failed to delete'); }
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Giving & Finance" />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {/* Tabs Navigation */}
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ActiveTab)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none translate-y-[-1px]'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'overview' && (
                                    <GivingDashboard
                                        stats={stats}
                                        trends={trends}
                                        fundDistribution={fundDistribution}
                                    />
                                )}

                                {activeTab === 'donations' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Transaction History</h2>
                                            <button
                                                onClick={() => { setEditingDonation(null); setShowRecordModal(true); }}
                                                className="btn-primary flex items-center gap-2"
                                            >
                                                <DollarSign className="w-4 h-4" /> Record Donation
                                            </button>
                                        </div>
                                        <DonationsTable
                                            data={donations}
                                            onEdit={(donation) => { setEditingDonation(donation); setShowRecordModal(true); }}
                                            onDelete={async (id) => {
                                                if (confirm('Delete this transaction? This cannot be undone.')) {
                                                    try {
                                                        await api.delete(`/giving/donations/${id}`);
                                                        toast.success('Transaction deleted');
                                                        fetchAllData();
                                                    } catch (e) { toast.error('Failed to delete'); }
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {activeTab === 'funds' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Manage Funds</h2>
                                        </div>
                                        <FundCards
                                            funds={funds}
                                            fundStats={fundDistribution}
                                            onAdd={() => { setEditingFund(null); setShowFundModal(true); }}
                                            onEdit={(fund) => { setEditingFund(fund); setShowFundModal(true); }}
                                            onDelete={async (id) => {
                                                if (confirm('Are you sure you want to delete this fund?')) {
                                                    try {
                                                        await api.delete(`/giving/funds/${id}`);
                                                        toast.success('Fund deleted');
                                                        fetchAllData();
                                                    } catch (e) { toast.error('Failed to delete fund'); }
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {activeTab === 'payment-methods' && (
                                    <PaymentGatewaySettings
                                        configs={paymentConfigs}
                                        onToggle={handleToggleConfig}
                                        onDelete={handleDeleteConfig}
                                        onAdd={() => { setEditingConfig(null); setShowPaymentModal(true); }}
                                        onEdit={(config) => { setEditingConfig(config); setShowPaymentModal(true); }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Modals */}
                <AnimatePresence>
                    {showRecordModal && (
                        <RecordDonationModal
                            initialData={editingDonation}
                            onClose={() => setShowRecordModal(false)}
                            onSuccess={() => { setShowRecordModal(false); fetchAllData(); }}
                            funds={funds}
                            members={members}
                        />
                    )}
                    {showFundModal && (
                        <FundModal
                            initialData={editingFund}
                            onClose={() => setShowFundModal(false)}
                            onSuccess={() => { setShowFundModal(false); fetchAllData(); }}
                        />
                    )}
                    {showPaymentModal && (
                        <PaymentConfigModal
                            initialData={editingConfig}
                            onClose={() => setShowPaymentModal(false)}
                            onSuccess={() => { setShowPaymentModal(false); fetchAllData(); }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Sub-components / Modals
function RecordDonationModal({ onClose, onSuccess, funds, members, initialData }: { onClose: () => void; onSuccess: () => void; funds: any[]; members: any[]; initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        memberId: initialData?.memberId || '',
        fundId: initialData?.fundId || funds[0]?.id || '',
        amount: initialData?.amount || '',
        method: initialData?.method || 'CASH',
        date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        note: initialData?.note || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                amount: parseFloat(form.amount.toString()),
                memberId: form.memberId || null,
            };

            if (initialData) {
                await api.patch(`/giving/donations/${initialData.id}`, payload);
                toast.success('Transaction Updated');
            } else {
                await api.post('/giving/donations', payload);
                toast.success('Recorded');
            }
            onSuccess();
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-lg bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Record Donation</h2>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Donor</label>
                            <select className="input-modern w-full" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}>
                                <option value="">Anonymous</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Fund</label>
                            <select className="input-modern w-full" value={form.fundId} onChange={e => setForm({ ...form, fundId: e.target.value })} required>
                                <option value="">Select Fund</option>
                                {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Amount (GHS)</label>
                        <input className="input-modern w-full" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date</label>
                            <input className="input-modern w-full" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Method</label>
                            <select className="input-modern w-full" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                                <option value="CASH">Cash</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CARD">Card</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Record'}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function FundModal({ initialData, onClose, onSuccess }: { initialData?: any; onClose: () => void; onSuccess: () => void }) {
    const [name, setName] = useState(initialData?.name || '');
    const [desc, setDesc] = useState(initialData?.description || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await api.patch(`/giving/funds/${initialData.id}`, { name, description: desc });
                toast.success('Fund Updated');
            } else {
                await api.post('/giving/funds', { name, description: desc });
                toast.success('Fund Created');
            }
            onSuccess();
        } catch { toast.error('Operation failed'); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-md bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>{initialData ? 'Edit Fund' : 'New Fund'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="input-modern w-full" placeholder="Fund Name" value={name} onChange={e => setName(e.target.value)} required />
                    <textarea className="input-modern w-full" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">{initialData ? 'Save Changes' : 'Create'}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function PaymentConfigModal({ onClose, onSuccess, initialData }: { onClose: () => void; onSuccess: () => void; initialData?: any }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        type: initialData?.type || 'MOBILE_MONEY',
        provider: initialData?.provider || '',
        accountName: initialData?.accountName || '',
        accountNumber: initialData?.accountNumber || '',
        description: initialData?.description || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await api.patch(`/giving/payment-configs/${initialData.id}`, form);
                toast.success('Channel Updated');
            } else {
                await api.post('/giving/payment-configs', form);
                toast.success('Channel Added');
            }
            onSuccess();
        } catch (error) {
            toast.error('Failed to save channel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                        {initialData ? 'Edit Payment Channel' : 'Add Payment Channel'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            className="input-modern w-full"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="MOBILE_MONEY">Mobile Money</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CARD">Card / Online</option>
                            <option value="USSD">USSD</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Provider Name</label>
                        <input
                            required
                            placeholder="e.g. MTN Momo, GT Bank"
                            className="input-modern w-full"
                            value={form.provider}
                            onChange={(e) => setForm({ ...form, provider: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Account Name</label>
                        <input
                            required
                            placeholder="e.g. HLC Church"
                            className="input-modern w-full"
                            value={form.accountName}
                            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Account Number</label>
                        <input
                            required
                            placeholder="e.g. 0244123456"
                            className="input-modern w-full"
                            value={form.accountNumber}
                            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Update Channel' : 'Add Channel')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

