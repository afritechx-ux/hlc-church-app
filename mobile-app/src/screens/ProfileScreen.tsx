import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    TextInput,
    Switch,
    Image,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import { Member, EngagementScore } from '../types';
import {
    User,
    Phone,
    MapPin,
    Award,
    Edit2,
    Save,
    X,
    Moon,
    Sun,
    Bell,
    ChevronRight,
    LogOut,
    Camera,
    Shield,
    HelpCircle,
    Star,
    Flame,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }: any) {
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const colors = theme.colors;

    const [member, setMember] = useState<Member | null>(null);
    const [score, setScore] = useState<EngagementScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ phone: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchProfileData();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchProfileData = async () => {
        try {
            const meRes = await client.get('/auth/me');
            const userData = meRes.data;

            if (userData.member) {
                const memberId = userData.member.id;
                const [memberRes, scoreRes] = await Promise.all([
                    client.get(`/members/${memberId}`),
                    client.get(`/engagement/members/${memberId}`).catch(() => ({ data: null }))
                ]);
                setMember(memberRes.data);
                setScore(scoreRes.data);
                setEditForm({
                    phone: memberRes.data.phone || '',
                    address: memberRes.data.address || ''
                });
                if (memberRes.data.profilePicture) {
                    setProfileImage(memberRes.data.profilePicture);
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!member) return;
        setSaving(true);
        try {
            await client.patch(`/members/${member.id}`, {
                phone: editForm.phone,
                address: editForm.address
            });
            setMember({ ...member, phone: editForm.phone, address: editForm.address });
            setIsEditing(false);
            Alert.alert('✓ Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to update your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setUploadingImage(true);
            try {
                const imageUri = result.assets[0].uri;
                setProfileImage(imageUri);

                if (member) {
                    await client.patch(`/members/${member.id}`, {
                        profilePicture: imageUri
                    });
                    Alert.alert('✓ Success', 'Profile picture updated!');
                }
            } catch (error) {
                console.error('Failed to update profile picture', error);
                Alert.alert('Error', 'Failed to update profile picture');
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setUploadingImage(true);
            try {
                const imageUri = result.assets[0].uri;
                setProfileImage(imageUri);

                if (member) {
                    await client.patch(`/members/${member.id}`, {
                        profilePicture: imageUri
                    });
                    Alert.alert('✓ Success', 'Profile picture updated!');
                }
            } catch (error) {
                console.error('Failed to update profile picture', error);
                Alert.alert('Error', 'Failed to update profile picture');
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Update Profile Picture',
            'Choose an option',
            [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Library', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const overallScore = score
        ? Math.round((score.attendanceScore + score.servingScore + score.givingScore) / 3)
        : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Header Card */}
                <Animated.View style={[styles.headerCard, { opacity: fadeAnim }]}>
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerDecor1} />
                        <View style={styles.headerDecor2} />

                        <TouchableOpacity onPress={showImageOptions} style={styles.avatarContainer}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <User size={40} color="#fff" />
                                </View>
                            )}
                            <View style={styles.cameraButton}>
                                {uploadingImage ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Camera size={14} color="#fff" />
                                )}
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.userName}>
                            {member?.firstName || user?.firstName} {member?.lastName || user?.lastName}
                        </Text>
                        <Text style={styles.userEmail}>
                            {member?.email || user?.email}
                        </Text>

                        {/* Member Badge */}
                        <View style={styles.memberBadge}>
                            <Star size={12} color="#fbbf24" />
                            <Text style={styles.memberBadgeText}>Active Member</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Engagement Score Card */}
                {score && (
                    <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
                        <View style={styles.scoreHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Engagement Score</Text>
                            <View style={[styles.overallScoreBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Flame size={16} color={colors.primary} />
                                <Text style={[styles.overallScoreText, { color: colors.primary }]}>{overallScore}</Text>
                            </View>
                        </View>
                        <View style={styles.scoresGrid}>
                            <View style={styles.scoreItem}>
                                <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
                                    <Text style={[styles.scoreValue, { color: colors.primary }]}>
                                        {score.attendanceScore}
                                    </Text>
                                </View>
                                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Attendance</Text>
                            </View>
                            <View style={styles.scoreItem}>
                                <View style={[styles.scoreCircle, { borderColor: colors.secondary }]}>
                                    <Text style={[styles.scoreValue, { color: colors.secondary }]}>
                                        {score.servingScore}
                                    </Text>
                                </View>
                                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Serving</Text>
                            </View>
                            <View style={styles.scoreItem}>
                                <View style={[styles.scoreCircle, { borderColor: colors.success }]}>
                                    <Text style={[styles.scoreValue, { color: colors.success }]}>
                                        {score.givingScore}
                                    </Text>
                                </View>
                                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Giving</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Contact Info Section */}
                {member && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (isEditing) {
                                        setIsEditing(false);
                                        setEditForm({ phone: member.phone || '', address: member.address || '' });
                                    } else {
                                        setIsEditing(true);
                                    }
                                }}
                                style={[styles.editButton, { backgroundColor: colors.primary + '15' }]}
                            >
                                {isEditing ? (
                                    <X size={18} color={colors.primary} />
                                ) : (
                                    <Edit2 size={18} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={[styles.infoIconBg, { backgroundColor: colors.info + '15' }]}>
                                <Phone size={18} color={colors.info} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
                                        value={editForm.phone}
                                        onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                                        placeholder="Add phone number"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                ) : (
                                    <Text style={[styles.infoValue, { color: colors.text }]}>
                                        {member.phone || 'Not provided'}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={[styles.infoIconBg, { backgroundColor: colors.warning + '15' }]}>
                                <MapPin size={18} color={colors.warning} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Address</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
                                        value={editForm.address}
                                        onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                                        placeholder="Add address"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                ) : (
                                    <Text style={[styles.infoValue, { color: colors.text }]}>
                                        {member.address || 'Not provided'}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {isEditing && (
                            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={[colors.primary, colors.primaryDark]}
                                    style={styles.saveButton}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Save size={18} color="#fff" />
                                            <Text style={styles.saveButtonText}>Save Changes</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Settings Section */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
                        Preferences
                    </Text>

                    <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
                        <View style={[styles.settingIconBg, { backgroundColor: theme.isDark ? '#a78bfa20' : '#fbbf2420' }]}>
                            {theme.isDark ? (
                                <Moon size={20} color="#a78bfa" />
                            ) : (
                                <Sun size={20} color="#fbbf24" />
                            )}
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Appearance</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                {theme.isDark ? 'Dark Mode' : 'Light Mode'}
                            </Text>
                        </View>
                        <Switch
                            value={theme.isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Notifications')}>
                        <View style={[styles.settingIconBg, { backgroundColor: colors.error + '15' }]}>
                            <Bell size={20} color={colors.error} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Notifications</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Manage push notifications
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Privacy')}>
                        <View style={[styles.settingIconBg, { backgroundColor: colors.success + '15' }]}>
                            <Shield size={20} color={colors.success} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Privacy & Security</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Manage your data
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Help')}>
                        <View style={[styles.settingIconBg, { backgroundColor: colors.info + '15' }]}>
                            <HelpCircle size={20} color={colors.info} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, { color: colors.text }]}>Help & Support</Text>
                            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                                Get assistance
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.error + '10' }]}
                    onPress={() => {
                        Alert.alert('Logout', 'Are you sure you want to logout?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Logout', style: 'destructive', onPress: signOut }
                        ]);
                    }}
                >
                    <LogOut size={20} color={colors.error} />
                    <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={[styles.versionText, { color: colors.textMuted }]}>
                    Higher Life Chapel • Version 1.0.0
                </Text>
            </ScrollView>
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
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    headerCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    headerGradient: {
        alignItems: 'center',
        padding: 32,
        position: 'relative',
        overflow: 'hidden',
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
    headerDecor2: {
        position: 'absolute',
        bottom: -20,
        left: 20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 12,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    memberBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    scoreCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    scoreHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    overallScoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    overallScoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    scoresGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    scoreItem: {
        alignItems: 'center',
    },
    scoreCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    section: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    infoIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    input: {
        borderBottomWidth: 2,
        paddingVertical: 8,
        fontSize: 16,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingIconBg: {
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
        fontSize: 16,
        fontWeight: '600',
    },
    settingSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        marginBottom: 16,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
    },
});
