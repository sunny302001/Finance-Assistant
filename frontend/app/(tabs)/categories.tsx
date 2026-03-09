import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { Colors } from '@/theme/colors';
import { getCategories, updateCategory, getBudgetAnalysis } from '@/lib/api';
import type { Category, BudgetAnalysis } from '@/types';

export default function CategoriesScreen() {
    const insets = useSafeAreaInsets();
    const [categories, setCategories] = useState<Category[]>([]);
    const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [cats, budgetData] = await Promise.all([
                getCategories(),
                getBudgetAnalysis(),
            ]);
            setCategories(cats);
            setAnalysis(budgetData);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            Alert.alert('Connection Error', 'Could not load category data.');
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
                    <Skeleton width={220} height={16} />
                </View>

                <View style={styles.summaryBanner}>
                    <View style={styles.summaryItem}>
                        <Skeleton width={40} height={12} style={{ marginBottom: 6 }} />
                        <Skeleton width={80} height={20} />
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Skeleton width={40} height={12} style={{ marginBottom: 6 }} />
                        <Skeleton width={80} height={20} />
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Skeleton width={60} height={12} style={{ marginBottom: 6 }} />
                        <Skeleton width={60} height={20} />
                    </View>
                </View>

                <View style={styles.listContent}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.catCard}>
                            <View style={[styles.catHeader, { marginBottom: 12 }]}>
                                <Skeleton width={12} height={12} borderRadius={6} style={{ marginRight: 10 }} />
                                <Skeleton width={80} height={18} />
                            </View>
                            <Skeleton height={8} borderRadius={4} style={{ marginBottom: 16 }} />
                            <Skeleton height={8} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    if (error && !analysis) {
        return <ErrorState onRetry={fetchData} />;
    }

    if (!categories.length || !analysis) return null;

    // Merge category data with actual spending
    const enrichedCategories = categories.map((cat) => {
        const actual = analysis?.category_totals?.[cat.name];
        return {
            ...cat,
            actualPercentage: actual?.percentage ?? 0,
            actualTotal: actual?.total ?? 0,
        };
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>Categories</Text>
                <Text style={styles.pageSubtitle}>Manage your budget categories</Text>
            </View>

            {/* Summary banner */}
            {analysis && (
                <View style={styles.summaryBanner}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Income</Text>
                        <Text style={styles.summaryValue}>
                            ₹{analysis.total_income.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Expenses</Text>
                        <Text style={styles.summaryValue}>
                            ₹{analysis.total_expenses.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Savings Rate</Text>
                        <Text style={[styles.summaryValue, { color: Colors.savings.main }]}>
                            {analysis.savings_rate.toFixed(1)}%
                        </Text>
                    </View>
                </View>
            )}

            <FlatList
                data={enrichedCategories}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <CategoryCard category={item} onUpdated={fetchData} />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="grid-outline" size={52} color={Colors.textMuted} />
                        <Text style={styles.emptyTitle}>No categories</Text>
                    </View>
                }
            />
        </View>
    );
}

// ── Category Card ──
function CategoryCard({
    category,
    onUpdated,
}: {
    category: Category & { actualPercentage: number; actualTotal: number };
    onUpdated: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [targetInput, setTargetInput] = useState(String(category.target_percentage));
    const [saving, setSaving] = useState(false);

    const catColorMap: Record<string, string> = {
        Needs: Colors.needs.main,
        Wants: Colors.wants.main,
        Savings: Colors.savings.main,
        Debt: Colors.debt.main,
    };
    const color = catColorMap[category.name] || category.color || Colors.primary;

    const diff = category.actualPercentage - category.target_percentage;
    const status =
        Math.abs(diff) < 2 ? 'on_target' : diff > 0 ? 'over' : 'under';
    const statusConfig = {
        on_target: { label: 'On Target', icon: 'checkmark-circle' as const, color: Colors.savings.main },
        over: { label: 'Over Budget', icon: 'arrow-up-circle' as const, color: Colors.needs.main },
        under: { label: 'Under Budget', icon: 'arrow-down-circle' as const, color: Colors.savings.main },
    };
    const st = statusConfig[status];

    const handleSave = async () => {
        const val = parseFloat(targetInput);
        if (isNaN(val) || val < 0 || val > 100) {
            Alert.alert('Error', 'Enter a value between 0 and 100');
            return;
        }
        setSaving(true);
        try {
            await updateCategory(category.id, { target_percentage: val });
            setEditing(false);
            onUpdated();
        } catch {
            Alert.alert('Error', 'Failed to update category');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.catCard}>
            {/* Header */}
            <View style={styles.catHeader}>
                <View style={[styles.catDot, { backgroundColor: color }]} />
                <Text style={styles.catName}>{category.name}</Text>
                <View style={styles.statusChip}>
                    <Ionicons name={st.icon} size={14} color={st.color} />
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>

            {/* Description */}
            {category.description && (
                <Text style={styles.catDesc}>{category.description}</Text>
            )}

            {/* Dual bars */}
            <View style={styles.barSection}>
                <View style={styles.barRow}>
                    <Text style={styles.barLabel}>Target</Text>
                    <View style={styles.barBg}>
                        <View
                            style={[
                                styles.barFill,
                                {
                                    width: `${Math.min(category.target_percentage, 100)}%`,
                                    backgroundColor: color + '60',
                                },
                            ]}
                        />
                    </View>
                    {editing ? (
                        <View style={styles.editRow}>
                            <TextInput
                                style={styles.editInput}
                                value={targetInput}
                                onChangeText={setTargetInput}
                                keyboardType="numeric"
                                autoFocus
                            />
                            <TouchableOpacity onPress={handleSave} disabled={saving}>
                                <Ionicons name="checkmark" size={20} color={Colors.savings.main} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEditing(false)}>
                                <Ionicons name="close" size={20} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => setEditing(true)} style={styles.percTouch}>
                            <Text style={styles.barPerc}>{category.target_percentage}%</Text>
                            <Ionicons name="pencil" size={12} color={Colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.barRow}>
                    <Text style={styles.barLabel}>Actual</Text>
                    <View style={styles.barBg}>
                        <View
                            style={[
                                styles.barFill,
                                {
                                    width: `${Math.min(category.actualPercentage, 100)}%`,
                                    backgroundColor: color,
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.barPerc}>{category.actualPercentage.toFixed(1)}%</Text>
                </View>
            </View>

            {/* Spending total */}
            {category.actualTotal > 0 && (
                <Text style={styles.catTotal}>
                    ₹{category.actualTotal.toLocaleString('en-IN')} spent
                </Text>
            )}
        </View>
    );
}

// ── Styles ──
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    titleSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },

    // Summary banner
    summaryBanner: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border + '30',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 11,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: Colors.border + '40',
        marginVertical: 2,
    },

    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },

    // Category card
    catCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border + '30',
    },
    catHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    catDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    catName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    catDesc: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 10,
        marginLeft: 22,
    },

    // Bars
    barSection: {
        gap: 10,
        marginTop: 4,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    barLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        width: 46,
    },
    barBg: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.surfaceElevated,
        overflow: 'hidden',
        marginRight: 8,
    },
    barFill: {
        height: 8,
        borderRadius: 4,
    },
    barPerc: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        width: 48,
        textAlign: 'right',
    },
    percTouch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        width: 60,
        justifyContent: 'flex-end',
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        width: 80,
        justifyContent: 'flex-end',
    },
    editInput: {
        backgroundColor: Colors.surfaceElevated,
        color: Colors.text,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 13,
        width: 42,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '60',
    },

    catTotal: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 10,
        marginLeft: 22,
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 12,
    },
});
