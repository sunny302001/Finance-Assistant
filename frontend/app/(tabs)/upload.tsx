import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import { Colors } from '@/theme/colors';
import { uploadStatement } from '@/lib/api';
import type { UploadResponse } from '@/types';

export default function UploadScreen() {
    const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const pickDocument = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'text/csv',
                    'text/comma-separated-values',
                    'application/vnd.ms-excel',
                ],
                copyToCacheDirectory: true,
            });

            if (!res.canceled && res.assets && res.assets.length > 0) {
                setFile(res.assets[0]);
                setResult(null);
                setError(null);
                setPassword('');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleUpload = async (pass?: string) => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const response = await uploadStatement(
                file.uri,
                file.name || 'statement',
                file.mimeType || 'application/pdf',
                pass || password
            );

            if (response.status === 'success') {
                setIsProcessing(true);
                // Artificial delay to show AI processing state
                setTimeout(() => {
                    setResult(response);
                    setUploading(false);
                    setIsProcessing(false);
                    setFile(null);
                    setShowPasswordModal(false);
                    setPassword('');
                }, 1500);
            } else {
                setResult(response);
                setFile(null);
                setShowPasswordModal(false);
                setPassword('');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to upload file';
            const status = err.response?.data?.status;

            if (status === 'needs_password' || status === 'invalid_password') {
                setShowPasswordModal(true);
                if (status === 'invalid_password') {
                    Alert.alert('Invalid Password', 'The password you entered is incorrect. Please try again.');
                }
            } else {
                setError(errorMsg);
            }
        } finally {
            if (!isProcessing) {
                setUploading(false);
            }
        }
    };

    return (
        <View style={styles.container}>
            {/* Title */}
            <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>Upload Statement</Text>
                <Text style={styles.pageSubtitle}>
                    Upload your bank statement (PDF or CSV format)
                </Text>
            </View>

            {/* File Upload Card */}
            <Card>
                <CardHeader>
                    <CardTitle size="lg">File Upload</CardTitle>
                    <CardDescription>Supported banks: SBI, ICICI, HDFC (PDF/CSV)</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Pick File */}
                    <TouchableOpacity style={styles.dropZone} onPress={pickDocument}>
                        <Ionicons name="cloud-upload-outline" size={36} color={Colors.textMuted} />
                        <Text style={styles.dropZoneText}>Tap to choose file</Text>
                        <Text style={styles.dropZoneHint}>PDF or CSV up to 10MB</Text>
                    </TouchableOpacity>

                    {/* Selected File */}
                    {file && (
                        <View style={styles.fileRow}>
                            <Ionicons name="document-text" size={22} color={Colors.textSecondary} />
                            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                            <TouchableOpacity
                                style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                                onPress={() => handleUpload()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.uploadBtnText}>Upload</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Uploading indicator */}
                    {uploading && (
                        <View style={styles.statusRow}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.statusText}>
                                {isProcessing ? 'AI is categorizing transactions...' : 'Processing your statement...'}
                            </Text>
                        </View>
                    )}

                    {/* Success */}
                    {result && (
                        <View style={styles.successBox}>
                            <View style={styles.statusRow}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                <Text style={styles.successTitle}>Upload Successful!</Text>
                            </View>
                            <Text style={styles.resultText}>Bank: {result.bank_name}</Text>
                            <Text style={styles.resultText}>
                                Transactions found: {result.total_transactions}
                            </Text>
                            <Text style={styles.resultText}>
                                Processed: {result.processed_successfully}
                            </Text>
                            {result.failed > 0 && (
                                <Text style={styles.resultText}>Failed: {result.failed}</Text>
                            )}
                        </View>
                    )}

                    {/* Error */}
                    {error && (
                        <View style={styles.errorBox}>
                            <View style={styles.statusRow}>
                                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                                <Text style={styles.errorTitle}>Upload Failed</Text>
                            </View>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </CardContent>
            </Card>

            {/* How it Works */}
            <Card style={{ marginTop: 16 }}>
                <CardHeader>
                    <CardTitle size="lg">⚙️ How it Works</CardTitle>
                </CardHeader>
                <CardContent>
                    <Text style={styles.stepText}>1. 🏦 Your statement is parsed by bank-specific templates</Text>
                    <Text style={styles.stepText}>2. 🔒 All PII (dates, account numbers, IDs) is removed locally</Text>
                    <Text style={styles.stepText}>3. 💻 Ollama (local AI) identifies merchants and categorizes</Text>
                    <Text style={styles.stepText}>4. 💾 Data is saved to your local database</Text>
                    <Text style={styles.privacyNote}>
                        ✓ All processing happens on your machine - your data never leaves!
                    </Text>
                </CardContent>
            </Card>

            {/* Password Modal */}
            <Modal
                visible={showPasswordModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPasswordModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Password Required</Text>
                        <Text style={styles.modalSubtitle}>
                            This PDF is protected. Please enter the password provided by your bank.
                        </Text>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter password"
                            placeholderTextColor={Colors.textMuted}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoFocus
                        />

                        <View style={styles.hintContainer}>
                            <Text style={styles.hintTitle}>Common Bank Codes:</Text>
                            <Text style={styles.hintText}>• SBI: Last 5 digits of mobile number</Text>
                            <Text style={styles.hintText}>• HDFC: Customer ID (usually 8 digits)</Text>
                            <Text style={styles.hintText}>• ICICI: Usually DDMM (e.g. 15th Aug = 1508)</Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowPasswordModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, !password && styles.buttonDisabled]}
                                onPress={() => handleUpload()}
                                disabled={!password || uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Unlock</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 16,
    },
    titleSection: {
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },

    // Drop zone
    dropZone: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors.border,
        borderRadius: 12,
        paddingVertical: 28,
        alignItems: 'center',
        marginBottom: 12,
    },
    dropZoneText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: 8,
    },
    dropZoneHint: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },

    // File row
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated,
        padding: 12,
        borderRadius: 10,
        gap: 10,
        marginBottom: 12,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
    },
    uploadBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    uploadBtnDisabled: {
        opacity: 0.6,
    },
    uploadBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    // Status
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },

    // Success / Error
    successBox: {
        backgroundColor: Colors.savings.dark + '30',
        borderWidth: 1,
        borderColor: Colors.savings.main + '40',
        borderRadius: 10,
        padding: 14,
        marginTop: 4,
    },
    successTitle: {
        fontWeight: '700',
        color: Colors.savings.light,
        fontSize: 14,
    },
    resultText: {
        fontSize: 13,
        color: Colors.savings.light,
        marginTop: 2,
        marginLeft: 28,
    },
    errorBox: {
        backgroundColor: Colors.needs.dark + '30',
        borderWidth: 1,
        borderColor: Colors.needs.main + '40',
        borderRadius: 10,
        padding: 14,
        marginTop: 4,
    },
    errorTitle: {
        fontWeight: '700',
        color: Colors.needs.light,
        fontSize: 14,
    },
    errorText: {
        fontSize: 13,
        color: Colors.needs.light,
        marginTop: 2,
        marginLeft: 28,
    },

    // Steps
    stepText: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    privacyNote: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.savings.main,
        marginTop: 8,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    passwordInput: {
        padding: 12,
        color: Colors.text,
        fontSize: 16,
        marginBottom: 16,
    },
    hintContainer: {
        backgroundColor: Colors.primary + '15',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
    },
    hintTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    hintText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    cancelButtonText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
});
