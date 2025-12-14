import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    gradient?: string[];
    onPress?: () => void;
}

export function StatCard({ title, value, subtitle, icon, gradient, onPress }: StatCardProps) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const cardStyle: ViewStyle = {
        backgroundColor: colors.card,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        ...theme.shadows.medium,
    };

    const content = (
        <>
            <View style={styles.cardHeader}>
                {icon && (
                    <View style={[
                        styles.iconContainer,
                        gradient ? {} : { backgroundColor: colors.primaryLight + '20' }
                    ]}>
                        {gradient ? (
                            <LinearGradient
                                colors={gradient as any}
                                style={styles.iconGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {icon}
                            </LinearGradient>
                        ) : (
                            icon
                        )}
                    </View>
                )}
            </View>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
            {subtitle && (
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
            )}
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyle}>{content}</View>;
}

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    icon?: ReactNode;
    disabled?: boolean;
    variant?: 'solid' | 'outline' | 'ghost';
}

export function PrimaryButton({ title, onPress, icon, disabled, variant = 'solid' }: PrimaryButtonProps) {
    const { theme } = useTheme();
    const colors = theme.colors;

    const buttonStyles: ViewStyle[] = [styles.button];
    const textStyles: TextStyle[] = [styles.buttonText];

    if (variant === 'solid') {
        buttonStyles.push({
            backgroundColor: colors.primary,
            ...theme.shadows.glow(colors.primary),
        });
        textStyles.push({ color: colors.textOnPrimary });
    } else if (variant === 'outline') {
        buttonStyles.push({
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: colors.primary,
        });
        textStyles.push({ color: colors.primary });
    } else {
        buttonStyles.push({ backgroundColor: 'transparent' });
        textStyles.push({ color: colors.primary });
    }

    if (disabled) {
        buttonStyles.push({ opacity: 0.5 });
    }

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            {icon && <View style={styles.buttonIcon}>{icon}</View>}
            <Text style={textStyles}>{title}</Text>
        </TouchableOpacity>
    );
}

interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
    const { theme } = useTheme();

    const cardStyle: ViewStyle = {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        ...theme.shadows.medium,
        ...style,
    };

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyle}>{children}</View>;
}

interface SectionHeaderProps {
    title: string;
    action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
    const { theme } = useTheme();
    const colors = theme.colors;

    return (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            {action && (
                <TouchableOpacity onPress={action.onPress}>
                    <Text style={[styles.sectionAction, { color: colors.primary }]}>
                        {action.label}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    iconGradient: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    cardSubtitle: {
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    sectionAction: {
        fontSize: 14,
        fontWeight: '600',
    },
});
