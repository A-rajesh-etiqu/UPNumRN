import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    useWindowDimensions,
    Platform,
    ActivityIndicator,
    Image,
    Modal,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "../../../theme";
import { useTransactionStore } from "../../../store/transaction.store";
import { transactionsService } from "../../../services/transactions.service";
import { useAuthStore } from "../../../store/auth.store";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import { ReportCard } from "../../../components/dashboard/ReportCard";
import { router } from "../../../navigation/RootNavigation";

// Types
type TabType = "All" | "Credited" | "Debited";

const IMPORT_CATEGORIES = [
    "Food & Dining",
    "Shopping",
    "Groceries",
    "Travel & Fuel",
    "Entertainment",
    "Utilities & Bills",
    "Healthcare",
    "Salary & Income",
    "Investments",
    "Transfers",
    "General"
];

// SVG Components
const UpiLogo = () => (
    <Svg width="40" height="16" viewBox="0 0 64 24">
        {/* Simple UPI text representation for logo */}
        <Path d="M4 4v10c0 3.31 2.69 6 6 6s6-2.69 6-6V4h-4v10c0 1.1-.9 2-2 2s-2-.9-2-2V4H4z" fill="#7A7A7A" />
        <Path d="M22 4v16h4v-5h4c3.31 0 6-2.69 6-6s-2.69-6-6-6h-8zm4 4h4c1.1 0 2 .9 2 2s-.9 2-2 2h-4V8z" fill="#7A7A7A" />
        <Path d="M42 4h4v16h-4z" fill="#7A7A7A" />
        <Path d="M50 4l6 8 6-8v16h-4v-8l-2 3-2-3v8h-4V4z" fill="#7A7A7A" />
        <Path d="M0 24L10 24 16 16 22 24 64 24" stroke="#00A251" strokeWidth="2" fill="none" />
        <Path d="M0 24L5 24 10 18 15 24 64 24" stroke="#F1841E" strokeWidth="2" fill="none" />
    </Svg>
);

const MOCK_DATA = [
    {
        id: "1",
        merchant: "Google Pay",
        vpa: "gpay-123456@okicici",
        iconInitials: "G",
        iconColor: "#22C55E",
        iconBg: "#DCFCE7",
        amount: 2450.0,
        date: "31 May, 2024",
        time: "10:30 AM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "2",
        merchant: "PhonePe",
        vpa: "phonepe-987654@ybl",
        iconInitials: "P",
        iconColor: "#A855F7",
        iconBg: "#F3E8FF",
        amount: 1850.0,
        date: "31 May, 2024",
        time: "09:15 AM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "3",
        merchant: "Paytm",
        vpa: "paytm-555666@paytm",
        iconInitials: "P",
        iconColor: "#22C55E",
        iconBg: "#DCFCE7",
        amount: 980.0,
        date: "30 May, 2024",
        time: "08:45 PM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "4",
        merchant: "HDFC Bank",
        vpa: "hdfcbank@upi",
        iconInitials: "H",
        iconColor: "#3B82F6",
        iconBg: "#DBEAFE",
        amount: 3200.0,
        date: "30 May, 2024",
        time: "07:20 PM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "5",
        merchant: "Amazon Pay",
        vpa: "amazonpay@apl",
        iconInitials: "a",
        iconColor: "#22C55E",
        iconBg: "#DCFCE7",
        amount: 1120.0,
        date: "30 May, 2024",
        time: "06:10 PM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "6",
        merchant: "Flipkart",
        vpa: "flipkart@axisbank",
        iconInitials: "f",
        iconColor: "#F97316",
        iconBg: "#FFEDD5",
        amount: 2650.0,
        date: "29 May, 2024",
        time: "04:55 PM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "7",
        merchant: "Neha Patel",
        vpa: "neha.patel@okicici",
        iconInitials: "N",
        iconColor: "#6366F1",
        iconBg: "#E0E7FF",
        amount: 750.0,
        date: "29 May, 2024",
        time: "02:30 PM",
        status: "Successful",
        isUpi: true,
    },
];

export default function TransactionsScreen() {
    const { colors, isDark } = useAppTheme();
    const { user, logout } = useAuthStore();
    const { transactions, loading, loadTransactions, addTransaction } = useTransactionStore();
    const [activeTab, setActiveTab] = useState<TabType>("All");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const insets = useSafeAreaInsets();

    // Import Transaction State
    const [isImportMenuVisible, setIsImportMenuVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importForm, setImportForm] = useState({ title: '', category: '', amount: '', type: 'expense' as 'expense' | 'income' });
    const { uploadBulkTransactions, saveImportedTransactions } = useTransactionStore();

    // PDF & Statement Review Engine State
    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
    const [statementPreviewData, setStatementPreviewData] = useState<{
        bankDetected: string;
        filename: string;
        totalFound: number;
        transactions: any[];
    } | null>(null);
    const [isSavingImport, setIsSavingImport] = useState(false);

    // Password Protected PDF State
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [pdfPassword, setPdfPassword] = useState('');
    const [pendingPdfFile, setPendingPdfFile] = useState<any>(null);

    const ITEMS_PER_PAGE = 10;

    const handleImportSubmit = async () => {
        if (!importForm.title || !importForm.amount || !importForm.category) return;
        setIsImporting(true);
        const success = await addTransaction({
            userId: user?.id,
            title: importForm.title,
            category: importForm.category,
            amount: parseFloat(importForm.amount),
            type: importForm.type,
            date_time: new Date().toISOString()
        });
        setIsImporting(false);
        if (success) {
            setIsImportModalVisible(false);
            setImportForm({ title: '', category: '', amount: '', type: 'expense' });
        }
    };

    const handleFileUpload = async () => {
        setIsImportMenuVisible(false);
        try {
            const types = Platform.OS === 'android'
                ? ['*/*']
                : [
                    'application/pdf',
                    'text/csv',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/comma-separated-values'
                ];

            const result = await DocumentPicker.getDocumentAsync({
                type: types,
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const file = result.assets[0];

            // If on Android and wild-card was used, filter by extension to provide friendly error
            const ext = (file.name || '').toLowerCase();
            const isValid = ext.endsWith('.pdf') || ext.endsWith('.csv') || ext.endsWith('.xlsx') || ext.endsWith('.xls') ||
                file.mimeType?.includes('pdf') || file.mimeType?.includes('sheet') || file.mimeType?.includes('csv') || file.mimeType?.includes('excel');

            if (!isValid) {
                Alert.alert("Unsupported File", "Please select a bank statement in PDF, CSV, or Excel (.xlsx) format.");
                return;
            }

            await processStatementFile(file);
        } catch (error) {
            console.error("File upload error:", error);
            Alert.alert("Error", "Could not pick document");
        }
    };

    const processStatementFile = async (file: any, password = '') => {
        setIsImporting(true);
        try {
            let res: any;

            // Priority 1 on Mobile (iOS / Android): Read file directly via FileSystem into Base64
            // This completely avoids React Native FormData multipart boundary & ContentResolver streaming issues
            let base64Content: string | null = null;
            if (Platform.OS !== 'web' && file.uri) {
                try {
                    base64Content = await FileSystem.readAsStringAsync(file.uri, {
                        encoding: 'base64' as any,
                    });
                } catch (fsErr) {
                    console.warn("FileSystem read failed, attempting FormData fallback:", fsErr);
                }
            }

            if (base64Content) {
                res = await transactionsService.parseStatementFile({
                    base64File: base64Content,
                    filename: file.name || "statement.pdf",
                    password: password || undefined,
                    userId: user?.id || "user-1",
                });
            } else {
                // Priority 2 (Web or fallback): Use FormData
                const formData = new FormData();
                formData.append("userId", user?.id || "user-1");

                if (Platform.OS === 'web') {
                    if (file.file) {
                        (formData as any).append("file", file.file, file.name || file.file.name || "statement.pdf");
                    } else if (file.uri) {
                        try {
                            const blobResp = await fetch(file.uri);
                            const blob = await blobResp.blob();
                            (formData as any).append("file", blob, file.name || "statement.pdf");
                        } catch (err) {
                            formData.append("file", file);
                        }
                    } else {
                        formData.append("file", file);
                    }
                } else {
                    formData.append("file", {
                        uri: file.uri,
                        name: file.name || "statement.pdf",
                        type: file.mimeType || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
                    } as any);
                }

                if (password) {
                    formData.append("password", password);
                }

                res = await transactionsService.parseStatementFile(formData);
            }

            setIsImporting(false);

            if (!res.success) {
                if (res.isPasswordProtected) {
                    setPendingPdfFile(file);
                    setPdfPassword('');
                    setIsPasswordModalVisible(true);
                    return;
                }
                Alert.alert("Statement Error", res.error || "Failed to process statement file");
                return;
            }

            if (!res.transactions || res.transactions.length === 0) {
                Alert.alert("No Transactions Detected", "We couldn't detect any transaction rows in this file. Please verify the statement layout.");
                return;
            }

            setStatementPreviewData({
                bankDetected: res.bankDetected || "Bank Statement",
                filename: file.name || "statement.pdf",
                totalFound: res.totalFound || res.transactions.length,
                transactions: res.transactions.map((t: any) => ({
                    ...t,
                    selected: true,
                })),
            });
            setIsReviewModalVisible(true);
        } catch (error: any) {
            console.error("Statement parse error:", error);
            setIsImporting(false);
            if (error?.response?.data?.isPasswordProtected || error?.response?.status === 401) {
                setPendingPdfFile(file);
                setPdfPassword('');
                setIsPasswordModalVisible(true);
                return;
            }
            Alert.alert("Import Error", error?.response?.data?.error || "An unexpected error occurred while parsing the statement.");
        }
    };

    const handleUnlockPassword = async () => {
        if (!pdfPassword.trim() || !pendingPdfFile) return;
        setIsPasswordModalVisible(false);
        await processStatementFile(pendingPdfFile, pdfPassword.trim());
    };

    const toggleSelectAll = () => {
        if (!statementPreviewData) return;
        const allSelected = statementPreviewData.transactions.every(t => t.selected);
        setStatementPreviewData({
            ...statementPreviewData,
            transactions: statementPreviewData.transactions.map(t => ({
                ...t,
                selected: !allSelected,
            })),
        });
    };

    const toggleSelectTx = (id: string) => {
        if (!statementPreviewData) return;
        setStatementPreviewData({
            ...statementPreviewData,
            transactions: statementPreviewData.transactions.map(t =>
                t.id === id ? { ...t, selected: !t.selected } : t
            ),
        });
    };

    const updateTxField = (id: string, field: string, val: any) => {
        if (!statementPreviewData) return;
        setStatementPreviewData({
            ...statementPreviewData,
            transactions: statementPreviewData.transactions.map(t =>
                t.id === id ? { ...t, [field]: val } : t
            ),
        });
    };

    const deletePreviewTx = (id: string) => {
        if (!statementPreviewData) return;
        setStatementPreviewData({
            ...statementPreviewData,
            transactions: statementPreviewData.transactions.filter(t => t.id !== id),
        });
    };

    const handleConfirmImport = async () => {
        if (!statementPreviewData) return;
        const selectedTx = statementPreviewData.transactions.filter(t => t.selected);
        if (selectedTx.length === 0) {
            Alert.alert("Selection Required", "Please select at least one transaction to import.");
            return;
        }

        setIsSavingImport(true);
        try {
            const success = await saveImportedTransactions(user?.id || "user-1", selectedTx);
            setIsSavingImport(false);
            if (success) {
                setIsReviewModalVisible(false);
                const bank = statementPreviewData.bankDetected;
                setStatementPreviewData(null);
                Alert.alert(
                    "Import Successful! 🎉",
                    `Successfully imported ${selectedTx.length} transactions from your ${bank} statement.`
                );
            } else {
                Alert.alert("Error", "Failed to save transactions to database.");
            }
        } catch (err) {
            console.error("Save import error:", err);
            setIsSavingImport(false);
            Alert.alert("Error", "An unexpected error occurred while saving transactions.");
        }
    };

    useEffect(() => {
        loadTransactions(user?.id);
    }, [user?.id]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, search]);

    // Background should match screenshot perfectly
    const bgColor = isDark ? colors.background : "#FCFDFE";

    // Helper to get initials
    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : "T";
    };

    // Helper to determine if transaction is credited or debited
    const isCreditTransaction = (tx: any) => {
        if (tx.type === "income" || tx.type === "CREDIT" || tx.type === "credit") return true;
        if (tx.type === "expense" || tx.type === "DEBIT" || tx.type === "debit") return false;
        return typeof tx.amount === "number" ? tx.amount >= 0 : true;
    };

    // KPI Stats computations
    const totalTxCount = transactions.length;
    const creditedCount = transactions.filter(tx => isCreditTransaction(tx)).length;
    const debitedCount = transactions.filter(tx => !isCreditTransaction(tx)).length;

    // Filter transactions
    const filteredTransactions = transactions.filter(tx => {
        const isCredit = isCreditTransaction(tx);
        const matchTab =
            activeTab === "All" ||
            (activeTab === "Credited" && isCredit) ||
            (activeTab === "Debited" && !isCredit);
        const matchSearch =
            (tx.title || "").toLowerCase().includes(search.toLowerCase()) ||
            (tx.category || "").toLowerCase().includes(search.toLowerCase()) ||
            (isCredit ? "credited" : "debited").includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    const generatePDF = async () => {
        if (filteredTransactions.length === 0) {
            Alert.alert("No Data", "There is no transaction data to download.");
            return;
        }
        try {
            if (Platform.OS === 'web') {
                const { jsPDF } = require("jspdf");
                const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");

                const doc = new jsPDF();

                // Add header
                doc.setFontSize(18);
                doc.text("Transactions Report", 14, 22);
                doc.setFontSize(11);
                doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 30);

                // Prepare table data
                const tableData = filteredTransactions.map(tx => {
                    const isCredit = isCreditTransaction(tx);
                    return [
                        tx.title || tx.category || 'N/A',
                        'UPI Payment',
                        `${isCredit ? '+' : '-'} Rs. ${Math.abs(tx.amount || 0).toFixed(2)}`,
                        tx.date || new Date().toLocaleDateString(),
                        isCredit ? 'Credited' : 'Debited'
                    ];
                });

                // Generate table
                autoTable(doc, {
                    startY: 36,
                    head: [['Title', 'Type', 'Amount', 'Date', 'Action']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [109, 40, 217] }
                });

                doc.save('transactions.pdf');
            } else {
                let logoDataUri = "";
                try {
                    const logoAsset = Asset.fromModule(require('../../../../assets/images/logo.png'));
                    await logoAsset.downloadAsync();
                    if (logoAsset.localUri || logoAsset.uri) {
                        const base64 = await FileSystem.readAsStringAsync(logoAsset.localUri || logoAsset.uri, {
                            encoding: FileSystem.EncodingType.Base64
                        });
                        logoDataUri = `data:image/png;base64,${base64}`;
                    }
                } catch (e) {
                    console.log("Could not load logo for PDF", e);
                }

                const htmlContent = `
                    <html>
                        <head>
                            <style>
                                body { font-family: 'Helvetica'; padding: 20px; position: relative; }
                                h1 { text-align: center; color: #333; margin-top: 10px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; z-index: 2; position: relative; }
                                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                                th { background-color: #f8f9fa; color: #333; }
                                tr:nth-child(even) { background-color: #f9f9f9; }
                                .amount { font-weight: bold; }
                                .header-logo { display: block; margin: 0 auto; max-width: 150px; }
                                .watermark {
                                    position: fixed;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    opacity: 0.08;
                                    z-index: 0;
                                    width: 400px;
                                    pointer-events: none;
                                }
                            </style>
                        </head>
                        <body>
                            ${logoDataUri ? `<img src="${logoDataUri}" class="watermark" />` : ''}
                            ${logoDataUri ? `<img src="${logoDataUri}" class="header-logo" />` : ''}
                            <h1>Transactions Report</h1>
                            <p>Total Transactions: ${filteredTransactions.length}</p>
                            <table>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                                ${filteredTransactions.map(tx => {
                                    const isCredit = isCreditTransaction(tx);
                                    return `
                                        <tr>
                                            <td>${tx.title || tx.category || 'N/A'}</td>
                                            <td>UPI Payment</td>
                                            <td class="amount" style="color: ${isCredit ? '#16A34A' : '#DC2626'}; font-weight: bold;">${isCredit ? '+' : '-'} ₹${Math.abs(tx.amount || 0).toFixed(2)}</td>
                                            <td>${tx.date || new Date().toLocaleDateString()} ${tx.time || ''}</td>
                                            <td style="color: ${isCredit ? '#16A34A' : '#DC2626'}; font-weight: bold;">${isCredit ? 'Credited' : 'Debited'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </table>
                        </body>
                    </html>
                `;
                const { base64 } = await Print.printToFileAsync({ html: htmlContent, base64: true });

                const pdfName = `${FileSystem.documentDirectory}TransactionsReport.pdf`;
                if (base64) {
                    await FileSystem.writeAsStringAsync(pdfName, base64, {
                        encoding: FileSystem.EncodingType.Base64
                    });
                    await Sharing.shareAsync(pdfName, { UTI: '.pdf', mimeType: 'application/pdf' });
                } else {
                    Alert.alert("Error", "Failed to generate PDF data");
                }
            }
        } catch (error) {
            console.error("PDF generation error:", error);
            Alert.alert("Error", "Failed to generate PDF");
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: bgColor }}>
            <DashboardHeader
                title="Transactions"
                subtitle="Track and manage all your transactions"
            />
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                {/* Top Filters Row */}
                {/* <View style={[styles.topFiltersRow, { justifyContent: 'flex-end' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.downloadBtn, { backgroundColor: colors.primary, borderColor: colors.primary, paddingHorizontal: 12, width: 'auto', flexDirection: 'row', gap: 6 }]}
                            activeOpacity={0.8}
                            onPress={() => setIsImportMenuVisible(true)}
                        >
                            <Ionicons name="add-outline" size={18} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Import</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.downloadBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}
                            activeOpacity={0.8}
                            onPress={generatePDF}
                        >
                            <Ionicons name="download-outline" size={18} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View> */}

                {/* KPIs Row */}
                {/* <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 4 }}>
                    <ReportCard title="Total Transactions" value={totalTxCount.toString()} icon="swap-horizontal" color="#8B5CF6" change="12.4%" isUp={true} isDesktop={isDesktop} colors={colors} changeText="vs Apr 01 - Apr 30" />
                    <ReportCard title="Successful" value={successCount.toString()} icon="checkmark-circle-outline" color="#22C55E" change="94.6%" isUp={true} isDesktop={isDesktop} colors={colors} />
                    <ReportCard title="Failed" value={failedCount.toString()} icon="close-circle-outline" color="#EF4444" change="3.8%" isUp={false} isDesktop={isDesktop} colors={colors} />
                    <ReportCard title="Pending" value={pendingCount.toString()} icon="time-outline" color="#3B82F6" change="1.6%" isUp={true} isDesktop={isDesktop} colors={colors} />
                </View> */}

                {/* Tabs Row */}
                {/* <View style={styles.tabsWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                        {(["All", "Successful", "Failed", "Pending"] as TabType[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                                onPress={() => setActiveTab(tab)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: activeTab === tab ? "#6D28D9" : "#64748B" },
                                    activeTab === tab && styles.tabTextActive
                                ]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View> */}

                {/* Search Row */}
                <View style={styles.searchRow}>
                    <View style={[styles.searchBox, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Ionicons name="search-outline" size={18} color="#94A3B8" />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search transactions..."
                            placeholderTextColor="#94A3B8"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    <View style={[styles.topFiltersRow, { justifyContent: 'flex-end' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.downloadBtn, { backgroundColor: colors.primary, borderColor: colors.primary, paddingHorizontal: 12, width: 'auto', flexDirection: 'row', gap: 6 }]}
                                activeOpacity={0.8}
                                onPress={() => setIsImportMenuVisible(true)}
                            >
                                <Ionicons name="add-outline" size={18} color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Import</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.downloadBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}
                                activeOpacity={0.8}
                                onPress={generatePDF}
                            >
                                <Ionicons name="download-outline" size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Main Table Content */}
                {isDesktop ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: "100%" }} contentContainerStyle={{ flexGrow: 1 }}>
                        <View style={[styles.tableContainer, { flex: 1, backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>

                            {/* Table Header */}
                            <View style={[styles.tableHeader, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderBottomColor: isDark ? colors.border : "#F1F5F9" }]}>
                                <Text style={[styles.thText, { flex: 2, minWidth: 200 }]}>Transaction</Text>
                                <Text style={[styles.thText, { flex: 1.2, minWidth: 100 }]}>Type</Text>
                                <Text style={[styles.thText, { flex: 1.5, minWidth: 140 }]}>Amount</Text>
                                <Text style={[styles.thText, { width: 100 }]}>Action</Text>
                            </View>

                            {/* Table Rows */}
                            {paginatedTransactions.map((tx, index) => {
                                const isCredit = isCreditTransaction(tx);
                                return (
                                <View key={tx.id || index} style={[styles.tableRow, index !== paginatedTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? colors.border : "#F1F5F9" }]}>

                                    {/* Transaction Column */}
                                    <View style={[styles.tdCol, { flex: 2, minWidth: 200, flexDirection: "row", alignItems: "center" }]}>
                                        <View style={[styles.merchantIcon, { backgroundColor: isDark ? colors.border : (isCredit ? "#DCFCE7" : "#FEE2E2") }]}>
                                            <Text style={{ color: isCredit ? "#16A34A" : "#DC2626", fontWeight: "800", fontSize: 16 }}>{getInitials(tx.title || tx.category)}</Text>
                                        </View>
                                        <View style={{ marginLeft: 10, flex: 1 }}>
                                            <Text style={[styles.tdMainText, { color: colors.text }]} numberOfLines={1}>{tx.title || tx.category}</Text>
                                            <Text style={styles.tdSubText} numberOfLines={1}>{tx.upi || tx.category}</Text>
                                        </View>
                                    </View>

                                    {/* Type Column */}
                                    <View style={[styles.tdCol, { flex: 1.2, minWidth: 100, justifyContent: "center" }]}>
                                        <Text style={[styles.tdMainText, { color: colors.text, fontSize: 11 }]}>UPI Payment</Text>
                                        <View style={{ marginTop: 2 }}>
                                            <UpiLogo />
                                        </View>
                                    </View>

                                    {/* Amount Column */}
                                    <View style={[styles.tdCol, { flex: 1.5, minWidth: 140, justifyContent: "center" }]}>
                                        <Text style={[styles.tdMainText, { color: isCredit ? (isDark ? "#4ade80" : "#16A34A") : (isDark ? "#f87171" : "#DC2626") }]}>
                                            {isCredit ? "+" : "-"} ₹ {Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </Text>
                                        <Text style={styles.tdSubText}>{tx.date} • {tx.time || "12:00 PM"}</Text>
                                    </View>

                                    {/* Action Column */}
                                    <View style={[styles.tdCol, { width: 100, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                        <View style={[
                                            styles.actionPill,
                                            isCredit
                                                ? { backgroundColor: isDark ? "#064e3b" : "#DCFCE7" }
                                                : { backgroundColor: isDark ? "#7f1d1d" : "#FEE2E2" },
                                        ]}>
                                            <Text style={[
                                                styles.actionText,
                                                { color: isCredit ? "#16A34A" : "#DC2626" },
                                            ]}>
                                                {isCredit ? "Credited" : "Debited"}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                                    </View>
                                </View>
                            );
                            })}
                        </View>
                    </ScrollView>
                ) : (
                    <View style={{ gap: 12, marginTop: 8 }}>
                        {paginatedTransactions.map((tx, index) => {
                            const isCredit = isCreditTransaction(tx);
                            return (
                            <View key={tx.id || index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? colors.surface : '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: isDark ? colors.border : '#F1F5F9' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                                    <View style={[styles.merchantIcon, { backgroundColor: isDark ? colors.border : (isCredit ? "#DCFCE7" : "#FEE2E2") }]}>
                                        <Text style={{ color: isCredit ? "#16A34A" : "#DC2626", fontWeight: "800", fontSize: 16 }}>{getInitials(tx.title || tx.category)}</Text>
                                    </View>
                                    <View style={{ marginLeft: 10, flex: 1 }}>
                                        <Text style={[styles.tdMainText, { color: colors.text }]} numberOfLines={1}>{tx.title || tx.category}</Text>
                                        <Text style={styles.tdSubText} numberOfLines={1}>{tx.date} • {tx.time || "12:00 PM"}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.tdMainText, { color: isCredit ? (isDark ? "#4ade80" : "#16A34A") : (isDark ? "#f87171" : "#DC2626") }]}>
                                        {isCredit ? "+" : "-"} ₹ {Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </Text>
                                    <View style={[
                                        styles.actionPill,
                                        isCredit
                                            ? { backgroundColor: isDark ? "#064e3b" : "#DCFCE7" }
                                            : { backgroundColor: isDark ? "#7f1d1d" : "#FEE2E2" },
                                        { marginTop: 4 }
                                    ]}>
                                        <Text style={[
                                            styles.actionText,
                                            { color: isCredit ? "#16A34A" : "#DC2626" }
                                        ]}>
                                            {isCredit ? "Credited" : "Debited"}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                        })}
                    </View>
                )}

                {/* Pagination Footer */}
                <View style={styles.paginationRow}>
                    <Text style={styles.paginationText}>Showing {totalItems > 0 ? startIndex + 1 : 0} to {endIndex} of {totalItems} transactions</Text>

                    <View style={styles.pageControls}>
                        <TouchableOpacity
                            style={[styles.pageBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9", opacity: currentPage === 1 ? 0.5 : 1 }]}
                            disabled={currentPage === 1}
                            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                            <Ionicons name="chevron-back" size={14} color="#94A3B8" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.pageBtn, styles.pageBtnActive]}>
                            <Text style={styles.pageTextActive}>{currentPage}</Text>
                        </TouchableOpacity>

                        <View style={styles.pageDots}>
                            <Text style={[styles.pageText, { color: isDark ? colors.text : "#0F172A" }]}>of</Text>
                        </View>

                        <TouchableOpacity style={[styles.pageBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                            <Text style={[styles.pageText, { color: isDark ? colors.text : "#0F172A" }]}>{totalPages}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.pageBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9", opacity: currentPage === totalPages ? 0.5 : 1 }]}
                            disabled={currentPage === totalPages}
                            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                            <Ionicons name="chevron-forward" size={14} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Import Menu Modal */}
                <Modal
                    visible={isImportMenuVisible}
                    transparent={true}
                    animationType="fade"
                >
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setIsImportMenuVisible(false)}>
                        <View style={{ width: 330, backgroundColor: isDark ? colors.surface : "#FFF", borderRadius: 16, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 }, web: { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" } as any }) }}>
                            <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' }}>
                                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Import Transactions</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Select statement or manual entry</Text>
                            </View>

                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                                onPress={handleFileUpload}
                            >
                                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: isDark ? '#2E1065' : '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                                    <Ionicons name="document-text-outline" size={22} color="#8B5CF6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Bank Statement</Text>
                                        <View style={{ backgroundColor: '#8B5CF6', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>NEW</Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>PDF (HDFC, SBI, ICICI, Axis...), CSV, Excel</Text>
                                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                                        <View style={{ backgroundColor: isDark ? colors.border : '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600' }}>.PDF</Text>
                                        </View>
                                        <View style={{ backgroundColor: isDark ? colors.border : '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600' }}>.CSV</Text>
                                        </View>
                                        <View style={{ backgroundColor: isDark ? colors.border : '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600' }}>.XLSX</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                                onPress={() => { setIsImportMenuVisible(false); setIsImportModalVisible(true); }}
                            >
                                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: isDark ? '#1e3a8a' : '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                                    <Ionicons name="create-outline" size={20} color="#0284C7" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>Add Manually</Text>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Enter one transaction at a time</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Import Transaction Modal */}
                <Modal
                    visible={isImportModalVisible}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 340, backgroundColor: isDark ? colors.surface : "#FFF", borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Import Transaction</Text>

                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Title</Text>
                                <TextInput
                                    style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
                                    placeholder="e.g. Amazon Purchase"
                                    placeholderTextColor={colors.textSecondary}
                                    value={importForm.title}
                                    onChangeText={t => setImportForm({ ...importForm, title: t })}
                                />
                            </View>

                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Amount (₹)</Text>
                                <TextInput
                                    style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={importForm.amount}
                                    onChangeText={t => setImportForm({ ...importForm, amount: t })}
                                />
                            </View>

                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Category</Text>
                                <TextInput
                                    style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
                                    placeholder="e.g. Shopping"
                                    placeholderTextColor={colors.textSecondary}
                                    value={importForm.category}
                                    onChangeText={t => setImportForm({ ...importForm, category: t })}
                                />
                            </View>

                            <View style={{ marginBottom: 20, flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: importForm.type === 'expense' ? '#EF4444' : colors.border, backgroundColor: importForm.type === 'expense' ? (isDark ? '#451a1a' : '#FEE2E2') : 'transparent', alignItems: 'center' }}
                                    onPress={() => setImportForm({ ...importForm, type: 'expense' })}
                                >
                                    <Text style={{ color: importForm.type === 'expense' ? '#EF4444' : colors.text }}>Expense</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: importForm.type === 'income' ? '#22C55E' : colors.border, backgroundColor: importForm.type === 'income' ? (isDark ? '#1a3320' : '#DCFCE7') : 'transparent', alignItems: 'center' }}
                                    onPress={() => setImportForm({ ...importForm, type: 'income' })}
                                >
                                    <Text style={{ color: importForm.type === 'income' ? '#22C55E' : colors.text }}>Income</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: colors.border }}
                                    onPress={() => setIsImportModalVisible(false)}
                                >
                                    <Text style={{ color: colors.text }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: colors.primary }}
                                    onPress={handleImportSubmit}
                                    disabled={isImporting || !importForm.title || !importForm.amount || !importForm.category}
                                >
                                    {isImporting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: '600' }}>Add</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Parsing Loading Modal */}
                <Modal visible={isImporting} transparent={true} animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <View style={{ backgroundColor: isDark ? colors.surface : "#FFF", padding: 26, borderRadius: 18, alignItems: 'center', width: 310, borderWidth: 1, borderColor: colors.border, ...Platform.select({ web: { boxShadow: "0 8px 30px rgba(0,0,0,0.18)" } as any, default: { elevation: 10 } }) }}>
                            <ActivityIndicator size="large" color="#8B5CF6" />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 16, textAlign: 'center' }}>Parsing Statement...</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 18 }}>
                                Extracting transaction dates, merchants, and debit/credit amounts
                            </Text>
                        </View>
                    </View>
                </Modal>

                {/* PDF Password Unlock Modal */}
                <Modal visible={isPasswordModalVisible} transparent={true} animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <View style={{ backgroundColor: isDark ? colors.surface : "#FFF", padding: 24, borderRadius: 18, width: 340, borderWidth: 1, borderColor: colors.border, ...Platform.select({ web: { boxShadow: "0 8px 30px rgba(0,0,0,0.18)" } as any, default: { elevation: 10 } }) }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="lock-closed" size={20} color="#DC2626" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Protected Statement</Text>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Enter PDF password to unlock</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12, lineHeight: 18 }}>
                                Bank statements typically use your Date of Birth (DDMM), PAN in capital letters, or mobile number as password.
                            </Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text, marginBottom: 18, fontSize: 14, backgroundColor: isDark ? colors.background : "#F8FAFC" }}
                                placeholder="e.g. 1508 or ABCDE1234F"
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry
                                value={pdfPassword}
                                onChangeText={setPdfPassword}
                            />
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                                    onPress={() => { setIsPasswordModalVisible(false); setPendingPdfFile(null); }}
                                >
                                    <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center' }}
                                    onPress={handleUnlockPassword}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: '700' }}>Unlock & Read</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Statement Review & Import Modal */}
                <Modal visible={isReviewModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsReviewModalVisible(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: isDesktop ? 24 : 12 }}>
                        <View style={{
                            backgroundColor: isDark ? colors.surface : "#FFF",
                            width: '100%',
                            maxWidth: 860,
                            maxHeight: '92%',
                            borderRadius: 20,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: colors.border,
                            ...Platform.select({ web: { boxShadow: "0 12px 40px rgba(0,0,0,0.2)" } as any, default: { elevation: 12 } })
                        }}>
                            {/* Modal Header */}
                            <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? colors.background : "#F8FAFC" }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' }}>
                                        <Ionicons name="sparkles" size={20} color="#FFF" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>Review Transactions</Text>
                                            <View style={{ backgroundColor: isDark ? '#2E1065' : '#F5F3FF', borderWidth: 1, borderColor: '#8B5CF6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#8B5CF6' }}>{statementPreviewData?.bankDetected || "Bank Statement"}</Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                            {statementPreviewData?.filename} • {statementPreviewData?.transactions?.length || 0} rows extracted
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setIsReviewModalVisible(false)} style={{ padding: 6, borderRadius: 20, backgroundColor: isDark ? colors.border : '#F1F5F9' }}>
                                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Summary Stats Strip */}
                            {statementPreviewData && (() => {
                                const txs = statementPreviewData.transactions || [];
                                const selectedTxs = txs.filter(t => t.selected);
                                const credits = selectedTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                                const debits = selectedTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                                const allSelected = txs.length > 0 && txs.every(t => t.selected);

                                return (
                                    <View style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: isDark ? colors.surface : "#FFF", borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                            <View style={{ backgroundColor: isDark ? colors.border : '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                                    {selectedTxs.length} of {txs.length} Selected
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: isDark ? '#064e3b' : '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#16A34A' }}>
                                                    + ₹{credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: isDark ? '#7f1d1d' : '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>
                                                    - ₹{debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                                            onPress={toggleSelectAll}
                                        >
                                            <Ionicons name={allSelected ? "checkbox" : "square-outline"} size={16} color="#8B5CF6" />
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                                                {allSelected ? "Deselect All" : "Select All"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })()}

                            {/* Transactions Table / List */}
                            <ScrollView style={{ maxHeight: 420, paddingHorizontal: 16, paddingVertical: 12 }} showsVerticalScrollIndicator={true}>
                                {statementPreviewData?.transactions?.map((item, idx) => (
                                    <View
                                        key={item.id || idx}
                                        style={{
                                            backgroundColor: isDark ? colors.background : (item.selected ? "#FFFFFF" : "#F8FAFC"),
                                            borderWidth: 1,
                                            borderColor: item.selected ? '#8B5CF6' : colors.border,
                                            borderRadius: 14,
                                            padding: 14,
                                            marginBottom: 10,
                                            opacity: item.selected ? 1 : 0.6,
                                            gap: 10
                                        }}
                                    >
                                        {/* Row 1: Checkbox, Date, Amount, Type & Delete */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <TouchableOpacity
                                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                                                onPress={() => toggleSelectTx(item.id)}
                                            >
                                                <Ionicons
                                                    name={item.selected ? "checkbox" : "square-outline"}
                                                    size={20}
                                                    color={item.selected ? "#8B5CF6" : colors.textSecondary}
                                                />
                                                <View style={{ backgroundColor: isDark ? colors.border : '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>{item.date}</Text>
                                                </View>
                                            </TouchableOpacity>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {/* Type Toggle */}
                                                <TouchableOpacity
                                                    style={{
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 3,
                                                        borderRadius: 6,
                                                        backgroundColor: item.type === 'income' ? (isDark ? '#064e3b' : '#DCFCE7') : (isDark ? '#7f1d1d' : '#FEE2E2'),
                                                        borderWidth: 1,
                                                        borderColor: item.type === 'income' ? '#16A34A' : '#DC2626'
                                                    }}
                                                    onPress={() => updateTxField(item.id, 'type', item.type === 'income' ? 'expense' : 'income')}
                                                >
                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: item.type === 'income' ? '#16A34A' : '#DC2626' }}>
                                                        {item.type === 'income' ? 'Income' : 'Expense'}
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Amount Input */}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, height: 32, backgroundColor: isDark ? colors.surface : '#FFF' }}>
                                                    <Text style={{ fontSize: 12, fontWeight: '700', color: item.type === 'income' ? '#16A34A' : '#DC2626', marginRight: 2 }}>₹</Text>
                                                    <TextInput
                                                        style={{ fontSize: 13, fontWeight: '700', color: colors.text, width: 80, padding: 0 }}
                                                        keyboardType="numeric"
                                                        value={String(item.amount)}
                                                        onChangeText={(val) => updateTxField(item.id, 'amount', parseFloat(val) || 0)}
                                                    />
                                                </View>

                                                {/* Delete Button */}
                                                <TouchableOpacity onPress={() => deletePreviewTx(item.id)} style={{ padding: 4 }}>
                                                    <Ionicons name="trash-outline" size={17} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Row 2: Editable Title & Narration */}
                                        <View>
                                            <TextInput
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: '700',
                                                    color: colors.text,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    borderRadius: 8,
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 6,
                                                    backgroundColor: isDark ? colors.surface : '#FFF'
                                                }}
                                                placeholder="Transaction Title"
                                                placeholderTextColor={colors.textSecondary}
                                                value={item.title}
                                                onChangeText={(val) => updateTxField(item.id, 'title', val)}
                                            />
                                            {item.description ? (
                                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }} numberOfLines={1}>
                                                    Raw: {item.description}
                                                </Text>
                                            ) : null}
                                        </View>

                                        {/* Row 3: Category Chips */}
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                                            {IMPORT_CATEGORIES.map((cat) => (
                                                <TouchableOpacity
                                                    key={cat}
                                                    style={{
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 3,
                                                        borderRadius: 6,
                                                        backgroundColor: item.category === cat ? '#8B5CF6' : (isDark ? colors.border : '#F1F5F9'),
                                                    }}
                                                    onPress={() => updateTxField(item.id, 'category', cat)}
                                                >
                                                    <Text style={{ fontSize: 11, fontWeight: item.category === cat ? '700' : '500', color: item.category === cat ? '#FFF' : colors.text }}>
                                                        {cat}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                ))}
                            </ScrollView>

                            {/* Modal Footer Actions */}
                            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 12, backgroundColor: isDark ? colors.background : "#F8FAFC" }}>
                                <TouchableOpacity
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface }}
                                    onPress={() => setIsReviewModalVisible(false)}
                                    disabled={isSavingImport}
                                >
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        flex: 2,
                                        paddingVertical: 12,
                                        borderRadius: 10,
                                        backgroundColor: '#8B5CF6',
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        gap: 8,
                                        opacity: isSavingImport ? 0.7 : 1
                                    }}
                                    onPress={handleConfirmImport}
                                    disabled={isSavingImport}
                                >
                                    {isSavingImport ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
                                    )}
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>
                                        {isSavingImport
                                            ? "Saving Transactions..."
                                            : `Import (${statementPreviewData?.transactions?.filter(t => t.selected).length || 0}) Transactions`}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    pageHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    pageHeaderLeft: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6D28D9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    dropdownOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.1)",
        alignItems: "flex-end",
        paddingTop: Platform.OS === 'ios' ? 100 : 70,
        paddingRight: 16,
    },
    profileDropdown: {
        width: 160,
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 8 },
            web: { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } as any,
        })
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 8,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: "500",
    },
    dropdownDivider: {
        height: 1,
    },
    topFiltersRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 12,
    },
    leftFilters: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
    },
    filterBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F1F5F9",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3 },
            android: { elevation: 1 },
            web: { boxShadow: "0 2px 6px rgba(0,0,0,0.02)" } as any,
        })
    },
    filterText: {
        fontSize: 12,
        color: "#1E293B",
        fontWeight: "500",
    },
    downloadBtn: {
        width: 34,
        height: 34,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F1F5F9",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3 },
            android: { elevation: 1 },
            web: { boxShadow: "0 2px 6px rgba(0,0,0,0.02)" } as any,
        })
    },
    kpiRow: {
        gap: 16,
        paddingBottom: 4,
    },
    kpiCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        width: 150,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
            android: { elevation: 2 },
            web: { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" } as any,
        })
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    kpiTitle: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "600",
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 8,
    },
    kpiTrendRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    kpiTrendGreen: {
        fontSize: 10,
        color: "#16A34A",
        fontWeight: "700",
        marginLeft: 2,
    },
    kpiTrendRed: {
        fontSize: 10,
        color: "#DC2626",
        fontWeight: "700",
        marginLeft: 2,
    },
    kpiTrendBlue: {
        fontSize: 10,
        color: "#0284C7",
        fontWeight: "700",
        marginLeft: 2,
    },
    kpiTrendSub: {
        fontSize: 10,
        color: "#94A3B8",
        marginLeft: 4,
    },
    tabsWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        marginBottom: 20,
    },
    tabsContainer: {
        flexDirection: "row",
    },
    tabItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 8,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabItemActive: {
        borderBottomColor: "#6D28D9",
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
    },
    tabTextActive: {
        fontWeight: "700",
    },
    searchRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    searchBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        padding: 0,
        ...Platform.select({ web: { outlineStyle: "none" } as any }),
    },
    slidersBtn: {
        width: 44,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    tableContainer: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
        minWidth: 700,
    },
    tableHeader: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        backgroundColor: "#F8FAFC",
    },
    thText: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "700",
    },
    tableRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    tdCol: {
    },
    merchantIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    tdMainText: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 2,
    },
    tdSubText: {
        fontSize: 10,
        color: "#94A3B8",
    },
    actionPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    actionText: {
        fontSize: 10,
        fontWeight: "700",
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "700",
    },
    paginationRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        paddingHorizontal: 4,
        flexWrap: "wrap",
        gap: 12,
    },
    paginationText: {
        fontSize: 12,
        color: "#64748B",
    },
    pageControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    pageBtn: {
        minWidth: 32,
        height: 32,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
        backgroundColor: "#FFFFFF",
    },
    pageBtnActive: {
        backgroundColor: "#F3E8FF",
        borderColor: "#F3E8FF",
    },
    pageText: {
        fontSize: 12,
        color: "#0F172A",
        fontWeight: "600",
    },
    pageTextActive: {
        fontSize: 12,
        color: "#6D28D9",
        fontWeight: "700",
    },
    pageDots: {
        width: 24,
        justifyContent: "center",
        alignItems: "center",
    }
});
