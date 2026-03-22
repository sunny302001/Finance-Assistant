import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { IngestionService } from '../../src/services/IngestionService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';

export default function ImporterScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [result, setResult] = useState<{ count: number } | null>(null);
    const { setImporting } = useStore();

    const handlePick = async () => {
        try {
            setLoading(true);
            setImporting(true);
            setResult(null);
            
            const count = await IngestionService.pickAndProcess((step) => {
                setStatus(step);
            });

            if (count > 0) {
                setResult({ count });
                setStatus("Import Complete!");
            }
        } catch (error: any) {
            Alert.alert("Import Error", error.message || "Failed to process document");
            setStatus("Import Failed");
        } finally {
            setLoading(false);
            setImporting(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background">
            <View className="flex-1 justify-center items-center p-6">
                <View className="bg-surface p-8 rounded-3xl items-center w-full shadow-2xl">
                    <View className="bg-primary/10 p-6 rounded-full mb-6">
                        <Ionicons name="document-text-outline" size={80} color="#6366f1" />
                    </View>
                    
                    <Text className="text-text text-3xl font-bold text-center mb-2">Import Statement</Text>
                    <Text className="text-text-muted text-center mb-8 text-lg">
                        Upload a PDF or CSV bank statement. We'll parse it 100% offline using on-device OCR.
                    </Text>

                    {!result ? (
                        <TouchableOpacity
                            onPress={handlePick}
                            disabled={loading}
                            className={`bg-primary w-full py-5 rounded-2xl items-center flex-row justify-center shadow-lg ${loading ? 'opacity-50' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="cloud-upload" size={24} color="#fff" />
                            )}
                            <Text className="text-white font-bold text-xl ml-3">
                                {loading ? "Processing..." : "Select Document"}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="w-full">
                            <View className="bg-green-500/10 p-6 rounded-2xl items-center mb-6 border border-green-500/20">
                                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
                                <Text className="text-text text-xl font-bold mt-2">Success!</Text>
                                <Text className="text-text-muted text-center mt-1">
                                    Successfully imported {result.count} transactions to your local database.
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                onPress={() => router.push("/(tabs)/transactions")}
                                className="bg-primary w-full py-5 rounded-2xl items-center flex-row justify-center shadow-lg"
                            >
                                <Text className="text-white font-bold text-xl">View Transactions</Text>
                                <Ionicons name="arrow-forward" size={24} color="#fff" className="ml-2" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => setResult(null)}
                                className="w-full py-4 mt-2 items-center"
                            >
                                <Text className="text-primary font-semibold">Import Another</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {loading && status && (
                        <View className="mt-8 items-center">
                            <Text className="text-accent text-lg font-medium animate-pulse">{status}</Text>
                            <View className="flex-row mt-4 space-x-2">
                                <View className={`h-2 w-2 rounded-full ${status === 'Scanning Document...' ? 'bg-primary' : 'bg-slate-700'}`} />
                                <View className={`h-2 w-2 rounded-full ${status === 'Parsing Data...' ? 'bg-primary' : 'bg-slate-700'}`} />
                                <View className={`h-2 w-2 rounded-full ${status === 'Saving to Database...' ? 'bg-primary' : 'bg-slate-700'}`} />
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
