import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export default function ErrorState({
    title = 'Connection Error',
    message = 'Could not connect to the server. Please check your network or backend connection.',
    onRetry,
    icon = 'cloud-offline-outline',
}: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={64} color={Colors.textMuted} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                    <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: Colors.background,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    retryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
