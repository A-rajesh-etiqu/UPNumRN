import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Platform,
    useWindowDimensions
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAppTheme, Spacing, Shadows, Typography } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";
import apiClient from "../../../api/apiClient";

export default function ProfileScreen() {
    const { colors, isDark } = useAppTheme();
    const { user, updateUser } = useAuthStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.mobile || "");
    const [company, setCompany] = useState(user?.businessName || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const res = await apiClient.put("/users/profile", {
                userId: user.id,
                firstName,
                lastName,
                email,
                mobile: phone,
                businessName: company,
                category: user.category || null,
                city: user.city || null
            });
            if (res.data.user) {
                updateUser(res.data.user);
                if (Platform.OS === 'web') {
                    (globalThis as any).alert("Profile updated successfully!");
                } else {
                    console.log("Profile updated");
                }
            }
        } catch (err) {
            console.error(err);
            if (Platform.OS === 'web') {
                (globalThis as any).alert("Failed to update profile");
            } else {
                console.log("Failed to update profile");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.pageHeader, isDesktop && styles.pageHeaderDesktop]}>
                <View>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>Profile Settings</Text>
                    <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Manage your personal information and preferences</Text>
                </View>
                <TouchableOpacity style={[styles.saveBtnTop, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]} onPress={handleSave} disabled={isSaving}>
                    <Ionicons name="checkmark" size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
                
                {/* Left Column - Avatar & Quick Info */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flex: isDesktop ? 1 : undefined }]}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <Image 
                                source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} 
                                style={styles.avatarImg}
                            />
                            <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: colors.primary }]}>
                                <Ionicons name="camera" size={14} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.profileName, { color: colors.text }]}>{firstName} {lastName}</Text>
                        <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
                            {user?.userType === 'BUSINESS' ? 'Business Owner' : 'Personal Account'}
                        </Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.infoList}>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{phone}</Text>
                        </View>
                        {user?.userType === 'BUSINESS' && (
                            <View style={styles.infoRow}>
                                <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
                                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{company}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Right Column - Edit Form */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flex: isDesktop ? 2 : undefined }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Personal Information</Text>
                    
                    <View style={styles.formGrid}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>First Name</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderColor: colors.border, color: colors.text }]}
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Last Name</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderColor: colors.border, color: colors.text }]}
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderColor: colors.border, color: colors.text }]}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderColor: colors.border, color: colors.text }]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {user?.userType === 'BUSINESS' && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Company Name</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderColor: colors.border, color: colors.text }]}
                                value={company}
                                onChangeText={setCompany}
                            />
                        </View>
                    )}

                    <View style={{ marginTop: 24 }}>
                        <TouchableOpacity style={[styles.saveBtnBottom, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]} onPress={handleSave} disabled={isSaving}>
                            <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 80,
    },
    pageHeader: {
        marginBottom: 24,
        flexDirection: 'column',
        gap: 16,
    },
    pageHeaderDesktop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
    },
    saveBtnTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    mainLayout: {
        flexDirection: 'column',
        gap: 24,
    },
    mainLayoutDesktop: {
        flexDirection: 'row',
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        ...Shadows.md,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarImg: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 13,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 20,
    },
    infoList: {
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 14,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 24,
    },
    formGrid: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    inputGroup: {
        marginBottom: 20,
        flex: 1,
        minWidth: 200,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        fontSize: 14,
        ...Platform.select({ web: { outlineStyle: 'none' } as any }),
    },
    saveBtnBottom: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        alignSelf: 'flex-end',
    }
});
