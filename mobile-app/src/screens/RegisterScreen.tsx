import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Phone, ChevronRight, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import client from '../api/client';

export default function RegisterScreen({ navigation }: any) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRegister = async () => {
        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            setError('Please fill in all required fields');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await client.post('/auth/local/signup', {
                email: form.email,
                password: form.password,
            });

            Alert.alert(
                '🎉 Welcome!',
                'Your account has been created. Please login with your credentials.',
                [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
            );
        } catch (e: any) {
            const message = e.response?.data?.message || e.message || 'Registration failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.primary + '20', 'transparent']}
                style={styles.bgGradient}
            />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Back Button */}
                        <TouchableOpacity
                            style={[styles.backButton, { backgroundColor: colors.inputBackground }]}
                            onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft size={22} color={colors.text} />
                        </TouchableOpacity>

                        {/* Header */}
                        <Animated.View
                            style={[
                                styles.header,
                                { opacity: fadeAnim },
                            ]}
                        >
                            <LinearGradient
                                colors={['#10b981', '#059669', '#047857']}
                                style={styles.logoContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <User size={32} color="#fff" />
                            </LinearGradient>
                            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Join Higher Life Chapel community
                            </Text>
                        </Animated.View>

                        {/* Form */}
                        <Animated.View
                            style={[
                                styles.form,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            {/* Name Row */}
                            <View style={styles.nameRow}>
                                <View style={[styles.inputContainer, styles.halfInput, {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.border
                                }]}>
                                    <View style={[styles.inputIcon, { backgroundColor: colors.primary + '15' }]}>
                                        <User size={16} color={colors.primary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="First Name"
                                        placeholderTextColor={colors.textMuted}
                                        value={form.firstName}
                                        onChangeText={(text) => setForm({ ...form, firstName: text })}
                                    />
                                </View>
                                <View style={[styles.inputContainer, styles.halfInput, {
                                    backgroundColor: colors.inputBackground,
                                    borderColor: colors.border
                                }]}>
                                    <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '15' }]}>
                                        <User size={16} color={colors.secondary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="Last Name"
                                        placeholderTextColor={colors.textMuted}
                                        value={form.lastName}
                                        onChangeText={(text) => setForm({ ...form, lastName: text })}
                                    />
                                </View>
                            </View>

                            {/* Email Input */}
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border
                            }]}>
                                <View style={[styles.inputIcon, { backgroundColor: colors.info + '15' }]}>
                                    <Mail size={18} color={colors.info} />
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Email address"
                                    placeholderTextColor={colors.textMuted}
                                    value={form.email}
                                    onChangeText={(text) => setForm({ ...form, email: text })}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Phone Input */}
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border
                            }]}>
                                <View style={[styles.inputIcon, { backgroundColor: colors.warning + '15' }]}>
                                    <Phone size={18} color={colors.warning} />
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Phone (optional)"
                                    placeholderTextColor={colors.textMuted}
                                    value={form.phone}
                                    onChangeText={(text) => setForm({ ...form, phone: text })}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Password Input */}
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border
                            }]}>
                                <View style={[styles.inputIcon, { backgroundColor: colors.error + '15' }]}>
                                    <Lock size={18} color={colors.error} />
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Password"
                                    placeholderTextColor={colors.textMuted}
                                    value={form.password}
                                    onChangeText={(text) => setForm({ ...form, password: text })}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeButton}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={colors.textMuted} />
                                    ) : (
                                        <Eye size={20} color={colors.textMuted} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password Input */}
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.border
                            }]}>
                                <View style={[styles.inputIcon, { backgroundColor: colors.success + '15' }]}>
                                    <Lock size={18} color={colors.success} />
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Confirm Password"
                                    placeholderTextColor={colors.textMuted}
                                    value={form.confirmPassword}
                                    onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                                    secureTextEntry={!showPassword}
                                />
                            </View>

                            {/* Error Message */}
                            {error ? (
                                <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
                                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Register Button */}
                            <TouchableOpacity
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#10b981', '#059669']}
                                    style={styles.registerButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.registerButtonText}>Create Account</Text>
                                            <ChevronRight size={20} color="#fff" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Login Link */}
                            <View style={styles.loginLink}>
                                <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
                                    Already have an account?{' '}
                                </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={[styles.loginLinkAction, { color: colors.primary }]}>
                                        Sign In
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 400,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    backButton: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 70,
        height: 70,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
    },
    form: {
        gap: 14,
    },
    nameRow: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 6,
        height: 58,
    },
    inputIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    eyeButton: {
        padding: 10,
    },
    errorContainer: {
        padding: 14,
        borderRadius: 12,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 58,
        borderRadius: 16,
        marginTop: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginLinkText: {
        fontSize: 15,
    },
    loginLinkAction: {
        fontSize: 15,
        fontWeight: '700',
    },
});
