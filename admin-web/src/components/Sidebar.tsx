'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    UsersRound,
    Building2,
    Home,
    Heart,
    Calendar,
    Settings,
    FileText,
    Bell,
    MessageSquare,
    MessageCircle,
    Shield,
    Headphones,
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Groups', href: '/groups', icon: UsersRound },
    { name: 'Departments', href: '/departments', icon: Building2 },
    { name: 'Households', href: '/households', icon: Home },
    { name: 'Giving', href: '/giving', icon: Heart },
    { name: 'Services', href: '/services', icon: Calendar },
    { name: 'Follow-Ups', href: '/follow-ups', icon: Bell },
    { name: 'Support Chat', href: '/support', icon: Headphones },
    { name: 'DM Oversight', href: '/dm-oversight', icon: Shield },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
];


export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar w-64 flex flex-col" style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}>
            {/* Logo */}
            <div className="p-6">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="Higher Life Chapel Assembly of God"
                        width={48}
                        height={48}
                        className="rounded-full"
                    />
                    <div>
                        <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--foreground)' }}>Higher Life Chapel</h1>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Assembly of God</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 pb-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <li key={item.name}>
                                <Link href={item.href}>
                                    <motion.div
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                        whileHover={{ x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                        {isActive && (
                                            <motion.div
                                                className="absolute right-3 w-2 h-2 rounded-full bg-white"
                                                layoutId="activeIndicator"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="glass-card p-4 text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Need Help?</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>Contact support</p>
                </div>
            </div>
        </aside>
    );
}
