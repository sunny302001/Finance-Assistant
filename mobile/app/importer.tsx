import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { IngestionService } from '../src/services/IngestionService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';

export default function ImporterScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { setImporting } = useStore();

    const handlePick = async () => {
        try {
            setLoading(true);
            setImporting(true);
            await IngestionService.pickAndProcess();
            Alert.alert("Success", "Statement processed and transactions imported!");
            router.back();
        } catch (error: any) {
            Alert.alert("Import Error", error.message || "Failed to process document");
        } finally {
            setLoading(false);
            setImporting(false);
        }
    };

    return (
        <View className="flex-1 bg-background justify-center items-center p-6">
            <View className="bg-surface p-8 rounded-3xl items-center w-full shadow-2xl">
                <Ionicons name="document-text-outline" size={80} color="#6366f1" />
                <Text className="text-text text-2xl font-bold mt-4 mb-2">Import Statement</Text>
                <Text className="text-text-muted text-center mb-8">
                    Upload a PDF or CSV bank statement. We'll parse it 100% offline using on-device OCR.
                </Text>

                <TouchableOpacity
                    onPress={handlePick}
                    disabled={loading}
                    className={`bg-primary w-full py-4 rounded-xl items-center flex-row justify-center space-x-2 ${loading ? 'opacity-50' : ''}`}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload" size={24} color="#fff" />
                            <Text className="text-white font-bold text-lg ml-2">Select Document</Text>
                        </>
                    )}
                </TouchableOpacity>

                {loading && (
                    <Text className="text-accent mt-4 animate-pulse">Running OCR & Categorization...</Text>
                )}
            </View>
        </View>
    );
}
