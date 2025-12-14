import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import {
    Bell,
    MessageSquare,
    Calendar,
    Heart,
    ArrowLeft,
    Volume2,
    Vibrate,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsScreen({ navigation }: any) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [settings, setSettings] = useState({
        pushEnabled: true,
        serviceReminders: true,
        eventReminders: true,
        givingReceipts: true,
        groupMessages: true,
        prayerRequests: false,
        sound: true,
        vibration: true,
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings({ ...settings, [key]: !settings[key] });
        // In a real app, save to backend
    };

    const SettingRow = ({ icon: Icon, iconColor, title, subtitle, settingKey }: any) => (
        <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
            <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
                <Icon size={20} color={iconColor} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
                )}
            </View>
            <Switch
                value={settings[settingKey as keyof typeof settings]}
                onValueChange={() => toggleSetting(settingKey)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[colors.error, '#dc2626']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Bell size={28} color="#fff" />
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <Text style={styles.headerSubtitle}>Manage your notification preferences</Text>
                </View>
                <View style={styles.headerDecor1} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Push Notifications */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Push Notifications</Text>
                    <SettingRow
                        icon={Bell}
                        iconColor={colors.primary}
                        title="Enable Notifications"
                        subtitle="Receive push notifications"
                        settingKey="pushEnabled"
                    />
                </View>

                {/* Notification Types */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification Types</Text>
                    <SettingRow
                        icon={Calendar}
                        iconColor="#f59e0b"
                        title="Service Reminders"
                        subtitle="Get reminded before services"
                        settingKey="serviceReminders"
                    />
                    <SettingRow
                        icon={Calendar}
                        iconColor="#3b82f6"
                        title="Event Reminders"
                        subtitle="Upcoming church events"
                        settingKey="eventReminders"
                    />
                    <SettingRow
                        icon={Heart}
                        iconColor="#10b981"
                        title="Giving Receipts"
                        subtitle="Donation confirmations"
                        settingKey="givingReceipts"
                    />
                    <SettingRow
                        icon={MessageSquare}
                        iconColor="#8b5cf6"
                        title="Group Messages"
                        subtitle="Messages from your groups"
                        settingKey="groupMessages"
                    />
                    <SettingRow
                        icon={Heart}
                        iconColor="#ec4899"
                        title="Prayer Requests"
                        subtitle="Community prayer updates"
                        settingKey="prayerRequests"
                    />
                </View>

                {/* Sound & Vibration */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Sound & Vibration</Text>
                    <SettingRow
                        icon={Volume2}
                        iconColor="#06b6d4"
                        title="Sound"
                        subtitle="Play notification sounds"
                        settingKey="sound"
                    />
                    <SettingRow
                        icon={Vibrate}
                        iconColor="#6366f1"
                        title="Vibration"
                        subtitle="Vibrate on notifications"
                        settingKey="vibration"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    backButton: {
        marginBottom: 16,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    headerDecor1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    settingIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    settingSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
});
