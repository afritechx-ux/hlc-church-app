import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Modal,
    TextInput,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import { Donation } from '../types';
import {
    DollarSign,
    Calendar,
    CreditCard,
    Plus,
    X,
    Check,
    TrendingUp,
    Target,
    Gift,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GivingChart from '../components/giving/GivingChart';

const { width } = Dimensions.get('window');

interface Fund {
    id: string;
    name: string;
    description?: string;
    goal?: number;
}

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash', icon: '💵' },
    { value: 'CARD', label: 'Card', icon: '💳' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: '📱' },
    { value: 'ONLINE', label: 'Online', icon: '🌐' },
];

interface PaymentConfig {
    id: string;
    type: string;
    provider: string;
    accountName: string;
    accountNumber: string;
    description?: string;
    isActive: boolean;
}

export default function GivingScreen() {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [donations, setDonations] = useState<Donation[]>([]);
    const [funds, setFunds] = useState<Fund[]>([]);
    const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalGiving, setTotalGiving] = useState(0);
    const [memberId, setMemberId] = useState<string | null>(null);

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const chartData = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return d.toLocaleString('default', { month: 'short' });
        });

        const data = last6Months.map(month => ({ label: month, value: 0 }));

        donations.forEach(d => {
            // @ts-ignore - Handle both potential field names
            const dateStr = d.date || d.createdAt;
            if (!dateStr) return;

            const date = new Date(dateStr);
            const month = date.toLocaleString('default', { month: 'short' });
            const found = data.find(item => item.label === month);
            if (found) {
                // @ts-ignore - Assuming amount exists
                found.value += Number(d.amount);
            }
        });

        return data;
    }, [donations]);

    // Donation modal state
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // History and Pledges modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showPledgesModal, setShowPledgesModal] = useState(false);

    useEffect(() => {
        fetchData();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchData = async () => {
        try {
            // Always fetch funds and payment configs first
            const fundsRes = await client.get('/giving/funds');
            const configsRes = await client.get('/giving/payment-configs');
            console.log('Funds loaded:', fundsRes.data);
            setFunds(fundsRes.data || []);
            setPaymentConfigs(configsRes.data || []);

            // Set default payment method if available
            if (configsRes.data && configsRes.data.length > 0) {
                setPaymentMethod(configsRes.data[0].id);
            }

            // Then get user data
            try {
                const meRes = await client.get('/auth/me');
                const userData = meRes.data;
                console.log('User data received:', JSON.stringify(userData, null, 2));

                if (userData.member) {
                    const id = userData.member.id;
                    console.log('Member ID found:', id);
                    setMemberId(id);

                    console.log('Fetching donations for member:', id);
                    const res = await client.get(`/giving/donations/member/${id}`);
                    console.log('Donations received:', res.data?.length || 0, 'records');
                    setDonations(res.data || []);

                    const total = (res.data || []).reduce((sum: number, d: Donation) => sum + Number(d.amount), 0);
                    setTotalGiving(total);
                } else {
                    console.warn('WARNING: User has no member profile linked!');
                    console.log('User object:', userData);
                }
            } catch (userError) {
                console.log('User data error (non-critical):', userError);
            }
        } catch (error) {
            console.error('Failed to fetch funds', error);
            Alert.alert('Error', 'Failed to load giving data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitDonation = async () => {
        if (!selectedFund) {
            Alert.alert('Error', 'Please select a fund');
            return;
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        // Check if member profile exists
        if (!memberId) {
            Alert.alert(
                'Profile Required',
                'Your account is not linked to a member profile. Please contact the church admin to link your account.',
                [{ text: 'OK' }]
            );
            return;
        }

        const selectedConfig = paymentConfigs.find(c => c.id === paymentMethod);
        const methodToSend = selectedConfig ? selectedConfig.type : 'OTHER';

        setSubmitting(true);

        const donationData = {
            amount: parseFloat(amount),
            fundId: selectedFund.id,
            memberId: memberId,
            method: methodToSend,
        };
        console.log('Submitting donation:', donationData);

        try {
            await client.post('/giving/donations', donationData);

            Alert.alert('🎉 Thank You!', 'Your donation has been received. God bless you!');
            setShowDonationModal(false);
            setAmount('');
            setSelectedFund(null);
            // Reset to first available if any
            if (paymentConfigs.length > 0) {
                setPaymentMethod(paymentConfigs[0].id);
            }
            fetchData();
        } catch (error) {
            console.error('Failed to submit donation', error);
            Alert.alert('Error', 'Failed to submit donation. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            {/* Header / Giving Card */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <LinearGradient
                    colors={theme.gradients.primary}
                    style={styles.heroSection}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>My Kingdom Investments</Text>
                        <TouchableOpacity style={styles.historyBtn}>
                            <Calendar size={20} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>

                    {/* Premium Glass Card */}
                    <View style={styles.totalCard}>
                        <View style={styles.cardPattern} />
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <View style={styles.chip} />
                                <TrendingUp size={24} color="#fff" style={{ opacity: 0.8 }} />
                            </View>
                            <View>
                                <Text style={styles.cardLabel}>TOTAL CONTRIBUTIONS</Text>
                                <Text style={styles.cardAmount}>GHS {totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={styles.cardFooter}>
                                <Text style={styles.cardMemberName}>Faith Partner</Text>
                                <Text style={styles.cardExp}>**** 2025</Text>
                            </View>
                        </View>
                    </View>

                    {/* Chart Container */}
                    <View style={styles.chartSection}>
                        <Text style={styles.chartTitle}>Giving Trend (Last 6 Months)</Text>
                        {/* Placeholder for Chart - Passing mock data for now if real data is scarce */}
                        {/* <GivingChart data={mockData} color="#fff" /> */}
                        <GivingChart data={chartData} color="#fff" />
                    </View>
                </LinearGradient>

                {/* Quick Actions - Floating Overlap */}
                <View style={[styles.quickActions, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setShowDonationModal(true)}
                    >
                        <LinearGradient
                            colors={['#6366f1', '#4f46e5']}
                            style={styles.actionIcon}
                        >
                            <Plus size={24} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Give Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPledgesModal(true)}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Target size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Pledges</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowHistoryModal(true)}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.success + '15' }]}>
                            <Gift size={24} color={colors.success} />
                        </View>
                        <Text style={[styles.actionLabel, { color: colors.text }]}>History</Text>
                    </TouchableOpacity>
                </View>

                {/* Funds Progress Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>Fund Goals</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
                        {funds.map((fund) => {
                            const fundDonations = donations.filter(d => d.fund?.id === fund.id);
                            const raised = fundDonations.reduce((sum, d) => sum + Number(d.amount), 0);
                            const progress = fund.goal ? raised / fund.goal : 0;
                            return (
                                <View key={fund.id} style={[styles.fundCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={styles.fundHeader}>
                                        <Text style={[styles.fundName, { color: colors.text }]}>{fund.name}</Text>
                                        <View style={[styles.fundBadge, { backgroundColor: colors.primary + '15' }]}>
                                            <Text style={[styles.fundBadgeText, { color: colors.primary }]}>Active</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.fundDesc} numberOfLines={2}>{fund.description || 'Supporting the vision.'}</Text>

                                    {fund.goal ? (
                                        <View style={styles.progressContainer}>
                                            <View style={styles.progressBarBg}>
                                                <View style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.primary }]} />
                                            </View>
                                            <View style={styles.progressLabels}>
                                                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                                                    {(progress * 100).toFixed(0)}%
                                                </Text>
                                                <Text style={[styles.progressText, { color: colors.text }]}>
                                                    Target: GHS {fund.goal.toLocaleString()}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <Text style={[styles.noGoalText, { color: colors.textMuted }]}>Open Donation Fund</Text>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.text, paddingHorizontal: 20 }]}>Recent Giving</Text>
                    <View style={{ paddingHorizontal: 20 }}>
                        {donations.length > 0 ? (
                            donations.slice(0, 5).map((donation) => (
                                <View key={donation.id} style={[styles.txnRow, { backgroundColor: colors.surface }]}>
                                    <View style={[styles.txnIcon, { backgroundColor: colors.success + '15' }]}>
                                        <DollarSign size={20} color={colors.success} />
                                    </View>
                                    <View style={styles.txnContent}>
                                        <Text style={[styles.txnTitle, { color: colors.text }]}>{donation.fund?.name}</Text>
                                        <Text style={[styles.txnDate, { color: colors.textSecondary }]}>
                                            {new Date(donation.date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.txnAmount, { color: colors.success }]}>
                                        +GHS {Number(donation.amount).toFixed(2)}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No records found.</Text>
                        )}
                    </View>
                </View>

            </ScrollView>

            {/* Modal */}
            <Modal
                visible={showDonationModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDonationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Make a Donation</Text>
                            <TouchableOpacity
                                onPress={() => setShowDonationModal(false)}
                                style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Fund Selection */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Select Fund</Text>
                            {funds.length === 0 ? (
                                <View style={[styles.noFundsMessage, { backgroundColor: colors.warning + '15' }]}>
                                    <Text style={[styles.noFundsText, { color: colors.warning }]}>
                                        No funds available. Please contact church admin.
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.fundGrid}>
                                    {funds.map((fund) => (
                                        <TouchableOpacity
                                            key={fund.id}
                                            style={[
                                                styles.fundCardSelect,
                                                {
                                                    backgroundColor: selectedFund?.id === fund.id
                                                        ? colors.primary
                                                        : colors.inputBackground,
                                                },
                                            ]}
                                            onPress={() => setSelectedFund(fund)}
                                        >
                                            <Text
                                                style={[
                                                    styles.fundCardText,
                                                    { color: selectedFund?.id === fund.id ? '#fff' : colors.text },
                                                ]}
                                            >
                                                {fund.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Amount Input */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Amount (GHS)</Text>
                            <View style={[styles.amountInputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                                <Text style={[styles.currencyPrefix, { color: colors.textMuted }]}>GHS</Text>
                                <TextInput
                                    style={[styles.amountInput, { color: colors.text }]}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>

                            {/* Quick Amounts */}
                            <View style={styles.quickAmounts}>
                                {[50, 100, 200, 500].map((amt) => (
                                    <TouchableOpacity
                                        key={amt}
                                        style={[
                                            styles.quickAmountBtn,
                                            {
                                                backgroundColor: amount === amt.toString()
                                                    ? colors.primary + '20'
                                                    : colors.inputBackground,
                                                borderColor: amount === amt.toString()
                                                    ? colors.primary
                                                    : colors.border,
                                            },
                                        ]}
                                        onPress={() => setAmount(amt.toString())}
                                    >
                                        <Text
                                            style={[
                                                styles.quickAmountText,
                                                { color: amount === amt.toString() ? colors.primary : colors.text },
                                            ]}
                                        >
                                            {amt}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Payment Method */}
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Channel</Text>
                            {paymentConfigs.length === 0 ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: colors.textSecondary }}>Loading payment methods...</Text>
                                </View>
                            ) : (
                                <View style={styles.methodGrid}>
                                    {paymentConfigs.map((config) => (
                                        <TouchableOpacity
                                            key={config.id}
                                            style={[
                                                styles.methodCard,
                                                {
                                                    backgroundColor: paymentMethod === config.id
                                                        ? colors.primary + '15'
                                                        : colors.inputBackground,
                                                    borderColor: paymentMethod === config.id
                                                        ? colors.primary
                                                        : colors.border,
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                },
                                            ]}
                                            onPress={() => setPaymentMethod(config.id)}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: paymentMethod === config.id ? 8 : 0 }}>
                                                <Text style={styles.methodIcon}>
                                                    {config.type === 'MOBILE_MONEY' ? '📱' :
                                                        config.type === 'BANK_TRANSFER' ? '🏦' :
                                                            config.type === 'USSD' ? '🔢' : '💳'}
                                                </Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={[
                                                            styles.methodLabel,
                                                            { color: paymentMethod === config.id ? colors.primary : colors.text },
                                                        ]}
                                                    >
                                                        {config.provider}
                                                    </Text>
                                                    <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: 'PlusJakartaSans-Regular' }}>
                                                        {config.type.replace('_', ' ')}
                                                    </Text>
                                                </View>
                                                {paymentMethod === config.id && (
                                                    <Check size={16} color={colors.primary} style={styles.methodCheck} />
                                                )}
                                            </View>

                                            {paymentMethod === config.id && (
                                                <View style={{ width: '100%', padding: 12, backgroundColor: colors.background, borderRadius: 8, marginTop: 4 }}>
                                                    <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>ACCOUNT DETAILS</Text>
                                                    <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans-Bold', color: colors.text }}>
                                                        {config.accountNumber}
                                                    </Text>
                                                    <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary }}>
                                                        {config.accountName}
                                                    </Text>
                                                    {config.description && (
                                                        <Text style={{ fontSize: 12, color: colors.primary, marginTop: 8, fontFamily: 'PlusJakartaSans-Medium' }}>
                                                            Instruction: {config.description}
                                                        </Text>
                                                    )}
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmitDonation}
                            disabled={submitting}
                            activeOpacity={0.9}
                            style={{ marginTop: 20 }}
                        >
                            <LinearGradient
                                colors={['#10b981', '#059669']}
                                style={styles.submitButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Gift size={20} color="#fff" />
                                        <Text style={styles.submitButtonText}>Donate Now</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* History Modal */}
            <Modal
                visible={showHistoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Giving History</Text>
                            <TouchableOpacity
                                onPress={() => setShowHistoryModal(false)}
                                style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {donations.length > 0 ? (
                                donations.map((donation) => (
                                    <View key={donation.id} style={[styles.historyRow, { backgroundColor: colors.inputBackground }]}>
                                        <View style={[styles.historyIcon, { backgroundColor: colors.success + '15' }]}>
                                            <DollarSign size={18} color={colors.success} />
                                        </View>
                                        <View style={styles.historyContent}>
                                            <Text style={[styles.historyTitle, { color: colors.text }]}>{donation.fund?.name || 'General'}</Text>
                                            <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                                                {new Date(donation.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                            <Text style={[styles.historyMethod, { color: colors.textMuted }]}>
                                                {donation.method || 'N/A'}
                                            </Text>
                                        </View>
                                        <Text style={[styles.historyAmount, { color: colors.success }]}>
                                            +GHS {Number(donation.amount).toFixed(2)}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Gift size={48} color={colors.textMuted} />
                                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Giving Records</Text>
                                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                        Your giving history will appear here once you make your first donation.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {donations.length > 0 && (
                            <View style={[styles.historyTotal, { borderTopColor: colors.border }]}>
                                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Contributions</Text>
                                <Text style={[styles.totalAmount, { color: colors.primary }]}>
                                    GHS {totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Pledges Modal */}
            <Modal
                visible={showPledgesModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPledgesModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Pledges</Text>
                            <TouchableOpacity
                                onPress={() => setShowPledgesModal(false)}
                                style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.emptyState}>
                            <Target size={48} color={colors.primary} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>Coming Soon</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                                The pledges feature is currently under development. Soon you'll be able to make and track pledges for specific funds and goals.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowPledgesModal(false)}
                            style={[styles.pledgeCloseBtn, { backgroundColor: colors.primary }]}
                        >
                            <Text style={styles.pledgeCloseBtnText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroSection: {
        paddingTop: 0,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#fff',
    },
    historyBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    totalCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 24,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardPattern: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    cardContent: {
        zIndex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chip: {
        width: 50,
        height: 34,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'PlusJakartaSans-Medium',
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardAmount: {
        fontSize: 32,
        fontFamily: 'PlusJakartaSans-ExtraBold',
        color: '#fff',
        letterSpacing: -1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        alignItems: 'flex-end',
    },
    cardMemberName: {
        fontSize: 14,
        color: '#fff',
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    cardExp: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'PlusJakartaSans-Mono',
    },
    chartSection: {
        marginTop: 30,
    },
    chartTitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 10,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    chartPlaceholder: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    bar: {
        width: 8,
        borderRadius: 4,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        marginHorizontal: 20,
        marginTop: -30,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 24,
    },
    actionBtn: {
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    fundCard: {
        width: 280,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 0,
    },
    fundHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    fundName: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    fundBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    fundBadgeText: {
        fontSize: 10,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    fundDesc: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 16,
        lineHeight: 18,
    },
    progressContainer: {
        gap: 6,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    noGoalText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    txnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    txnIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    txnContent: {
        flex: 1,
    },
    txnTitle: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-SemiBold',
        marginBottom: 2,
    },
    txnDate: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    txnAmount: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '85%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        marginBottom: 10,
        marginTop: 16,
    },
    fundGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    fundCardSelect: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    fundCardText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
    },
    currencyPrefix: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontFamily: 'PlusJakartaSans-Bold',
        paddingVertical: 14,
    },
    quickAmounts: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    quickAmountBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    methodGrid: {
        gap: 10,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    methodIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    methodLabel: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    methodCheck: {
        marginLeft: 'auto',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    noFundsMessage: { padding: 16, borderRadius: 12 },
    noFundsText: { textAlign: 'center' },
    // History modal styles
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
    },
    historyIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-SemiBold',
    },
    historyDate: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Regular',
        marginTop: 2,
    },
    historyMethod: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans-Regular',
        marginTop: 2,
    },
    historyAmount: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    historyTotal: {
        borderTopWidth: 1,
        paddingTop: 16,
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    totalAmount: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    // Empty state styles
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Regular',
        marginTop: 8,
        lineHeight: 20,
    },
    // Pledges modal styles
    pledgeCloseBtn: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    pledgeCloseBtnText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
    },
});

