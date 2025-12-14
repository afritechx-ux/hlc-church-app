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
import { useAuth } from '../context/AuthContext';
import {
    Shield,
    Eye,
    Lock,
    Fingerprint,
    Trash2,
    ArrowLeft,
    ChevronRight,
    Download,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivacyScreen({ navigation }: any) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { signOut } = useAuth();

    const [settings, setSettings] = useState({
        profileVisible: true,
        showActivity: true,
        biometricEnabled: false,
    });

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Info', 'Please contact church admin to delete your account.');
                    },
                },
            ]
        );
    };

    const handleExportData = () => {
        Alert.alert(
            'Export Data',
            'Your data export request has been submitted. You will receive an email with your data within 48 hours.',
            [{ text: 'OK' }]
        );
    };

    const handleChangePassword = () => {
        Alert.alert(
            'Change Password',
            'A password reset link will be sent to your email.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Link',
                    onPress: () => {
                        Alert.alert('Success', 'Password reset link sent to your email');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[colors.success, '#059669']}
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
                    <Shield size={28} color="#fff" />
                    <Text style={styles.headerTitle}>Privacy & Security</Text>
                    <Text style={styles.headerSubtitle}>Manage your account security</Text>
                </View>
                <View style={styles.headerDecor1} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Privacy Settings */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy</Text>

                    <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
                        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Eye size={20} color={colors.primary} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Profile Visible</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Others can see your profile
                            </Text>
                        </View>
                        <Switch
                            value={settings.profileVisible}
                            onValueChange={() => toggleSetting('profileVisible')}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>

                    <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
                        <View style={[styles.settingIcon, { backgroundColor: '#8b5cf6' + '15' }]}>
                            <Eye size={20} color="#8b5cf6" />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Show Activity</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Show attendance on profile
                            </Text>
                        </View>
                        <Switch
                            value={settings.showActivity}
                            onValueChange={() => toggleSetting('showActivity')}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Security Settings */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>

                    <TouchableOpacity
                        style={[styles.actionRow, { borderBottomColor: colors.divider }]}
                        onPress={handleChangePassword}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: '#f59e0b' + '15' }]}>
                            <Lock size={20} color="#f59e0b" />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Change Password</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Update your password
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
                        <View style={[styles.settingIcon, { backgroundColor: '#10b981' + '15' }]}>
                            <Fingerprint size={20} color="#10b981" />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Biometric Login</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Use fingerprint or face
                            </Text>
                        </View>
                        <Switch
                            value={settings.biometricEnabled}
                            onValueChange={() => toggleSetting('biometricEnabled')}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Data & Account */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Data & Account</Text>

                    <TouchableOpacity
                        style={[styles.actionRow, { borderBottomColor: colors.divider }]}
                        onPress={handleExportData}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: '#3b82f6' + '15' }]}>
                            <Download size={20} color="#3b82f6" />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Export My Data</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Download a copy of your data
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionRow, { borderBottomWidth: 0 }]}
                        onPress={handleDeleteAccount}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: colors.error + '15' }]}>
                            <Trash2 size={20} color={colors.error} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.error }]}>Delete Account</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Permanently delete your account
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>
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
    actionRow: {
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
