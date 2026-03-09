import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { withObservables } from '@nozbe/with-observables';
import { database } from '../../src/database';
import { Transaction, Category } from '../../src/database/models';
import { LocalLLMService, SpendingAdvice } from '../../src/services/LocalLLMService';
import { Ionicons } from '@expo/vector-icons';
import { VictoryPie, VictoryLabel } from 'victory-native';

const screenWidth = Dimensions.get('window').width;

interface AnalyzerProps {
    transactions: Transaction[];
    categories: Category[];
}

const AnalyzerScreen = ({ transactions, categories }: AnalyzerProps) => {
    const [advice, setAdvice] = useState<SpendingAdvice | null>(null);

    useEffect(() => {
        const fetchAdvice = async () => {
            const result = await LocalLLMService.getMonthlyAdvice(transactions);
            setAdvice(result);
        };
        fetchAdvice();
    }, [transactions]);

    const income = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
    const spend = Math.abs(transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0));

    // Prepare Pie Chart Data
    const categoryTotals: Record<string, number> = {};
    transactions.filter(t => t.amount < 0).forEach(tx => {
        const catName = categories.find(c => c.id === tx.categoryId)?.name || 'Other';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + Math.abs(tx.amount);
    });

    const pieData = Object.entries(categoryTotals).map(([name, total]) => ({
        x: name,
        y: total,
    }));

    const colorScale = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    return (
        <ScrollView className="flex-1 bg-background p-4">
            {/* AI Advice Card */}
            <View className="bg-surface p-6 rounded-3xl mb-6 shadow-xl border border-primary/10">
                <View className="flex-row items-center mb-4">
                    <View className="bg-primary/20 p-2 rounded-lg">
                        <Ionicons name="sparkles" size={24} color="#6366f1" />
                    </View>
                    <Text className="text-text text-xl font-bold ml-3">AI Spending Insights</Text>
                </View>

                {advice ? (
                    <View>
                        <Text className="text-text font-medium text-lg mb-3">{advice.summary}</Text>
                        {advice.savingTips.map((tip, i) => (
                            <View key={i} className="flex-row mb-2">
                                <Text className="text-accent mr-2">•</Text>
                                <Text className="text-text-muted flex-1">{tip}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text className="text-text-muted italic">Analyzing your transactions locally...</Text>
                )}

                <View className="mt-6 pt-4 border-t border-surface-2">
                    <Text className="text-text-muted text-[10px] uppercase tracking-widest font-bold">
                        On-Device Engine: Llama 3.2 1B (Quantized)
                    </Text>
                </View>
            </View>

            {/* Category Breakdown Pie Chart */}
            <View className="bg-surface p-4 rounded-3xl mb-6 items-center shadow-lg">
                <Text className="text-text font-bold text-lg self-start mb-2 ml-2">Category Breakdown</Text>
                {pieData.length > 0 ? (
                    <View className="items-center justify-center">
                        <VictoryPie
                            data={pieData}
                            width={screenWidth - 80}
                            height={300}
                            colorScale={colorScale}
                            innerRadius={70}
                            labelRadius={110}
                            style={{
                                labels: { fill: "#f8fafc", fontSize: 12, fontWeight: "bold" },
                                data: { stroke: "#1e293b", strokeWidth: 2 }
                            }}
                            padAngle={2}
                        />
                        <View className="absolute">
                            <Text className="text-text-muted text-xs text-center">Total Spend</Text>
                            <Text className="text-text text-xl font-bold text-center">${spend.toFixed(0)}</Text>
                        </View>
                    </View>
                ) : (
                    <Text className="text-text-muted py-10">No spending data to visualize.</Text>
                )}
            </View>

            {/* Stats Summary */}
            <View className="flex-row space-x-4 mb-10">
                <View className="flex-1 bg-accent/10 p-4 rounded-2xl border border-accent/20">
                    <Text className="text-accent text-xs uppercase font-bold mb-1">Income</Text>
                    <Text className="text-text text-lg font-bold">${income.toFixed(2)}</Text>
                </View>
                <View className="flex-1 bg-danger/10 p-4 rounded-2xl border border-danger/20">
                    <Text className="text-danger text-xs uppercase font-bold mb-1">Expenses</Text>
                    <Text className="text-text text-lg font-bold">${spend.toFixed(2)}</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const enhance = withObservables([], () => ({
    transactions: database.get<Transaction>('transactions').query().observe(),
    categories: database.get<Category>('categories').query().observe(),
}));

export default enhance(AnalyzerScreen);
