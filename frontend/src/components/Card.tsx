import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/theme/colors';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

interface CardHeaderProps {
    children: React.ReactNode;
    row?: boolean;
    style?: ViewStyle;
}

interface CardTitleProps {
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    style?: TextStyle;
}

interface CardDescriptionProps {
    children: React.ReactNode;
    style?: TextStyle;
}

interface CardContentProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
    return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({ children, row, style }: CardHeaderProps) {
    return (
        <View style={[styles.header, row && styles.headerRow, style]}>
            {children}
        </View>
    );
}

export function CardTitle({ children, size = 'md', style }: CardTitleProps) {
    const fontSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
    return (
        <Text style={[styles.title, { fontSize }, style]}>{children}</Text>
    );
}

export function CardDescription({ children, style }: CardDescriptionProps) {
    return <Text style={[styles.description, style]}>{children}</Text>;
}

export function CardContent({ children, style }: CardContentProps) {
    return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border + '40',
        overflow: 'hidden',
    },
    header: {
        padding: 16,
        paddingBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        color: Colors.text,
        fontWeight: '700',
    },
    description: {
        color: Colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    content: {
        padding: 16,
        paddingTop: 8,
    },
});
