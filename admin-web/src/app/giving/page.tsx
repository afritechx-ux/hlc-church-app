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

type ActiveTab = 'overview' | 'donations' | 'funds';

export default function GivingPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [donations, setDonations] = useState<Donation[]>([]);
    const [funds, setFunds] = useState<Fund[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [fundFilter, setFundFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Modals
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [donationsRes, fundsRes, membersRes] = await Promise.all([
                api.get('/giving/donations'),
                api.get('/giving/funds'),
                api.get('/members')
            ]);
            setDonations(donationsRes.data);
            setFunds(fundsRes.data);
            setMembers(membersRes.data);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Analytics
    const analytics = useMemo(() => {
        const now = new Date();
        const thisMonth = donations.filter(d => {
            const date = new Date(d.date);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        const lastMonth = donations.filter(d => {
            const date = new Date(d.date);
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
        });

        const thisMonthTotal = thisMonth.reduce((sum, d) => sum + d.amount, 0);
        const lastMonthTotal = lastMonth.reduce((sum, d) => sum + d.amount, 0);
        const percentChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

        const totalGiving = donations.reduce((sum, d) => sum + d.amount, 0);
        const avgDonation = donations.length > 0 ? totalGiving / donations.length : 0;
        const uniqueDonors = new Set(donations.filter(d => d.member).map(d => d.member?.id)).size;

        // Fund breakdown
        const fundBreakdown = funds.map(f => ({
            ...f,
            total: donations.filter(d => d.fund.id === f.id).reduce((sum, d) => sum + d.amount, 0)
        })).sort((a, b) => b.total - a.total);

        return {
            thisMonthTotal,
            lastMonthTotal,
            percentChange,
            totalGiving,
            avgDonation,
            uniqueDonors,
            totalDonations: donations.length,
            fundBreakdown
        };
    }, [donations, funds]);

    // Filtered donations
    const filteredDonations = useMemo(() => {
        let result = [...donations];

        if (searchTerm) {
            result = result.filter(d =>
                (d.member && `${d.member.firstName} ${d.member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
                d.fund.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (fundFilter !== 'all') {
            result = result.filter(d => d.fund.id === fundFilter);
        }

        if (methodFilter !== 'all') {
            result = result.filter(d => d.method === methodFilter);
        }

        if (dateRange.start) {
            result = result.filter(d => new Date(d.date) >= new Date(dateRange.start));
        }

        if (dateRange.end) {
            result = result.filter(d => new Date(d.date) <= new Date(dateRange.end));
        }

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [donations, searchTerm, fundFilter, methodFilter, dateRange]);

    // Pagination
    const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
    const paginatedDonations = filteredDonations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Export handler
    const handleExport = async () => {
        try {
            const response = await api.get('/reports/giving/csv', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `giving-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Giving report exported');
        } catch (error) {
            toast.error('Failed to export');
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'donations', label: 'Donations', icon: DollarSign },
        { id: 'funds', label: 'Funds', icon: Target },
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
                                    Giving
                                </h1>
                                <p style={{ color: 'var(--foreground-muted)' }}>
                                    Manage donations and funds
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                                <button
                                    onClick={() => setShowRecordModal(true)}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Record Donation
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mt-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition ${activeTab === tab.id
                                            ? 'bg-indigo-600 text-white'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    style={activeTab !== tab.id ? { color: 'var(--foreground)' } : {}}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    {[
                                        {
                                            label: 'This Month',
                                            value: `GHS ${analytics.thisMonthTotal.toLocaleString()}`,
                                            change: analytics.percentChange,
                                            icon: Calendar,
                                            color: '#6366f1'
                                        },
                                        {
                                            label: 'Total Giving',
                                            value: `GHS ${analytics.totalGiving.toLocaleString()}`,
                                            icon: DollarSign,
                                            color: '#10b981'
                                        },
                                        {
                                            label: 'Average Donation',
                                            value: `GHS ${analytics.avgDonation.toFixed(0)}`,
                                            icon: TrendingUp,
                                            color: '#f59e0b'
                                        },
                                        {
                                            label: 'Unique Donors',
                                            value: analytics.uniqueDonors.toString(),
                                            icon: Users,
                                            color: '#8b5cf6'
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
                                                    {stat.change !== undefined && (
                                                        <div className={`flex items-center gap-1 mt-2 text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {stat.change >= 0 ? (
                                                                <TrendingUp className="w-4 h-4" />
                                                            ) : (
                                                                <TrendingDown className="w-4 h-4" />
                                                            )}
                                                            {Math.abs(stat.change).toFixed(1)}% from last month
                                                        </div>
                                                    )}
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

                                {/* Fund Breakdown */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="glass-card p-6"
                                    >
                                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                            Fund Breakdown
                                        </h3>
                                        <div className="space-y-4">
                                            {analytics.fundBreakdown.slice(0, 5).map((fund, i) => (
                                                <div key={fund.id}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                                            {fund.name}
                                                        </span>
                                                        <span className="text-sm font-semibold text-green-600">
                                                            GHS {fund.total.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{
                                                                width: `${(fund.total / Math.max(...analytics.fundBreakdown.map(f => f.total), 1)) * 100}%`
                                                            }}
                                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                                            className="h-2 rounded-full"
                                                            style={{
                                                                background: `linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="glass-card p-6"
                                    >
                                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                            Recent Donations
                                        </h3>
                                        <div className="space-y-3">
                                            {donations.slice(0, 5).map((d, i) => (
                                                <motion.div
                                                    key={d.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="flex items-center justify-between p-3 rounded-lg"
                                                    style={{ background: 'var(--background)' }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                                                        >
                                                            {d.member ? d.member.firstName[0] : 'A'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                                                                {d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Anonymous'}
                                                            </p>
                                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                                {d.fund.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-green-600">
                                                            GHS {d.amount.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                                            {new Date(d.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}

                        {/* Donations Tab */}
                        {activeTab === 'donations' && (
                            <motion.div
                                key="donations"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {/* Filters */}
                                <div className="glass-card p-4 mb-6">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="relative flex-1 min-w-[200px] max-w-md">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
                                            <input
                                                type="text"
                                                placeholder="Search by donor or fund..."
                                                className="input-modern w-full pl-10"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-indigo-500' : ''}`}
                                        >
                                            <Filter className="w-4 h-4" />
                                            Filters
                                        </button>
                                    </div>

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
                                                        <label className="block text-sm mb-1" style={{ color: 'var(--foreground-muted)' }}>Fund</label>
                                                        <select
                                                            value={fundFilter}
                                                            onChange={(e) => { setFundFilter(e.target.value); setCurrentPage(1); }}
                                                            className="input-modern"
                                                        >
                                                            <option value="all">All Funds</option>
                                                            {funds.map((f) => (
                                                                <option key={f.id} value={f.id}>{f.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm mb-1" style={{ color: 'var(--foreground-muted)' }}>Method</label>
                                                        <select
                                                            value={methodFilter}
                                                            onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
                                                            className="input-modern"
                                                        >
                                                            <option value="all">All Methods</option>
                                                            <option value="CASH">Cash</option>
                                                            <option value="MOBILE_MONEY">Mobile Money</option>
                                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                                            <option value="CARD">Card</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm mb-1" style={{ color: 'var(--foreground-muted)' }}>From Date</label>
                                                        <input
                                                            type="date"
                                                            className="input-modern"
                                                            value={dateRange.start}
                                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm mb-1" style={{ color: 'var(--foreground-muted)' }}>To Date</label>
                                                        <input
                                                            type="date"
                                                            className="input-modern"
                                                            value={dateRange.end}
                                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setFundFilter('all');
                                                            setMethodFilter('all');
                                                            setDateRange({ start: '', end: '' });
                                                            setSearchTerm('');
                                                        }}
                                                        className="self-end btn-secondary"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Donations Table */}
                                <div className="glass-card overflow-hidden">
                                    <table className="modern-table w-full">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Donor</th>
                                                <th>Fund</th>
                                                <th>Amount</th>
                                                <th>Method</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <tr key={i}>
                                                        <td colSpan={5}><div className="skeleton h-10 w-full" /></td>
                                                    </tr>
                                                ))
                                            ) : paginatedDonations.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-12">
                                                        <DollarSign className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
                                                        <p style={{ color: 'var(--foreground-muted)' }}>No donations found</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedDonations.map((d, i) => (
                                                    <motion.tr
                                                        key={d.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                    >
                                                        <td>{new Date(d.date).toLocaleDateString()}</td>
                                                        <td>
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                                                    style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)' }}
                                                                >
                                                                    {d.member ? d.member.firstName[0] : 'A'}
                                                                </div>
                                                                <span style={{ color: 'var(--foreground)' }}>
                                                                    {d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Anonymous'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--primary)', color: 'white' }}>
                                                                {d.fund.name}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="font-semibold text-green-600">
                                                                GHS {d.amount.toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="flex items-center gap-2">
                                                                {d.method === 'CASH' && <Wallet className="w-4 h-4" />}
                                                                {d.method === 'MOBILE_MONEY' && <CreditCard className="w-4 h-4" />}
                                                                {d.method === 'BANK_TRANSFER' && <CreditCard className="w-4 h-4" />}
                                                                {d.method === 'CARD' && <CreditCard className="w-4 h-4" />}
                                                                <span style={{ color: 'var(--foreground-muted)' }}>
                                                                    {d.method?.replace('_', ' ')}
                                                                </span>
                                                            </span>
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
                                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDonations.length)} of {filteredDonations.length}
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
                                </div>
                            </motion.div>
                        )}

                        {/* Funds Tab */}
                        {activeTab === 'funds' && (
                            <motion.div
                                key="funds"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {funds.map((f, i) => {
                                        const fundTotal = donations.filter(d => d.fund.id === f.id).reduce((sum, d) => sum + d.amount, 0);
                                        const progress = f.goal ? (fundTotal / f.goal) * 100 : 0;

                                        return (
                                            <motion.div
                                                key={f.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="glass-card p-6"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                                                            {f.name}
                                                        </h3>
                                                        <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                                            {f.description || 'No description'}
                                                        </p>
                                                    </div>
                                                    <div
                                                        className="p-2 rounded-lg"
                                                        style={{ background: '#6366f1' + '20' }}
                                                    >
                                                        <Target className="w-5 h-5" style={{ color: '#6366f1' }} />
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <div className="flex items-end justify-between mb-2">
                                                        <div>
                                                            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Raised</p>
                                                            <p className="text-xl font-bold text-green-600">
                                                                GHS {fundTotal.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        {f.goal && (
                                                            <div className="text-right">
                                                                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Goal</p>
                                                                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                                    GHS {f.goal.toLocaleString()}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {f.goal && (
                                                        <div className="mt-3">
                                                            <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                                                    className="h-2 rounded-full"
                                                                    style={{
                                                                        background: progress >= 100
                                                                            ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                                                            : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
                                                                    }}
                                                                />
                                                            </div>
                                                            <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                                                {progress.toFixed(0)}% of goal
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {/* Add New Fund Card */}
                                    <motion.button
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: funds.length * 0.1 }}
                                        onClick={() => setShowFundModal(true)}
                                        className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed transition hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <Plus className="w-10 h-10" style={{ color: 'var(--foreground-muted)' }} />
                                        <span className="mt-2 font-medium" style={{ color: 'var(--foreground)' }}>
                                            Create New Fund
                                        </span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Record Donation Modal */}
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

            {/* Create Fund Modal */}
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
        </div>
    );
}

// Record Donation Modal
function RecordDonationModal({ onClose, onSuccess, funds, members }: {
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
function CreateFundModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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
