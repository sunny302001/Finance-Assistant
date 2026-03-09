import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { withObservables } from '@nozbe/with-observables';
import { database } from '../../src/database';
import { Transaction } from '../../src/database/models';
import { Ionicons } from '@expo/vector-icons';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';

interface DashboardProps {
    transactions: Transaction[];
}

const Dashboard = ({ transactions }: DashboardProps) => {
    const recentTransactions = transactions.slice(0, 5);

    // Calculate Burn Rate (Simplified)
    const income = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
    const spending = Math.abs(transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0));

    const chartData = [
        { type: 'Income', amount: income, fill: '#10b981' },
        { type: 'Spend', amount: spending, fill: '#ef4444' },
    ];

    return (
        <ScrollView className="flex-1 bg-background p-4">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-text text-3xl font-bold">FinanceAssistant</Text>
                <Link href="/importer" asChild>
                    <TouchableOpacity className="bg-primary p-2 rounded-full">
                        <Ionicons name="add" size={28} color="#f8fafc" />
                    </TouchableOpacity>
                </Link>
            </View>

            {/* Burn Rate Chart */}
            <View className="bg-surface p-4 rounded-2xl mb-6 shadow-lg">
                <Text className="text-text-muted text-sm uppercase mb-2">Monthly Burn Rate</Text>
                <VictoryChart theme={VictoryTheme.material} domainPadding={20} height={200}>
                    <VictoryAxis
                        tickValues={['Income', 'Spend']}
                        style={{
                            axis: { stroke: 'transparent' },
                            tickLabels: { fill: '#94a3b8' },
                        }}
                    />
                    <VictoryBar
                        data={chartData}
                        x="type"
                        y="amount"
                        style={{
                            data: {
                                fill: ({ datum }) => datum.fill,
                                width: 40,
                            },
                        }}
                    />
                </VictoryChart>
            </View>

            {/* Recent Transactions */}
            <View className="mb-6">
                <Text className="text-text text-xl font-semibold mb-4">Recent Transactions</Text>
                {recentTransactions.length === 0 ? (
                    <Text className="text-text-muted text-center py-10">No transactions found. Import a statement to begin.</Text>
                ) : (
                    recentTransactions.map((tx) => (
                        <View key={tx.id} className="bg-surface p-4 rounded-xl mb-3 flex-row justify-between items-center">
                            <View>
                                <Text className="text-text font-medium">{tx.description}</Text>
                                <Text className="text-text-muted text-xs">{new Date(tx.date).toLocaleDateString()}</Text>
                            </View>
                            <Text className={`font-bold ${tx.amount > 0 ? 'text-accent' : 'text-danger'}`}>
                                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

// WatermelonDB enhancement to make component reactive
const enhance = withObservables([], () => ({
    transactions: database.get<Transaction>('transactions').query().observe(),
}));

export default enhance(Dashboard);
