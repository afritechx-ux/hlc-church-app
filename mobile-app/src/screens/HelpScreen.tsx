import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import {
    HelpCircle,
    MessageCircle,
    Mail,
    Phone,
    FileText,
    ExternalLink,
    ArrowLeft,
    ChevronRight,
    Book,
    Video,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';

export default function HelpScreen({ navigation }: any) {
    const { theme } = useTheme();
    const colors = theme.colors;

    // Church contact numbers - fetched from backend
    const [contacts, setContacts] = useState({
        office: '+233244000000',
        pastor: '+233244000001',
        prayerLine: '+233244000002',
        email: 'support@higherlifechapel.org',
    });

    // Fetch contact info from backend
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const { data } = await client.get('/settings/contact');
                setContacts({
                    office: data.officePhone || '+233244000000',
                    pastor: data.pastorPhone || '+233244000001',
                    prayerLine: data.prayerLinePhone || '+233244000002',
                    email: data.supportEmail || 'support@higherlifechapel.org',
                });
            } catch (error) {
                console.log('Using default contacts');
            }
        };
        fetchContacts();
    }, []);

    const handleEmail = () => {
        Linking.openURL(`mailto:${contacts.email}?subject=App Support Request`);
    };

    const handlePhone = () => {
        Alert.alert(
            '📞 Call Church',
            'Select who you would like to call:',
            [
                {
                    text: '🏢 Church Office',
                    onPress: () => Linking.openURL(`tel:${contacts.office}`)
                },
                {
                    text: '👨‍💼 Pastor\'s Line',
                    onPress: () => Linking.openURL(`tel:${contacts.pastor}`)
                },
                {
                    text: '🙏 Emergency Prayer',
                    onPress: () => Linking.openURL(`tel:${contacts.prayerLine}`)
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleFAQ = (question: string, answer: string) => {
        Alert.alert(question, answer, [{ text: 'Got it!' }]);
    };

    const faqs = [
        {
            question: 'How do I check in at church?',
            answer: 'Go to the Home tab and tap "Check-In Now". Scan the QR code displayed at the church entrance to register your attendance.',
        },
        {
            question: 'How do I make a donation?',
            answer: 'Go to the Giving tab and tap "Give Now". Select a fund, enter your amount, choose a payment method, and confirm your donation.',
        },
        {
            question: 'How do I join a group?',
            answer: 'Go to the Groups screen from the Home tab. Browse available groups and tap "Join Group" on any group you\'d like to join.',
        },
        {
            question: 'How do I update my profile?',
            answer: 'Go to the Profile tab. Tap the edit icon to update your contact information. Tap your profile picture to change it.',
        },
    ];

    const MenuItem = ({ icon: Icon, iconColor, title, subtitle, onPress }: any) => (
        <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={onPress}
        >
            <View style={[styles.menuIcon, { backgroundColor: iconColor + '15' }]}>
                <Icon size={20} color={iconColor} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
                )}
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={[colors.info, '#2563eb']}
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
                    <HelpCircle size={28} color="#fff" />
                    <Text style={styles.headerTitle}>Help & Support</Text>
                    <Text style={styles.headerSubtitle}>We're here to help you</Text>
                </View>
                <View style={styles.headerDecor1} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quick Actions */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
                    <MenuItem
                        icon={Mail}
                        iconColor="#f59e0b"
                        title="Email Support"
                        subtitle="support@higherlifechapel.org"
                        onPress={handleEmail}
                    />
                    <MenuItem
                        icon={Phone}
                        iconColor="#10b981"
                        title="Call Us"
                        subtitle="Available Mon-Fri, 9am-5pm"
                        onPress={handlePhone}
                    />
                    <MenuItem
                        icon={MessageCircle}
                        iconColor="#8b5cf6"
                        title="Live Chat"
                        subtitle="Chat with our support team"
                        onPress={() => navigation.navigate('Chat')}
                    />
                </View>

                {/* FAQs */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Frequently Asked Questions
                    </Text>
                    {faqs.map((faq, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.faqItem, { borderBottomColor: colors.divider }]}
                            onPress={() => handleFAQ(faq.question, faq.answer)}
                        >
                            <View style={[styles.faqIcon, { backgroundColor: colors.primary + '15' }]}>
                                <HelpCircle size={18} color={colors.primary} />
                            </View>
                            <Text style={[styles.faqText, { color: colors.text }]}>{faq.question}</Text>
                            <ChevronRight size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Resources */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Resources</Text>
                    <MenuItem
                        icon={Book}
                        iconColor="#ec4899"
                        title="User Guide"
                        subtitle="Learn how to use the app"
                        onPress={() => Alert.alert('User Guide', 'User guide coming soon!')}
                    />
                    <MenuItem
                        icon={Video}
                        iconColor="#06b6d4"
                        title="Video Tutorials"
                        subtitle="Watch step-by-step guides"
                        onPress={() => Alert.alert('Video Tutorials', 'Video tutorials coming soon!')}
                    />
                    <MenuItem
                        icon={FileText}
                        iconColor="#6366f1"
                        title="Terms of Service"
                        subtitle="Read our terms"
                        onPress={() => Alert.alert('Terms', 'Terms of Service will open in browser')}
                    />
                    <MenuItem
                        icon={FileText}
                        iconColor="#10b981"
                        title="Privacy Policy"
                        subtitle="Your data matters to us"
                        onPress={() => Alert.alert('Privacy', 'Privacy Policy will open in browser')}
                    />
                </View>

                {/* App Version */}
                <View style={styles.versionContainer}>
                    <Text style={[styles.versionText, { color: colors.textMuted }]}>
                        Higher Life Chapel App v1.0.0
                    </Text>
                    <Text style={[styles.versionSubtext, { color: colors.textMuted }]}>
                        © 2024 Higher Life Chapel. All rights reserved.
                    </Text>
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
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    menuSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    faqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    faqIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    faqText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    versionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    versionSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
});
