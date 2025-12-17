import { useColorScheme } from 'react-native';

// Logo-based color palette
// Primary: Deep Navy Blue from logo
// Secondary: Golden Yellow from logo
// These colors reflect the Higher Life Chapel brand

// Light theme colors
// Light theme colors
export const lightColors = {
    primary: '#0F2027', // Deepest Navy/Black-blue
    primaryDark: '#000000',
    primaryLight: '#203A43', // Teal-ish Navy
    secondary: '#FFD700', // Pure Gold
    accent: '#FFA500', // Orange Gold

    success: '#059669',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',

    border: '#E2E8F0',
    divider: '#F1F5F9',
    inputBackground: '#F8FAFC',

    card: '#FFFFFF',
    cardShadow: 'rgba(15, 32, 39, 0.12)',
    tabBarBackground: '#FFFFFF',
};

// Dark theme colors
export const darkColors = {
    primary: '#4F46E5', // Indigo for readability
    primaryDark: '#0F2027',
    primaryLight: '#2C5364',
    secondary: '#FFD700',
    accent: '#FFA500',

    success: '#10b981',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',

    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',

    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',

    border: '#1E293B',
    divider: '#1E293B',
    inputBackground: '#1E293B',

    card: '#1E293B',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    tabBarBackground: '#1E293B',
};

export type ThemeColors = typeof lightColors;

// Spacing system
export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

// Border radius system
export const borderRadius = {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    full: 9999,
};

// Shadow system
export const shadows = {
    small: {
        shadowColor: '#0F2027',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#0F2027',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
    },
    large: {
        shadowColor: '#0F2027',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    }),
    gold: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
};

// Typography system
export const createTypography = (colors: ThemeColors) => ({
    h1: {
        fontSize: 34,
        fontWeight: '800' as const,
        color: colors.text,
        letterSpacing: -1,
    },
    h2: {
        fontSize: 28,
        fontWeight: '700' as const,
        color: colors.text,
        letterSpacing: -0.5,
    },
    h3: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: colors.text,
        letterSpacing: -0.5,
    },
    body: {
        fontSize: 16,
        color: colors.text,
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 16,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
    button: {
        fontSize: 16,
        fontWeight: '700' as const,
        letterSpacing: 0.5,
    },
});

// Brand gradients based on logo
export const brandGradients = {
    primary: ['#0F2027', '#203A43', '#2C5364'], // "Deep Space"
    secondary: ['#FFD700', '#FDB931'], // "Macbeth Gold"
    accent: ['#0F2027', '#FFD700'], // Navy to Gold
    header: ['#0F2027', '#203A43'],
    button: ['#0F2027', '#203A43'],
    gold: ['#FDB931', '#FFD700', '#FDB931'], // Metallic Gold
};

// For backwards compatibility
export const colors = lightColors;
export const typography = createTypography(lightColors);

// Get theme based on color scheme
export const getTheme = (isDark: boolean) => {
    const themeColors = isDark ? darkColors : lightColors;
    return {
        colors: themeColors,
        spacing,
        borderRadius,
        shadows,
        typography: createTypography(themeColors),
        gradients: brandGradients,
        isDark,
    };
};

export type Theme = ReturnType<typeof getTheme>;
