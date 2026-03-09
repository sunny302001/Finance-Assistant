import React, { ReactNode } from 'react';
import { StyleSheet, View, Animated, Text, TouchableOpacity } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/theme/colors';

interface SwipeableRowProps {
    children: ReactNode;
    onDelete: () => void;
    deleteLabel?: string;
}

export default function SwipeableRow({ children, onDelete, deleteLabel = 'Delete' }: SwipeableRowProps) {
    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
        });

        return (
            <RectButton style={styles.rightAction} onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                onDelete();
            }}>
                <Animated.View style={[styles.actionContent, { transform: [{ translateX: trans }] }]}>
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                    <Text style={styles.actionText}>{deleteLabel}</Text>
                </Animated.View>
            </RectButton>
        );
    };

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            friction={2}
            rightThreshold={40}
            onSwipeableWillOpen={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
        >
            {children}
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    rightAction: {
        backgroundColor: Colors.needs.main,
        justifyContent: 'center',
        alignItems: 'flex-end',
        width: 100,
        borderRadius: 16,
        marginBottom: 12, // Match card margin
    },
    actionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
    },
    actionText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        backgroundColor: 'transparent',
    },
});
