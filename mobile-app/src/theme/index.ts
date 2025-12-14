import { useColorScheme } from 'react-native';

// Logo-based color palette
// Primary: Deep Navy Blue from logo
// Secondary: Golden Yellow from logo
// These colors reflect the Higher Life Chapel brand

// Light theme colors
export const lightColors = {
    primary: '#001F3F', // Deep Navy Blue (from logo)
    primaryDark: '#001428', // Darker Navy
    primaryLight: '#003366', // Lighter Navy
    secondary: '#FFBF00', // Golden Yellow (from logo)
    accent: '#FFD700', // Gold accent

    success: '#10b981', // Emerald 500
    warning: '#f59e0b', // Amber 500
    error: '#ef4444', // Red 500
    info: '#3b82f6', // Blue 500

    background: '#f8fafc', // Slate 50
    surface: '#ffffff',
    surfaceElevated: '#ffffff',

    text: '#0f172a', // Slate 900
    textSecondary: '#64748b', // Slate 500
    textMuted: '#94a3b8', // Slate 400
    textOnPrimary: '#ffffff',

    border: '#e2e8f0', // Slate 200
    divider: '#f1f5f9', // Slate 100
    inputBackground: '#f1f5f9', // Slate 100

    card: '#ffffff',
    cardShadow: 'rgba(0, 31, 63, 0.15)',
    tabBarBackground: '#ffffff',
};

// Dark theme colors
export const darkColors = {
    primary: '#3B82F6', // Brighter Blue for dark mode visibility
    primaryDark: '#001F3F', // Original Deep Navy
    primaryLight: '#60a5fa', // Light Blue
    secondary: '#FFBF00', // Golden Yellow (from logo)
    accent: '#FFD700', // Gold accent

    success: '#34d399', // Emerald 400
    warning: '#fbbf24', // Amber 400
    error: '#f87171', // Red 400
    info: '#60a5fa', // Blue 400

    background: '#0f172a', // Slate 900
    surface: '#1e293b', // Slate 800
    surfaceElevated: '#334155', // Slate 700

    text: '#f1f5f9', // Slate 100
    textSecondary: '#94a3b8', // Slate 400
    textMuted: '#64748b', // Slate 500
    textOnPrimary: '#ffffff',

    border: '#334155', // Slate 700
    divider: '#1e293b', // Slate 800
    inputBackground: '#1e293b', // Slate 800

    card: '#1e293b', // Slate 800
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    tabBarBackground: '#1e293b', // Slate 800
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
    m: 12,
    l: 16,
    xl: 24,
    full: 9999,
};

// Shadow system
export const shadows = {
    small: {
        shadowColor: '#001F3F',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    medium: {
        shadowColor: '#001F3F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    large: {
        shadowColor: '#001F3F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    }),
    gold: {
        shadowColor: '#FFBF00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
};

// Typography system
export const createTypography = (colors: ThemeColors) => ({
    h1: {
        fontSize: 32,
        fontWeight: 'bold' as const,
        color: colors.text,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        color: colors.text,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        color: colors.text,
        letterSpacing: -0.2,
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
    },
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
        letterSpacing: 0.5,
    },
});

// Brand gradients based on logo
export const brandGradients = {
    primary: ['#001F3F', '#003366'], // Navy gradient
    secondary: ['#FFBF00', '#FFD700'], // Gold gradient
    accent: ['#001F3F', '#FFBF00'], // Navy to Gold
    header: ['#001F3F', '#002952', '#003366'], // Rich navy gradient
    button: ['#001F3F', '#002952'], // Button gradient
    gold: ['#FFBF00', '#F5A623', '#FFD700'], // Rich gold gradient
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
