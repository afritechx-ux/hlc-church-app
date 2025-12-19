import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, Filter, ChevronLeft, ChevronRight, CheckCircle, Clock, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface Donation {
    id: string;
    amount: number;
    date: string;
    method: string;
    note?: string;
    reference?: string;
    gateway?: string; // 'PAYSTACK', etc.
    fund: { id: string; name: string };
    fundId: string;
    member?: { id: string; firstName: string; lastName: string };
    memberId?: string;
}

interface DonationsTableProps {
    data: Donation[];
    onEdit: (donation: any) => void;
    onDelete: (id: string) => void;
}

export default function DonationsTable({ data, onEdit, onDelete }: DonationsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFund, setFilterFund] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter Logic
    const filteredData = data.filter(item => {
        const matchesSearch =
            item.member?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.member?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.method.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFund = filterFund ? item.fund.name === filterFund : true;

        return matchesSearch && matchesFund;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Export CSV
    const handleExport = () => {
        const csvContent = [
            ['Date', 'Donor', 'Fund', 'Amount', 'Method', 'Reference'],
            ...filteredData.map(d => [
                d.date,
                d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Anonymous',
                d.fund.name,
                d.amount,
                d.method,
                d.reference || '-'
            ])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `donations_export_${new Date().toISOString()}.csv`;
        link.click();
    };

    const uniqueFunds = Array.from(new Set(data.map(d => d.fund.name)));

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            placeholder="Search donors, ref..."
                            className="input-modern w-full pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input-modern w-40"
                        value={filterFund}
                        onChange={e => setFilterFund(e.target.value)}
                    >
                        <option value="">All Funds</option>
                        {uniqueFunds.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleExport}
                    className="btn-secondary flex items-center gap-2"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-semibold text-gray-500">Date/Time</th>
                                <th className="p-4 font-semibold text-gray-500">Donor</th>
                                <th className="p-4 font-semibold text-gray-500">Fund</th>
                                <th className="p-4 font-semibold text-gray-500">Method</th>
                                <th className="p-4 font-semibold text-gray-500">Status</th>
                                <th className="p-4 font-semibold text-gray-500 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((donation) => (
                                    <motion.tr
                                        key={donation.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
                                    >
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {formatDate(donation.date)}
                                            <div className="text-xs text-gray-400">
                                                {new Date(donation.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium" style={{ color: 'var(--foreground)' }}>
                                            {donation.member ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                        {donation.member.firstName[0]}{donation.member.lastName[0]}
                                                    </div>
                                                    <div>
                                                        {donation.member.firstName} {donation.member.lastName}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Anonymous</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                                                {donation.fund.name}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {donation.method.replace('_', ' ')}
                                            {donation.gateway && (
                                                <span className="ml-2 text-xs text-gray-400">({donation.gateway})</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {donation.reference ? (
                                                <div className="flex items-center gap-1 text-green-600 text-xs">
                                                    <CheckCircle className="w-3 h-3" /> Paid
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-400 text-xs">
                                                    <Clock className="w-3 h-3" /> Manual
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-bold" style={{ color: 'var(--foreground)' }}>
                                            <div className="flex items-center justify-end gap-3">
                                                <span>{formatCurrency(donation.amount)}</span>
                                                <div className="flex gap-1 transition-opacity">
                                                    <button onClick={() => onEdit(donation)} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => onDelete(donation.id)} className="p-1 hover:bg-red-50 rounded text-gray-500 hover:text-red-600">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No donations found matching criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Stats */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500">
                    <span>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records</span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
