import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { withObservables } from '@nozbe/with-observables';
import { database } from '../../src/database';
import { Goal } from '../../src/database/models';
import { Ionicons } from '@expo/vector-icons';

interface GoalsProps {
    goals: Goal[];
}

const GoalsScreen = ({ goals }: GoalsProps) => {
    return (
        <View className="flex-1 bg-background p-4">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-text text-2xl font-bold">Savings Goals</Text>
                <TouchableOpacity className="bg-accent/20 p-2 rounded-lg">
                    <Ionicons name="add" size={24} color="#10b981" />
                </TouchableOpacity>
            </View>

            <ScrollView>
                {goals.length === 0 ? (
                    <View className="bg-surface p-10 rounded-2xl items-center">
                        <Ionicons name="flag-outline" size={60} color="#94a3b8" />
                        <Text className="text-text-muted text-center mt-4">
                            Setting goals helps you save faster. Add your first goal to get started!
                        </Text>
                    </View>
                ) : (
                    goals.map((goal) => (
                        <View key={goal.id} className="bg-surface p-5 rounded-2xl mb-4 shadow-sm">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-text font-bold text-lg">{goal.name}</Text>
                                <Text className="text-accent font-bold">${goal.targetAmount}</Text>
                            </View>

                            <View className="w-full h-3 bg-surface-2 rounded-full overflow-hidden mb-2">
                                <View
                                    className="h-full bg-accent"
                                    style={{ width: `${goal.progressPercent}%` }}
                                />
                            </View>

                            <View className="flex-row justify-between">
                                <Text className="text-text-muted text-sm">
                                    ${goal.currentAmount} saved
                                </Text>
                                <Text className="text-text-muted text-sm">
                                    {Math.round(goal.progressPercent)}%
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const enhance = withObservables([], () => ({
    goals: database.get<Goal>('goals').query().observe(),
}));

export default enhance(GoalsScreen);
