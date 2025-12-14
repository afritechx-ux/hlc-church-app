'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Users, CreditCard, UserPlus, AlertCircle, TrendingUp, TrendingDown,
  Download, Calendar, Clock, CheckCircle2, ArrowRight, Activity,
  Eye, UserCheck, DollarSign, BarChart3, PieChart, RefreshCw,
  ChevronRight, Star, Zap, Target, ArrowUpRight, ArrowDownRight,
  Bell, ListTodo, Heart, Users2, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';

interface StatCardProps {
  name: string;
  value: string;
  icon: any;
  gradient: string;
  trend?: number;
  trendLabel?: string;
  delay: number;
  loading: boolean;
}

function StatCard({ name, value, icon: Icon, gradient, trend, trendLabel, delay, loading }: StatCardProps) {
  const isPositive = trend && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="glass-card p-5 hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>{name}</p>
          {loading ? (
            <div className="skeleton h-8 w-24 mt-2" />
          ) : (
            <motion.p
              className="text-2xl font-bold mt-1"
              style={{ color: 'var(--foreground)' }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: delay * 0.1 + 0.2, type: "spring" }}
            >
              {value}
            </motion.p>
          )}
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{trend}%
              </span>
              <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                {trendLabel || 'vs last week'}
              </span>
            </div>
          )}
        </div>
        <div className={`stat-icon ${gradient} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

// Quick Action Card
function QuickAction({ icon: Icon, label, href, color, delay }: {
  icon: any;
  label: string;
  href: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05 }}
    >
      <Link
        href={href}
        className="flex flex-col items-center gap-2 p-4 rounded-xl glass-card hover:scale-105 transition-all duration-300 group"
      >
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    members: 0,
    giving: 0,
    visitors: 0,
    activeFollowUps: 0,
    todayCheckIns: 0,
    completedFollowUps: 0,
    avgAttendance: 0,
    engagementScore: 0,
  });
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [givingData, setGivingData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<any[]>([]);
  const [followUpsByType, setFollowUpsByType] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [membersRes, givingRes, followUpsRes, servicesRes] = await Promise.all([
        api.get('/members'),
        api.get('/giving/donations'),
        api.get('/follow-ups'),
        api.get('/services/occurrences')
      ]);

      const members = membersRes.data;
      const donations = givingRes.data;
      const tasks = followUpsRes.data;
      const services = servicesRes.data;

      // Calculate stats
      const newVisitors = tasks.filter((t: any) => t.type === 'NEW_VISITOR');
      const activeFollowUps = tasks.filter((t: any) => t.status !== 'COMPLETED');
      const completedFollowUps = tasks.filter((t: any) => t.status === 'COMPLETED');

      // Today's check-ins (if we had today's service)
      const today = new Date().toISOString().split('T')[0];
      const todayService = services.find((s: any) => s.date.startsWith(today));

      let todayCheckIns = 0;
      if (todayService) {
        try {
          const attendanceRes = await api.get(`/attendance/service/${todayService.id}`);
          todayCheckIns = attendanceRes.data.length;
        } catch (e) { }
      }

      // Calculate average attendance
      let totalAttendance = 0;
      let serviceCount = 0;
      const recentServices = services.slice(0, 5);
      for (const service of recentServices) {
        try {
          const attendanceRes = await api.get(`/attendance/service/${service.id}`);
          totalAttendance += attendanceRes.data.length;
          serviceCount++;
        } catch (e) { }
      }
      const avgAttendance = serviceCount > 0 ? Math.round(totalAttendance / serviceCount) : 0;

      setStats({
        members: members.length,
        giving: donations.reduce((sum: number, d: any) => sum + Number(d.amount), 0),
        visitors: newVisitors.length,
        activeFollowUps: activeFollowUps.length,
        todayCheckIns,
        completedFollowUps: completedFollowUps.length,
        avgAttendance,
        engagementScore: 78, // Mock engagement score
      });

      // Follow-ups by type for pie chart
      const typeCount: Record<string, number> = {};
      tasks.forEach((t: any) => {
        typeCount[t.type] = (typeCount[t.type] || 0) + 1;
      });
      setFollowUpsByType([
        { name: 'New Visitors', value: typeCount['NEW_VISITOR'] || 0, color: '#8b5cf6' },
        { name: 'Inactive', value: typeCount['INACTIVE_MEMBER'] || 0, color: '#f59e0b' },
        { name: 'Pastoral', value: typeCount['GENERAL_PASTORAL'] || 0, color: '#3b82f6' },
      ]);

      // Process Giving Data - Last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayTotal = donations
          .filter((d: any) => d.date.startsWith(dateStr))
          .reduce((sum: number, d: any) => sum + Number(d.amount), 0);
        last7Days.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: dayTotal
        });
      }
      setGivingData(last7Days);

      // Process Attendance Data - Last 5 services
      const sortedServices = services.sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5).reverse();

      const attendancePromises = sortedServices.map((s: any) =>
        api.get(`/attendance/service/${s.id}`).catch(() => ({ data: [] }))
      );
      const attendanceResponses = await Promise.all(attendancePromises);

      const attendanceChartData = sortedServices.map((s: any, index: number) => ({
        name: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        attendance: attendanceResponses[index].data.length,
        service: s.template?.name || 'Service'
      }));
      setAttendanceData(attendanceChartData);

      // Recent Activity
      const activityItems: any[] = [];

      // Recent donations
      donations.slice(0, 3).forEach((d: any) => {
        activityItems.push({
          type: 'donation',
          icon: DollarSign,
          color: 'text-emerald-500 bg-emerald-500/10',
          title: `New donation received`,
          subtitle: `GH₵${Number(d.amount).toLocaleString()} - ${d.fund?.name || 'General Fund'}`,
          time: new Date(d.date).toLocaleDateString()
        });
      });

      // Recent members
      members.slice(0, 2).forEach((m: any) => {
        activityItems.push({
          type: 'member',
          icon: UserPlus,
          color: 'text-blue-500 bg-blue-500/10',
          title: `${m.firstName} ${m.lastName}`,
          subtitle: 'New member added',
          time: new Date(m.createdAt).toLocaleDateString()
        });
      });

      // Sort by time descending
      setRecentActivity(activityItems.slice(0, 5));

      // Upcoming services
      const futureServices = services
        .filter((s: any) => new Date(s.date) >= new Date())
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
      setUpcomingServices(futureServices);

    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const statCards = [
    { name: 'Total Members', value: stats.members.toString(), icon: Users, gradient: 'gradient-primary', trend: 8 },
    { name: 'Total Giving', value: `GH₵${stats.giving.toLocaleString()}`, icon: CreditCard, gradient: 'gradient-success', trend: 15, trendLabel: 'this month' },
    { name: 'New Visitors', value: stats.visitors.toString(), icon: UserPlus, gradient: 'gradient-secondary', trend: 12 },
    { name: 'Active Follow-Ups', value: stats.activeFollowUps.toString(), icon: ListTodo, gradient: 'gradient-accent', trend: -5 },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'Add Member', href: '/members', color: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
    { icon: Calendar, label: 'Services', href: '/services', color: 'bg-gradient-to-br from-amber-500 to-orange-500' },
    { icon: DollarSign, label: 'Record Giving', href: '/giving', color: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
    { icon: ListTodo, label: 'Follow-Ups', href: '/follow-ups', color: 'bg-gradient-to-br from-rose-500 to-pink-500' },
    { icon: BarChart3, label: 'Reports', href: '/reports', color: 'bg-gradient-to-br from-cyan-500 to-blue-500' },
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
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Sparkles className="w-6 h-6 text-amber-500" />
                Welcome back!
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
                Here's what's happening at your church today
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl glass-card hover:scale-105 transition-transform"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--foreground-muted)' }} />
              </button>
              <span className="text-sm px-4 py-2 rounded-xl glass-card" style={{ color: 'var(--foreground-muted)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {quickActions.map((action, index) => (
                <QuickAction key={action.label} {...action} delay={index} />
              ))}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((item, index) => (
              <StatCard
                key={item.name}
                name={item.name}
                value={item.value}
                icon={item.icon}
                gradient={item.gradient}
                trend={item.trend}
                trendLabel={item.trendLabel}
                delay={index}
                loading={loading}
              />
            ))}
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Today\'s Check-ins', value: stats.todayCheckIns, icon: UserCheck, color: 'text-indigo-500' },
              { label: 'Avg Attendance', value: stats.avgAttendance, icon: Users2, color: 'text-amber-500' },
              { label: 'Completed Tasks', value: stats.completedFollowUps, icon: CheckCircle2, color: 'text-emerald-500' },
              { label: 'Engagement Score', value: `${stats.engagementScore}%`, icon: Activity, color: 'text-rose-500' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{item.label}</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    {loading ? '...' : item.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
            {/* Attendance Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    Attendance Trend
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    Last 5 services
                  </p>
                </div>
                <Link href="/reports" className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Link>
              </div>
              <div className="h-72">
                {loading ? (
                  <div className="skeleton h-full w-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceData}>
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--foreground-muted)" fontSize={12} />
                      <YAxis stroke="var(--foreground-muted)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="attendance"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorAttendance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Giving Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    Giving Overview
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    Last 7 days
                  </p>
                </div>
                <Link href="/reports" className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Link>
              </div>
              <div className="h-72">
                {loading ? (
                  <div className="skeleton h-full w-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={givingData}>
                      <defs>
                        <linearGradient id="colorGiving" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--foreground-muted)" fontSize={12} />
                      <YAxis stroke="var(--foreground-muted)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                        }}
                        formatter={(value: number) => [`GH₵${value.toLocaleString()}`, 'Amount']}
                      />
                      <Bar
                        dataKey="value"
                        fill="url(#colorGiving)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  Recent Activity
                </h3>
                <Activity className="w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />
              </div>
              <div className="space-y-4">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton w-10 h-10 rounded-xl" />
                      <div className="flex-1">
                        <div className="skeleton h-4 w-3/4 mb-1" />
                        <div className="skeleton h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                          {item.title}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>
                          {item.subtitle}
                        </p>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        {item.time}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    No recent activity
                  </p>
                )}
              </div>
            </motion.div>

            {/* Upcoming Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  Upcoming Services
                </h3>
                <Link href="/services" className="text-indigo-500 hover:text-indigo-600 text-sm flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="skeleton h-20 rounded-xl" />
                  ))
                ) : upcomingServices.length > 0 ? (
                  upcomingServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                            {service.template?.name || 'Service'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                            <Calendar className="w-4 h-4" />
                            {new Date(service.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                            <Clock className="w-4 h-4 ml-2" />
                            {new Date(service.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <Link
                          href={`/services/${service.id}`}
                          className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      No upcoming services
                    </p>
                    <Link href="/services" className="text-indigo-500 text-sm hover:underline mt-2 inline-block">
                      Schedule a service
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Follow-ups by Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  Follow-ups by Type
                </h3>
                <Link href="/follow-ups" className="text-indigo-500 hover:text-indigo-600 text-sm flex items-center gap-1">
                  Manage <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="h-48">
                {loading ? (
                  <div className="skeleton h-full w-full rounded-full" />
                ) : followUpsByType.some(f => f.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={followUpsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {followUpsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      No follow-ups
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {followUpsByType.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
