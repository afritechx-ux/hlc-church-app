import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, Users, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface GivingDashboardProps {
    stats: {
        totalAmount: number;
        activeDonors: number;
        monthlyGrowth: number;
        thisMonthAmount: number;
    };
    trends: { date: string; amount: number }[];
    fundDistribution: { name: string; amount: number }[];
}

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

export default function GivingDashboard({ stats, trends, fundDistribution }: GivingDashboardProps) {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Giving (All Time)</p>
                    <h3 className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
                        {formatCurrency(stats.totalAmount)}
                    </h3>
                    <div className="flex items-center gap-2 mt-4 text-sm text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                        <TrendingUp className="w-4 h-4" />
                        <span>Lifetime</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6"
                >
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Growth</p>
                    <h3 className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
                        {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
                    </h3>
                    <div className={`flex items-center gap-2 mt-4 text-sm w-fit px-2 py-1 rounded-full ${stats.monthlyGrowth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {stats.monthlyGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>vs Last Month</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6"
                >
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Donors</p>
                    <h3 className="text-3xl font-bold mt-2" style={{ color: 'var(--foreground)' }}>
                        {stats.activeDonors}
                    </h3>
                    <div className="flex items-center gap-2 mt-4 text-sm text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-full">
                        <Users className="w-4 h-4" />
                        <span>Contributors</span>
                    </div>
                </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trends Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 lg:col-span-2"
                >
                    <h3 className="font-bold text-lg mb-6" style={{ color: 'var(--foreground)' }}>Donation Trends (Last 30 Days)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `GH₵${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Funds Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6"
                >
                    <h3 className="font-bold text-lg mb-6" style={{ color: 'var(--foreground)' }}>Fund Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={fundDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="amount"
                                >
                                    {fundDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
