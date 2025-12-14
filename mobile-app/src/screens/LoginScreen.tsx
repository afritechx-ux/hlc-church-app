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
    Animated,
    Dimensions,
    Image,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ChevronRight, Eye, EyeOff, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Logo-based premium color scheme
// Primary: Deep Navy Blue from logo
// Secondary: Golden Yellow from logo
const PREMIUM_COLORS = {
    gradient1: ['#001F3F', '#003366'], // Navy gradient
    gradient2: ['#FFBF00', '#FFD700'], // Gold gradient
    gradient3: ['#001F3F', '#FFBF00'], // Navy to Gold
    primaryGradient: ['#001F3F', '#002952', '#003366'], // Rich navy gradient
    goldGradient: ['#FFBF00', '#F5A623', '#FFD700'], // Rich gold gradient
    glass: 'rgba(255, 255, 255, 0.15)',
    glassBorder: 'rgba(255, 255, 255, 0.25)',
};

export default function LoginScreen({ navigation }: any) {
    const { signIn, isLoading } = useAuth();
    const { theme } = useTheme();
    const colors = theme.colors;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoRotate = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(100)).current;
    const decorAnim1 = useRef(new Animated.Value(0)).current;
    const decorAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Staggered entrance animations
        Animated.sequence([
            // First: fade in background decorations
            Animated.parallel([
                Animated.timing(decorAnim1, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(decorAnim2, {
                    toValue: 1,
                    duration: 1000,
                    delay: 200,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Logo animation
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 40,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(logoRotate, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Content animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: 200,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 10,
                useNativeDriver: true,
            }),
            Animated.spring(formSlide, {
                toValue: 0,
                tension: 40,
                friction: 10,
                delay: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setError('');
        try {
            await signIn(email, password);
        } catch (e: any) {
            const message = e.response?.data?.message || e.message || 'Login failed';
            setError(message);
        }
    };

    const logoRotation = logoRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Animated Background */}
            <LinearGradient
                colors={theme.isDark
                    ? ['#0f172a', '#1e1b4b', '#312e81']
                    : ['#f8fafc', '#e0e7ff', '#c7d2fe']
                }
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative Elements */}
            <Animated.View
                style={[
                    styles.decorCircle1,
                    {
                        opacity: decorAnim1,
                        transform: [
                            { scale: decorAnim1 },
                            {
                                translateX: decorAnim1.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-50, 0],
                                })
                            },
                        ],
                    },
                ]}
            >
                <LinearGradient
                    colors={PREMIUM_COLORS.gradient1}
                    style={styles.decorGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.decorCircle2,
                    {
                        opacity: decorAnim2,
                        transform: [{ scale: decorAnim2 }],
                    },
                ]}
            >
                <LinearGradient
                    colors={PREMIUM_COLORS.gradient2}
                    style={styles.decorGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.decorCircle3,
                    {
                        opacity: decorAnim1,
                        transform: [{ scale: decorAnim1 }],
                    },
                ]}
            >
                <LinearGradient
                    colors={PREMIUM_COLORS.gradient3}
                    style={styles.decorGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo & Header */}
                        <Animated.View
                            style={[
                                styles.header,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.logoWrapper,
                                    {
                                        transform: [
                                            { scale: logoScale },
                                        ],
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={PREMIUM_COLORS.primaryGradient}
                                    style={styles.logoGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.logoInner}>
                                        <Image
                                            source={require('../../assets/icon.png')}
                                            style={styles.logoImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </LinearGradient>
                                {/* Glow effect */}
                                <View style={styles.logoGlow} />
                            </Animated.View>

                            <View style={styles.titleContainer}>
                                <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                                    Welcome to
                                </Text>
                                <Text style={[styles.title, { color: colors.text }]}>
                                    Higher Life Chapel
                                </Text>
                                <View style={styles.subtitleRow}>
                                    <Sparkles size={16} color={colors.primary} />
                                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                        Connect • Grow • Serve
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Form Card */}
                        <Animated.View
                            style={[
                                styles.formCard,
                                {
                                    backgroundColor: theme.isDark
                                        ? 'rgba(30, 41, 59, 0.8)'
                                        : 'rgba(255, 255, 255, 0.9)',
                                    borderColor: theme.isDark
                                        ? 'rgba(99, 102, 241, 0.2)'
                                        : 'rgba(99, 102, 241, 0.1)',
                                    transform: [{ translateY: formSlide }],
                                    opacity: fadeAnim,
                                },
                            ]}
                        >
                            <Text style={[styles.formTitle, { color: colors.text }]}>
                                Sign In
                            </Text>

                            {/* Email Input */}
                            <View
                                style={[
                                    styles.inputContainer,
                                    {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: isFocused === 'email' ? colors.primary : 'transparent',
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={isFocused === 'email'
                                        ? PREMIUM_COLORS.primaryGradient
                                        : [colors.primary + '20', colors.primary + '20']
                                    }
                                    style={styles.inputIcon}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Mail size={18} color={isFocused === 'email' ? '#fff' : colors.primary} />
                                </LinearGradient>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Email address"
                                    placeholderTextColor={colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onFocus={() => setIsFocused('email')}
                                    onBlur={() => setIsFocused(null)}
                                />
                            </View>

                            {/* Password Input */}
                            <View
                                style={[
                                    styles.inputContainer,
                                    {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: isFocused === 'password' ? colors.primary : 'transparent',
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={isFocused === 'password'
                                        ? PREMIUM_COLORS.primaryGradient
                                        : [colors.primary + '20', colors.primary + '20']
                                    }
                                    style={styles.inputIcon}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Lock size={18} color={isFocused === 'password' ? '#fff' : colors.primary} />
                                </LinearGradient>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Password"
                                    placeholderTextColor={colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setIsFocused('password')}
                                    onBlur={() => setIsFocused(null)}
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

                            {/* Forgot Password */}
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>

                            {/* Error Message */}
                            {error ? (
                                <Animated.View
                                    style={[
                                        styles.errorContainer,
                                        { backgroundColor: colors.error + '15' }
                                    ]}
                                >
                                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                                </Animated.View>
                            ) : null}

                            {/* Login Button */}
                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.9}
                                style={styles.loginButtonWrapper}
                            >
                                <LinearGradient
                                    colors={PREMIUM_COLORS.primaryGradient}
                                    style={styles.loginButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.loginButtonText}>Sign In</Text>
                                            <View style={styles.buttonArrow}>
                                                <ChevronRight size={20} color="#fff" />
                                            </View>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.divider}>
                                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
                                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                            </View>

                            {/* Register Link */}
                            <TouchableOpacity
                                style={[styles.registerButton, { borderColor: colors.border }]}
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={[styles.registerButtonText, { color: colors.text }]}>
                                    Create New Account
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Footer */}
                        <Animated.View
                            style={[
                                styles.footer,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <Text style={[styles.footerText, { color: colors.textMuted }]}>
                                Higher Life Chapel Assembly of God
                            </Text>
                            <Text style={[styles.footerVersion, { color: colors.textMuted }]}>
                                Version 1.0.0
                            </Text>
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
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingTop: 40,
    },

    // Decorative Elements
    decorCircle1: {
        position: 'absolute',
        top: -80,
        right: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
        overflow: 'hidden',
        opacity: 0.6,
    },
    decorCircle2: {
        position: 'absolute',
        bottom: 100,
        left: -100,
        width: 200,
        height: 200,
        borderRadius: 100,
        overflow: 'hidden',
        opacity: 0.5,
    },
    decorCircle3: {
        position: 'absolute',
        top: height * 0.4,
        right: -50,
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        opacity: 0.4,
    },
    decorGradient: {
        flex: 1,
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoWrapper: {
        marginBottom: 24,
        position: 'relative',
    },
    logoGradient: {
        width: 110,
        height: 110,
        borderRadius: 32,
        padding: 4,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 20,
    },
    logoInner: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: 80,
        height: 80,
    },
    logoGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 40,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        zIndex: -1,
    },
    titleContainer: {
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },

    // Form Card
    formCard: {
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
        elevation: 20,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 2,
        paddingHorizontal: 6,
        height: 60,
        marginBottom: 16,
    },
    inputIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    eyeButton: {
        padding: 10,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '600',
    },
    errorContainer: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    loginButtonWrapper: {
        marginBottom: 20,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 58,
        borderRadius: 16,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    buttonArrow: {
        marginLeft: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 13,
        fontWeight: '500',
    },
    registerButton: {
        height: 54,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Footer
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        fontWeight: '500',
    },
    footerVersion: {
        fontSize: 11,
        marginTop: 4,
    },
});
