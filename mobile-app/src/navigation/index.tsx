import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import QRScanScreen from '../screens/QRScanScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GivingScreen from '../screens/GivingScreen';
import GroupsScreen from '../screens/GroupsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import HelpScreen from '../screens/HelpScreen';
import ChatScreen from '../screens/ChatScreen';
import DirectMessagesScreen from '../screens/DirectMessagesScreen';
import DirectChatScreen from '../screens/DirectChatScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import InboxScreen from '../screens/InboxScreen';
import { Home, History, User, DollarSign, Mail } from 'lucide-react-native';
import { ActivityIndicator, View, Platform } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
    const { theme } = useTheme();
    const colors = theme.colors;
    const insets = useSafeAreaInsets(); // Get safe area insets

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.secondary, // Gold for active
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
                tabBarStyle: {
                    backgroundColor: '#0F2027', // Deep Navy background
                    borderTopWidth: 0,
                    height: 60 + insets.bottom, // Dynamic height based on content + safe area
                    paddingTop: 10,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10, // Dynamic padding
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarBackground: () => (
                    <View style={{ flex: 1, backgroundColor: '#0F2027' }} />
                ),
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={{
                            backgroundColor: focused ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <Home color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Inbox"
                component={InboxScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={{
                            backgroundColor: focused ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <Mail color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={{
                            backgroundColor: focused ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <History color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Giving"
                component={GivingScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={{
                            backgroundColor: focused ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <DollarSign color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={{
                            backgroundColor: focused ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
                            padding: 8,
                            borderRadius: 12,
                        }}>
                            <User color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function Navigation() {
    const { user, isLoading } = useAuth();
    const { theme } = useTheme();
    const colors = theme.colors;

    const navigationTheme = theme.isDark ? {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
        },
    } : {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
        },
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="AppTabs" component={AppTabs} />
                        <Stack.Screen name="QRScan" component={QRScanScreen} />
                        <Stack.Screen name="Groups" component={GroupsScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="Privacy" component={PrivacyScreen} />
                        <Stack.Screen name="Help" component={HelpScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="DirectMessages" component={DirectMessagesScreen} />
                        <Stack.Screen name="DirectChat" component={DirectChatScreen} />
                        <Stack.Screen name="GroupChat" component={GroupChatScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}


