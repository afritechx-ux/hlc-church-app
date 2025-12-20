'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Download, FileText, Calendar, Users, CreditCard, RefreshCw,
    TrendingUp, TrendingDown, BarChart3, PieChart, Clock, CheckCircle,
    FileSpreadsheet, FileType, ArrowUpRight, ArrowDownRight, ChevronDown,
    Eye, Printer, Share2, Filter, Search, X
} from 'lucide-react';

interface SummaryStats {
    period: { startDate: string; endDate: string };
    members: { total: number; newThisPeriod: number };
    attendance: { totalCheckIns: number };
    giving: { totalAmount: number; totalDonations: number };
}

const reportTypes = [
    {
        id: 'attendance',
        name: 'Attendance Report',
        description: 'Comprehensive attendance analysis including check-in trends, peak hours, and member participation rates.',
        icon: Calendar,
        gradient: 'from-indigo-500 to-purple-500',
        bgGradient: 'from-indigo-500/10 to-purple-500/10',
        requiresDateRange: true,
        metrics: ['Total Check-ins', 'Average Attendance', 'Peak Days'],
    },
    {
        id: 'giving',
        name: 'Giving & Donations',
        description: 'Complete financial report with fund breakdowns, giving trends, and donor analytics.',
        icon: CreditCard,
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-500/10 to-teal-500/10',
        requiresDateRange: true,
        metrics: ['Total Giving', 'Average Donation', 'Donor Count'],
    },
    {
        id: 'members',
        name: 'Member Directory',
        description: 'Complete member database export with contact info, departments, and household relationships.',
        icon: Users,
        gradient: 'from-amber-500 to-orange-500',
        bgGradient: 'from-amber-500/10 to-orange-500/10',
        requiresDateRange: false,
        metrics: ['Total Members', 'Active Members', 'New Members'],
    },
];

const exportFormats = [
    { id: 'csv', name: 'CSV', icon: FileSpreadsheet, description: 'Spreadsheet format' },
    { id: 'pdf', name: 'PDF', icon: FileType, description: 'Document format' },
    { id: 'docx', name: 'Word', icon: FileText, description: 'Word document' },
];

// Quick date range presets
const datePresets = [
    {
        label: 'This Week', getValue: () => {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return { start: startOfWeek.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
        }
    },
    {
        label: 'This Month', getValue: () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: startOfMonth.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
        }
    },
    {
        label: 'Last 30 Days', getValue: () => {
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return { start: thirtyDaysAgo.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
        }
    },
    {
        label: 'Last 3 Months', getValue: () => {
            const now = new Date();
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            return { start: threeMonthsAgo.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
        }
    },
    {
        label: 'This Year', getValue: () => {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            return { start: startOfYear.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
        }
    },
];

export default function ReportsPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<string>('csv');
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Set default date range (last 30 days)
    useEffect(() => {
        const preset = datePresets[2].getValue(); // Last 30 Days
        setStartDate(preset.start);
        setEndDate(preset.end);
    }, []);

    // Fetch summary when dates change
    useEffect(() => {
        if (startDate && endDate) {
            fetchSummary();
        }
    }, [startDate, endDate]);

    const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
            const { data } = await api.get(`/reports/summary?startDate=${startDate}&endDate=${endDate}`);
            setSummary(data);
        } catch (error) {
            console.error('Failed to fetch summary', error);
        } finally {
            setLoadingSummary(false);
        }
    };

    const applyPreset = (preset: typeof datePresets[0]) => {
        const { start, end } = preset.getValue();
        setStartDate(start);
        setEndDate(end);
    };

    const downloadReport = async (reportId: string, format: string) => {
        const report = reportTypes.find(r => r.id === reportId);
        if (!report) return;

        if (report.requiresDateRange && (!startDate || !endDate)) {
            toast.error('Please select a date range');
            return;
        }

        setLoading(reportId);
        try {
            let url = '';
            let filename = '';
            const dateStr = report.requiresDateRange
                ? `${startDate}-${endDate}`
                : new Date().toISOString().split('T')[0];

            switch (reportId) {
                case 'attendance':
                    url = `/reports/attendance/csv?startDate=${startDate}&endDate=${endDate}`;
                    filename = `attendance-report-${dateStr}`;
                    break;
                case 'giving':
                    url = `/reports/giving/csv?startDate=${startDate}&endDate=${endDate}`;
                    filename = `giving-report-${dateStr}`;
                    break;
                case 'members':
                    url = '/reports/members/csv';
                    filename = `member-directory-${dateStr}`;
                    break;
            }

            const response = await api.get(url, { responseType: 'blob' });
            const csvText = await response.data.text();

            if (format === 'csv') {
                downloadAsCSV(csvText, `${filename}.csv`);
            } else if (format === 'pdf') {
                await downloadAsPDF(csvText, filename, reportId);
            } else if (format === 'docx') {
                await downloadAsWord(csvText, filename, reportId);
            }

            toast.success(`${report.name} downloaded as ${format.toUpperCase()}!`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to download report');
        } finally {
            setLoading(null);
            setShowExportModal(false);
        }
    };

    const downloadAsCSV = (csvText: string, filename: string) => {
        const blob = new Blob([csvText], { type: 'text/csv' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    };

    const downloadAsPDF = async (csvText: string, filename: string, reportId: string) => {
        // Parse CSV to data
        const rows = csvText.split('\n').map(row => {
            const matches = row.match(/("([^"]|"")*"|[^,]+)/g) || [];
            return matches.map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"'));
        });

        const headers = rows[0];
        const data = rows.slice(1).filter(row => row.length > 0);

        // Generate PDF using basic HTML-to-PDF approach
        const reportTitle = reportTypes.find(r => r.id === reportId)?.name || 'Report';

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${reportTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1a1a2e; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
        .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 8px; text-align: left; }
        td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; }
        .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary h3 { margin: 0 0 10px 0; color: #374151; }
    </style>
</head>
<body>
    <h1>${reportTitle}</h1>
    <div class="meta">
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Records:</strong> ${data.length}</p>
    </div>
    <table>
        <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
            ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
    </table>
    <div class="footer">
        <p>Generated by Church Management System • ${new Date().getFullYear()}</p>
    </div>
</body>
</html>`;

        // Create a new window and print as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Give it a moment to render, then trigger print
            setTimeout(() => {
                printWindow.print();
                // Note: User will need to save as PDF from print dialog
            }, 500);
        }
    };

    const downloadAsWord = async (csvText: string, filename: string, reportId: string) => {
        // Parse CSV to data
        const rows = csvText.split('\n').map(row => {
            const matches = row.match(/("([^"]|"")*"|[^,]+)/g) || [];
            return matches.map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"'));
        });

        const headers = rows[0];
        const data = rows.slice(1).filter(row => row.length > 0);

        const reportTitle = reportTypes.find(r => r.id === reportId)?.name || 'Report';

        // Create Word-compatible HTML
        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
    <meta charset="utf-8">
    <title>${reportTitle}</title>
    <style>
        body { font-family: 'Calibri', sans-serif; margin: 1in; }
        h1 { color: #1a1a2e; border-bottom: 2px solid #6366f1; padding-bottom: 10px; font-size: 24pt; }
        .meta { color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #6366f1; color: white; padding: 10px; text-align: left; font-weight: bold; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10pt; }
    </style>
</head>
<body>
    <h1>${reportTitle}</h1>
    <div class="meta">
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Records:</strong> ${data.length}</p>
    </div>
    <table>
        <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
            ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
    </table>
    <div class="footer">
        <p>Generated by Church Management System</p>
    </div>
</body>
</html>`;

        // Download as .doc file
        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${filename}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    };

    const openExportModal = (reportId: string) => {
        setSelectedReport(reportId);
        setSelectedFormat('csv');
        setShowExportModal(true);
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
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                                Reports & Analytics
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                Generate comprehensive reports and export church data
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchSummary}
                                disabled={loadingSummary}
                                className="p-2 rounded-lg glass-card hover:scale-105 transition-transform"
                            >
                                <RefreshCw className={`w-5 h-5 ${loadingSummary ? 'animate-spin' : ''}`} style={{ color: 'var(--foreground-muted)' }} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Summary Stats */}
                    {summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                                            Total Members
                                        </p>
                                        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                                            {summary.members.total}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                            <span className="text-xs text-emerald-500">+{summary.members.newThisPeriod} new</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-indigo-500" />
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
                                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                                            Attendance
                                        </p>
                                        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                                            {summary.attendance.totalCheckIns}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                            Check-ins this period
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-amber-500" />
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
                                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                                            Total Giving
                                        </p>
                                        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                                            GH₵{summary.giving.totalAmount.toLocaleString()}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                                            {summary.giving.totalDonations} donations
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-emerald-500" />
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
                                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--foreground-muted)' }}>
                                            Period
                                        </p>
                                        <p className="text-sm font-semibold mt-1" style={{ color: 'var(--foreground)' }}>
                                            {new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                            to {new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-rose-500" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Date Range Selector */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 mb-8"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                    📅 Select Date Range
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {datePresets.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => applyPreset(preset)}
                                            className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:scale-105 transition-transform"
                                            style={{ color: 'var(--foreground)' }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="input-modern"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="input-modern"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Report Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reportTypes.map((report, index) => {
                            const Icon = report.icon;
                            const isLoading = loading === report.id;

                            return (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    className="glass-card overflow-hidden group hover:shadow-xl transition-all duration-300"
                                >
                                    {/* Gradient Header */}
                                    <div className={`h-2 bg-gradient-to-r ${report.gradient}`} />

                                    <div className="p-6">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${report.bgGradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className={`w-7 h-7 bg-gradient-to-r ${report.gradient} bg-clip-text`} style={{ color: report.gradient.includes('indigo') ? '#6366f1' : report.gradient.includes('emerald') ? '#10b981' : '#f59e0b' }} />
                                        </div>

                                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                                            {report.name}
                                        </h3>
                                        <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--foreground-muted)' }}>
                                            {report.description}
                                        </p>

                                        {/* Metrics Preview */}
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {report.metrics.map((metric) => (
                                                <span
                                                    key={metric}
                                                    className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
                                                    style={{ color: 'var(--foreground-muted)' }}
                                                >
                                                    {metric}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openExportModal(report.id)}
                                                disabled={isLoading}
                                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Download className="w-4 h-4" />
                                                        Export
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Quick Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card p-6 mt-8"
                    >
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                            💡 Quick Tips
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                    <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>CSV Format</p>
                                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Best for Excel, Google Sheets, and data analysis</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <FileType className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>PDF Format</p>
                                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Perfect for printing and sharing with stakeholders</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>Word Format</p>
                                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Edit and customize reports in Microsoft Word</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>

            {/* Export Modal */}
            <AnimatePresence>
                {showExportModal && selectedReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowExportModal(false)}
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
                                    Export {reportTypes.find(r => r.id === selectedReport)?.name}
                                </h2>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
                                Choose your preferred format to download the report.
                            </p>

                            <div className="space-y-3 mb-6">
                                {exportFormats.map((format) => {
                                    const Icon = format.icon;
                                    return (
                                        <button
                                            key={format.id}
                                            onClick={() => setSelectedFormat(format.id)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selectedFormat === format.id
                                                    ? 'border-indigo-500 bg-indigo-500/10'
                                                    : 'border-transparent glass-card hover:border-gray-300 dark:hover:border-gray-700'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${format.id === 'csv' ? 'bg-emerald-500/10' :
                                                    format.id === 'pdf' ? 'bg-red-500/10' : 'bg-blue-500/10'
                                                }`}>
                                                <Icon className={`w-5 h-5 ${format.id === 'csv' ? 'text-emerald-500' :
                                                        format.id === 'pdf' ? 'text-red-500' : 'text-blue-500'
                                                    }`} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                    {format.name}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                                    {format.description}
                                                </p>
                                            </div>
                                            {selectedFormat === format.id && (
                                                <CheckCircle className="w-5 h-5 text-indigo-500 ml-auto" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => downloadReport(selectedReport, selectedFormat)}
                                    disabled={loading === selectedReport}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    {loading === selectedReport ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Download
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
