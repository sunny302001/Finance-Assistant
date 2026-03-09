import React, { useEffect } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
}

export default function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
    const pulseAnim = new Animated.Value(0.3);

    useEffect(() => {
        const pulse = Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 0.7,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
                toValue: 0.3,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]);

        Animated.loop(pulse).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                    opacity: pulseAnim,
                },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.border,
    },
});
