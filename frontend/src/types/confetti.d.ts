declare module 'react-native-confetti-cannon' {
    import React from 'react';
    import { ViewStyle } from 'react-native';

    interface ConfettiCannonProps {
        count: number;
        origin: { x: number; y: number };
        fadeOut?: boolean;
        explosionSpeed?: number;
        fallSpeed?: number;
        colors?: string[];
        autoStart?: boolean;
        onAnimationStart?: () => void;
        onAnimationEnd?: () => void;
    }

    export default class ConfettiCannon extends React.Component<ConfettiCannonProps> {}
}
