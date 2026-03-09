import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';
import Skeleton from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, getCategoryColor } from '@/theme/colors';
import { formatCurrency } from '@/lib/utils';
import { getSpendingOverview, getBudgetAnalysis, getMonthlyTrend } from '@/lib/api';
import type { SpendingOverview, BudgetAnalysis, MonthlyTrend } from '@/types';

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const [overview, setOverview] = useState<SpendingOverview | null>(null);
    const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
    const [trend, setTrend] = useState<MonthlyTrend | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [overviewData, analysisData, trendData] = await Promise.all([
                getSpendingOverview(),
                getBudgetAnalysis({ include_advice: true }),
                getMonthlyTrend(6),
            ]);
            setOverview(overviewData);
            setAnalysis(analysisData);
            setTrend(trendData);
            setError(false);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.titleSection}>
                    <Skeleton width={180} height={32} style={{ marginBottom: 8 }} />
                    <Skeleton width={120} height={16} />
                </View>

                <View style={styles.metricsContainer}>
                    <View style={styles.metricsRow}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Skeleton height={140} borderRadius={20} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Skeleton height={140} borderRadius={20} />
                        </View>
                    </View>
                    <Skeleton height={100} borderRadius={20} style={{ marginTop: 12 }} />
                </View>

                <View style={{ padding: 16 }}>
                    <Skeleton height={240} borderRadius={24} style={{ marginBottom: 16 }} />
                    <Skeleton height={300} borderRadius={24} />
                </View>
            </View>
        );
    }

    if (error && !overview) {
        return <ErrorState onRetry={fetchData} />;
    }

    if (!overview || !analysis || !trend) return null;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                    colors={[Colors.primary]}
                />
            }
        >
            {/* Page Title */}
            <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>Dashboard</Text>
                <Text style={styles.pageSubtitle}>
                    Welcome to your personal finance overview
                </Text>
            </View>

            {/* Summary Cards */}
            <View style={styles.cardGrid}>
                <SummaryCard
                    title="Total Income"
                    value={overview ? formatCurrency(overview.total_income) : '₹0'}
                    subtitle={`${overview?.total_transactions || 0} transactions`}
                    icon="trending-up"
                    iconColor={Colors.savings.main}
                />
                <SummaryCard
                    title="Total Expenses"
                    value={overview ? formatCurrency(overview.total_expenses) : '₹0'}
                    subtitle="All categories"
                    icon="trending-down"
                    iconColor={Colors.needs.main}
                />
                <SummaryCard
                    title="Net Savings"
                    value={overview ? formatCurrency(overview.net_savings) : '₹0'}
                    subtitle={`${overview ? overview.savings_rate.toFixed(1) : '0'}% savings rate`}
                    icon="wallet"
                    iconColor={Colors.savings.main}
                />
                <SummaryCard
                    title="Budget Status"
                    value={`${analysis ? Object.keys(analysis.category_totals).length : 0}`}
                    subtitle="Active categories"
                    icon="pie-chart"
                    iconColor={Colors.primary}
                />
            </View>

            {/* Monthly Trend Chart */}
            {trend && trend.months.length > 1 && (
                <Card style={styles.sectionCard}>
                    <CardHeader>
                        <CardTitle size="lg">Spending Trend</CardTitle>
                        <CardDescription>Monthly expenses by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={{
                                    labels: trend.months.map(m => m.split('-')[1]), // Just month number
                                    datasets: [
                                        {
                                            data: (trend['Needs'] as number[]) || [],
                                            color: (opacity = 1) => getCategoryColor('Needs').main,
                                            strokeWidth: 2
                                        },
                                        {
                                            data: (trend['Wants'] as number[]) || [],
                                            color: (opacity = 1) => getCategoryColor('Wants').main,
                                            strokeWidth: 2
                                        },
                                        {
                                            data: (trend['Savings'] as number[]) || [],
                                            color: (opacity = 1) => getCategoryColor('Savings').main,
                                            strokeWidth: 2
                                        }
                                    ],
                                    legend: ['Needs', 'Wants', 'Savings']
                                }}
                                width={Dimensions.get('window').width * 1.2}
                                height={220}
                                chartConfig={{
                                    backgroundColor: Colors.surface,
                                    backgroundGradientFrom: Colors.surface,
                                    backgroundGradientTo: Colors.surface,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                    labelColor: (opacity = 1) => Colors.textSecondary,
                                    style: {
                                        borderRadius: 16
                                    },
                                    propsForDots: {
                                        r: "4",
                                        strokeWidth: "2",
                                        stroke: Colors.primary
                                    }
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </ScrollView>
                    </CardContent>
                </Card>
            )}

            {/* Category Breakdown */}
            {analysis && Object.keys(analysis.category_totals).length > 0 && (
                <Card style={styles.sectionCard}>
                    <CardHeader>
                        <CardTitle size="lg">Spending Breakdown</CardTitle>
                        <CardDescription>Visual overview of your expenses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <View style={styles.chartContainer}>
                            <PieChart
                                data={Object.entries(analysis.category_totals).map(([name, data]) => ({
                                    name: name,
                                    total: data.total,
                                    color: getCategoryColor(name).main,
                                    legendFontColor: Colors.textSecondary,
                                    legendFontSize: 12,
                                }))}
                                width={Dimensions.get('window').width - 64}
                                height={200}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                }}
                                accessor="total"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                                hasLegend={true}
                            />
                        </View>

                        <View style={styles.categoryList}>
                            {Object.entries(analysis.category_totals).map(([category, data]) => (
                                <View key={category} style={styles.categoryRow}>
                                    <View style={styles.categoryHeader}>
                                        <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category).main }]} />
                                        <Text style={styles.categoryName}>{category}</Text>
                                        <Text style={styles.categoryValue}>
                                            {formatCurrency(data.total)} ({data.percentage.toFixed(1)}%)
                                        </Text>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${Math.min(data.percentage, 100)}%`,
                                                    backgroundColor: getCategoryColor(category).main,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </CardContent>
                </Card>
            )}

            {/* AI Advice */}
            {analysis?.llm_advice && (
                <Card style={styles.sectionCard}>
                    <CardHeader>
                        <CardTitle size="lg">💡 AI Financial Advice</CardTitle>
                        <CardDescription>Personalized insights from local AI</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Text style={styles.adviceText}>{analysis.llm_advice}</Text>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {(!overview || overview.total_transactions === 0) && (
                <Card style={styles.sectionCard}>
                    <CardContent style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyTitle}>No transactions yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Upload your first bank statement to get started
                        </Text>
                    </CardContent>
                </Card>
            )}
        </ScrollView>
    );
}

// ── Mini Summary Card ──
function SummaryCard({
    title,
    value,
    subtitle,
    icon,
    iconColor,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
}) {
    return (
        <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>{title}</Text>
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summarySubtitle}>{subtitle}</Text>
        </View>
    );
}

// ── Styles ──
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 12,
        color: Colors.textSecondary,
        fontSize: 14,
    },
    titleSection: {
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },

    // Card Grid
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        minWidth: '46%',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border + '40',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    summarySubtitle: {
        fontSize: 11,
        color: Colors.textMuted,
        marginTop: 2,
    },

    metricsContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    metricsRow: {
        flexDirection: 'row',
    },
    // Category breakdown
    sectionCard: {
        marginBottom: 16,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    categoryList: {
        marginTop: 10,
    },
    categoryRow: {
        marginBottom: 14,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    categoryName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    categoryValue: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.surfaceElevated,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 6,
        borderRadius: 3,
    },

    // Advice
    adviceText: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
});
