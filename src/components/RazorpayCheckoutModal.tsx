import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    StatusBar,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "../theme";
import {
    RAZORPAY_CONFIG,
    DirectCheckoutOptions,
    registerRazorpayMobileHandler,
} from "../services/razorpay.service";

// Safe WebView import for web compatibility (renders nothing on web)
let WebViewComponent: any = null;
if (Platform.OS !== "web") {
    try {
        WebViewComponent = require("react-native-webview").WebView;
    } catch (e) {
        console.warn("react-native-webview could not be imported:", e);
    }
}

interface RazorpayCheckoutModalProps {
    visible?: boolean;
    options?: DirectCheckoutOptions | null;
    onClose?: () => void;
    onSuccess?: (paymentId: string) => void;
    onError?: (err: any) => void;
}

export default function RazorpayCheckoutModal(props: RazorpayCheckoutModalProps) {
    const { colors, isDark } = useAppTheme();
    const [internalVisible, setInternalVisible] = useState(false);
    const [internalOptions, setInternalOptions] = useState<DirectCheckoutOptions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const webViewRef = useRef<any>(null);

    // Register mobile checkout handler with razorpay.service
    useEffect(() => {
        if (Platform.OS === "web") return;

        const unregister = registerRazorpayMobileHandler((opts) => {
            setInternalOptions(opts);
            setInternalVisible(true);
            setIsLoading(true);
        });

        return () => {
            unregister();
        };
    }, []);

    // Support controlled mode via props as well
    const isVisible = props.visible !== undefined ? props.visible : internalVisible;
    const activeOptions = props.options !== undefined ? props.options : internalOptions;

    // Do not render anything on web
    if (Platform.OS === "web") {
        return null;
    }

    const closeModal = () => {
        setInternalVisible(false);
        setInternalOptions(null);
        setIsLoading(false);
        if (props.onClose) props.onClose();
    };

    const handleClosePress = () => {
        Alert.alert(
            "Cancel Payment?",
            "Are you sure you want to cancel the transaction?",
            [
                { text: "Continue Payment", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: () => {
                        const onClose = activeOptions?.onClose || props.onClose;
                        closeModal();
                        if (onClose) onClose();
                    },
                },
            ]
        );
    };

    const handleMessage = (event: any) => {
        try {
            const rawData = event.nativeEvent?.data;
            if (!rawData) return;

            const payload = JSON.parse(rawData);

            if (payload.type === "SUCCESS") {
                const paymentId = payload.paymentId;
                const onSuccess = activeOptions?.onSuccess || props.onSuccess;
                closeModal();
                if (paymentId && onSuccess) {
                    onSuccess(paymentId);
                } else if (activeOptions?.onError || props.onError) {
                    const onError = activeOptions?.onError || props.onError;
                    onError?.(new Error("Missing payment ID from Razorpay checkout."));
                }
            } else if (payload.type === "ERROR") {
                const onError = activeOptions?.onError || props.onError;
                closeModal();
                if (onError) {
                    onError(payload.error || new Error("Payment transaction failed."));
                }
            } else if (payload.type === "DISMISSED") {
                const onClose = activeOptions?.onClose || props.onClose;
                closeModal();
                if (onClose) onClose();
            }
        } catch (e) {
            console.error("Failed to parse Razorpay WebView message:", e);
        }
    };

    const handleShouldStartLoadWithRequest = (request: any) => {
        const url = request.url;
        if (!url) return true;

        // Standard web navigation
        if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("about:blank") ||
            url.startsWith("data:")
        ) {
            return true;
        }

        // Android Intent schemes (e.g. UPI apps)
        if (url.startsWith("intent://")) {
            try {
                const schemeMatch = url.match(/scheme=([^;]+)/);
                const scheme = schemeMatch ? schemeMatch[1] : "upi";
                const cleanUrl = url.replace(/^intent:\/\//, `${scheme}://`).split("#Intent")[0];
                Linking.canOpenURL(cleanUrl)
                    .then((supported) => {
                        if (supported) {
                            Linking.openURL(cleanUrl).catch(() => {});
                        } else {
                            Linking.openURL(url).catch(() => {});
                        }
                    })
                    .catch(() => {});
            } catch (err) {
                console.warn("Could not handle intent url:", url, err);
            }
            return false;
        }

        // UPI deep link schemes (upi://, phonepe://, paytmmp://, tez://, etc.)
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url).catch(() => {});
                } else {
                    console.warn("No app found to open custom scheme:", url);
                }
            })
            .catch((err) => {
                console.warn("Error opening external app URL:", url, err);
            });

        return false;
    };

    if (!isVisible || !activeOptions || !WebViewComponent) {
        return null;
    }

    const amountInPaise = Math.round((activeOptions.amount || 0) * 100);

    const rzpConfig = {
        key: RAZORPAY_CONFIG.KEY_ID,
        amount: amountInPaise,
        currency: "INR",
        name: "UpNum",
        description: `${activeOptions.planName || "Subscription"}`,
        image: "https://upnum.etiquetteai.in/favicon.ico",
        prefill: {
            name: activeOptions.user?.name || "",
            email: activeOptions.user?.email || "",
            contact: activeOptions.user?.mobile || "",
        },
        theme: {
            color: "#4F46E5",
        },
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Razorpay Checkout</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #0F172A;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }
    .loading-container {
      text-align: center;
      padding: 24px;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-top-color: #6366F1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .title {
      font-size: 15px;
      font-weight: 700;
      color: #F8FAFC;
      margin-bottom: 6px;
    }
    .sub {
      font-size: 13px;
      color: #94A3B8;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="loading-container">
    <div class="spinner"></div>
    <div class="title">Connecting to Razorpay...</div>
    <div class="sub">Preparing secure checkout gateway</div>
  </div>

  <script>
    function sendRN(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    function initRazorpay() {
      try {
        if (typeof Razorpay === "undefined") {
          sendRN({
            type: "ERROR",
            error: { description: "Failed to load Razorpay SDK. Please check your internet connection." }
          });
          return;
        }

        var config = ${JSON.stringify(rzpConfig)};

        config.handler = function(response) {
          sendRN({
            type: "SUCCESS",
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          });
        };

        config.modal = {
          ondismiss: function() {
            sendRN({ type: "DISMISSED" });
          },
          backdropclose: false,
          escape: false,
          handleback: true
        };

        var rzp = new Razorpay(config);

        rzp.on("payment.failed", function(response) {
          sendRN({
            type: "ERROR",
            error: response.error || { description: "Payment transaction failed." }
          });
        });

        rzp.open();
      } catch (err) {
        sendRN({
          type: "ERROR",
          error: { description: err.message || "Failed to launch Razorpay checkout." }
        });
      }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
      initRazorpay();
    } else {
      window.addEventListener("DOMContentLoaded", initRazorpay);
    }
  </script>
</body>
</html>
    `;

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClosePress}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

                {/* Secure Top Header Bar */}
                <View style={[styles.header, { borderBottomColor: isDark ? "#1E293B" : "#E2E8F0" }]}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleClosePress}
                        style={[styles.closeButton, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}
                    >
                        <Ionicons name="close" size={20} color={isDark ? "#F8FAFC" : "#0F172A"} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleWrap}>
                        <View style={styles.secureBadgeRow}>
                            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                            <Text style={[styles.secureText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                                Razorpay Secure
                            </Text>
                        </View>
                        <Text style={[styles.planSubTitle, { color: isDark ? "#94A3B8" : "#64748B" }]} numberOfLines={1}>
                            {activeOptions.planName} • ₹{activeOptions.amount}
                        </Text>
                    </View>

                    <View style={styles.lockBox}>
                        <Ionicons name="lock-closed" size={16} color="#6366F1" />
                    </View>
                </View>

                {/* WebView Container */}
                <View style={styles.webViewWrap}>
                    <WebViewComponent
                        ref={webViewRef}
                        source={{
                            html: htmlContent,
                            baseUrl: "https://upnum.etiquetteai.in",
                        }}
                        style={styles.webView}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        originWhitelist={["*"]}
                        mixedContentMode="always"
                        allowsInlineMediaPlayback={true}
                        setSupportMultipleWindows={false}
                        onMessage={handleMessage}
                        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                        onLoadEnd={() => setIsLoading(false)}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={[styles.loadingOverlay, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}>
                                <ActivityIndicator size="large" color="#6366F1" />
                                <Text style={[styles.loadingText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                                    Loading Razorpay Checkout...
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: "center",
        marginHorizontal: 12,
    },
    secureBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    secureText: {
        fontSize: 13,
        fontWeight: "700",
    },
    planSubTitle: {
        fontSize: 11,
        fontWeight: "500",
        marginTop: 2,
    },
    lockBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#EEF2FF",
        alignItems: "center",
        justifyContent: "center",
    },
    webViewWrap: {
        flex: 1,
        position: "relative",
    },
    webView: {
        flex: 1,
        backgroundColor: "transparent",
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 13,
        fontWeight: "600",
    },
});
