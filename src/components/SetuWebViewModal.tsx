import React, { useRef } from 'react';
import { Modal, SafeAreaView, TouchableOpacity, StyleSheet, View, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '../theme';

interface SetuWebViewModalProps {
    visible: boolean;
    url: string;
    onClose: () => void;
    onSuccess: (consentId: string) => void;
}

export default function SetuWebViewModal({ visible, url, onClose, onSuccess }: SetuWebViewModalProps) {
    const { colors } = useAppTheme();
    const webViewRef = useRef<WebView>(null);

    // This handles deep link redirection logic inside the WebView.
    const handleNavigationStateChange = (navState: any) => {
        // If Setu redirects to our scheme, we extract the ID
        if (navState.url.startsWith('upnumrn://') || navState.url.includes('/tabs/dashboard')) {
            // e.g., upnumrn://tabs/dashboard?id=xxxx OR .../tabs/dashboard?id=xxxx
            try {
                const queryIndex = navState.url.indexOf('?');
                if (queryIndex !== -1) {
                    const queryParams = new URLSearchParams(navState.url.substring(queryIndex));
                    const consentId = queryParams.get('id');
                    if (consentId) {
                        onSuccess(consentId);
                        onClose();
                        return;
                    }
                }
            } catch (error) {
                console.error("Error parsing redirect URL", error);
            }
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Secure Data Access</Text>
                    <View style={{ width: 40 }} />
                </View>
                
                {Platform.OS === 'web' ? (
                    <iframe 
                        src={url} 
                        style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                        title="Setu Consent"
                    />
                ) : (
                    <WebView 
                        ref={webViewRef}
                        source={{ uri: url }}
                        style={{ flex: 1 }}
                        onNavigationStateChange={handleNavigationStateChange}
                        startInLoadingState={true}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    closeBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
});
