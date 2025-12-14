import React, { useEffect, useState, useRef } from 'react';
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

export default function GivingScreen() {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [donations, setDonations] = useState<Donation[]>([]);
    const [funds, setFunds] = useState<Fund[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalGiving, setTotalGiving] = useState(0);
    const [memberId, setMemberId] = useState<string | null>(null);

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Donation modal state
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('MOBILE_MONEY');
    const [submitting, setSubmitting] = useState(false);

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
            // Always fetch funds first
            const fundsRes = await client.get('/giving/funds');
            console.log('Funds loaded:', fundsRes.data);
            setFunds(fundsRes.data || []);

            // Then get user data
            try {
                const meRes = await client.get('/auth/me');
                const userData = meRes.data;
                console.log('User data:', userData);

                if (userData.member) {
                    const id = userData.member.id;
                    setMemberId(id);
                    const res = await client.get(`/giving/donations/member/${id}`);
                    setDonations(res.data || []);

                    const total = (res.data || []).reduce((sum: number, d: Donation) => sum + Number(d.amount), 0);
                    setTotalGiving(total);
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

        setSubmitting(true);
        try {
            await client.post('/giving/donations', {
                amount: parseFloat(amount),
                fundId: selectedFund.id,
                memberId: memberId,
                method: paymentMethod,
            });

            Alert.alert('🎉 Thank You!', 'Your donation has been received. God bless you!');
            setShowDonationModal(false);
            setAmount('');
            setSelectedFund(null);
            setPaymentMethod('MOBILE_MONEY');
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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header with gradient */}
            <LinearGradient
                colors={['#10b981', '#059669', '#047857']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>My Giving</Text>
                    <View style={styles.totalContainer}>
                        <View style={styles.totalCard}>
                            <View style={styles.totalIconBg}>
                                <TrendingUp size={20} color="#10b981" />
                            </View>
                            <View>
                                <Text style={styles.totalLabel}>Total Contributions</Text>
                                <Text style={styles.totalAmount}>GHS {totalGiving.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Decorative elements */}
                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />
            </LinearGradient>

            {/* Give Now Button */}
            <TouchableOpacity
                style={styles.giveButton}
                onPress={() => setShowDonationModal(true)}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    style={styles.giveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <View style={styles.giveButtonIconBg}>
                        <Gift size={22} color="#fff" />
                    </View>
                    <Text style={styles.giveButtonText}>Give Now</Text>
                    <Plus size={20} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>

                <Animated.View style={{ opacity: fadeAnim }}>
                    {donations.length > 0 ? (
                        donations.map((donation, index) => (
                            <View
                                key={donation.id}
                                style={[styles.donationItem, { backgroundColor: colors.card }]}
                            >
                                <View style={[styles.donationIcon, { backgroundColor: colors.success + '15' }]}>
                                    <DollarSign size={22} color={colors.success} />
                                </View>
                                <View style={styles.donationDetails}>
                                    <Text style={[styles.fundName, { color: colors.text }]}>
                                        {donation.fund?.name || 'Unknown Fund'}
                                    </Text>
                                    <View style={styles.metaRow}>
                                        <Calendar size={12} color={colors.textMuted} />
                                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                            {new Date(donation.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </Text>
                                        <View style={[styles.methodBadge, { backgroundColor: colors.primary + '15' }]}>
                                            <Text style={[styles.methodText, { color: colors.primary }]}>
                                                {donation.method}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.amountContainer}>
                                    <Text style={[styles.amount, { color: colors.success }]}>
                                        +GHS {Number(donation.amount).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                            <View style={[styles.emptyIconBg, { backgroundColor: colors.primary + '15' }]}>
                                <Gift size={40} color={colors.primary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                No Donations Yet
                            </Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Tap "Give Now" to make your first donation and be a blessing!
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Donation Modal */}
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
                                                styles.fundCard,
                                                {
                                                    backgroundColor: selectedFund?.id === fund.id
                                                        ? colors.primary
                                                        : colors.inputBackground,
                                                    borderColor: selectedFund?.id === fund.id
                                                        ? colors.primary
                                                        : colors.border,
                                                },
                                            ]}
                                            onPress={() => setSelectedFund(fund)}
                                        >
                                            <Target
                                                size={20}
                                                color={selectedFund?.id === fund.id ? '#fff' : colors.primary}
                                            />
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
                                    keyboardType="decimal-pad"
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
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Method</Text>
                            <View style={styles.methodGrid}>
                                {PAYMENT_METHODS.map((method) => (
                                    <TouchableOpacity
                                        key={method.value}
                                        style={[
                                            styles.methodCard,
                                            {
                                                backgroundColor: paymentMethod === method.value
                                                    ? colors.primary + '15'
                                                    : colors.inputBackground,
                                                borderColor: paymentMethod === method.value
                                                    ? colors.primary
                                                    : colors.border,
                                            },
                                        ]}
                                        onPress={() => setPaymentMethod(method.value)}
                                    >
                                        <Text style={styles.methodIcon}>{method.icon}</Text>
                                        <Text
                                            style={[
                                                styles.methodLabel,
                                                { color: paymentMethod === method.value ? colors.primary : colors.text },
                                            ]}
                                        >
                                            {method.label}
                                        </Text>
                                        {paymentMethod === method.value && (
                                            <Check size={16} color={colors.primary} style={styles.methodCheck} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmitDonation}
                            disabled={submitting}
                            activeOpacity={0.9}
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
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'relative',
        overflow: 'hidden',
    },
    headerContent: {
        position: 'relative',
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    totalContainer: {
        alignItems: 'center',
    },
    totalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    totalIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#10b981' + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    totalLabel: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 2,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerDecor1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerDecor2: {
        position: 'absolute',
        bottom: -30,
        left: 20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    giveButton: {
        marginHorizontal: 20,
        marginTop: -25,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    giveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
    },
    giveButtonIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    giveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    donationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    donationIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    donationDetails: {
        flex: 1,
    },
    fundName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        marginLeft: 4,
        marginRight: 10,
    },
    methodBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    methodText: {
        fontSize: 10,
        fontWeight: '600',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        borderRadius: 20,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 16,
    },
    fundGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    fundCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    fundCardText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 16,
    },
    currencyPrefix: {
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        paddingVertical: 16,
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
        borderWidth: 1.5,
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: 14,
        fontWeight: '600',
    },
    methodGrid: {
        gap: 10,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    methodIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    methodLabel: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    methodCheck: {
        marginLeft: 'auto',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 14,
        marginTop: 24,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    noFundsMessage: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    noFundsText: {
        fontSize: 14,
        textAlign: 'center',
    },
});
