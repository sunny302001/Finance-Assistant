import { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Alert,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SwipeableRow from '@/components/common/SwipeableRow';
import { Colors, getCategoryColor } from '@/theme/colors';
import Skeleton from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getTransactions, deleteTransaction } from '@/lib/api';
import type { Transaction } from '@/types';

const CATEGORIES = ['All', 'Needs', 'Wants', 'Savings', 'Debt'];
const PAGE_SIZE = 30;

export default function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [error, setError] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchTransactions = useCallback(
        async (reset = false) => {
            const skip = reset ? 0 : transactions.length;
            try {
                const params: any = { skip, limit: PAGE_SIZE };
                if (search.trim()) params.merchant = search.trim();
                if (selectedCategory !== 'All') params.category = selectedCategory;

                const data = await getTransactions(params);

                if (reset) {
                    setTransactions(data);
                } else {
                    setTransactions((prev) => [...prev, ...data]);
                }
                setHasMore(data.length === PAGE_SIZE);
                setError(false);
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
                setError(true);
            } finally {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        },
        [search, selectedCategory, transactions.length]
    );

    // Initial load & filter changes
    useEffect(() => {
        setLoading(true);
        setTransactions([]);
        fetchTransactions(true);
    }, [selectedCategory]);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setLoading(true);
            setTransactions([]);
            fetchTransactions(true);
        }, 500);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [search]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTransactions(true);
    }, [fetchTransactions]);

    const onEndReached = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            setLoadingMore(true);
            fetchTransactions(false);
        }
    }, [loadingMore, hasMore, loading, fetchTransactions]);

    const handleDelete = useCallback(
        (id: number) => {
            Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTransaction(id);
                            setTransactions((prev) => prev.filter((t) => t.id !== id));
                        } catch {
                            Alert.alert('Error', 'Failed to delete transaction');
                        }
                    },
                },
            ]);
        },
        []
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Title */}
            <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>Transactions</Text>
                <Text style={styles.pageSubtitle}>
                    {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by merchant..."
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
            >
                {CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat;
                    const catColor =
                        cat === 'All' ? Colors.primary : getCategoryColor(cat).main;
                    return (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.chip,
                                active && { backgroundColor: catColor, borderColor: catColor },
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    active && { color: '#fff' },
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {error && transactions.length === 0 ? (
                <ErrorState onRetry={() => fetchTransactions(true)} />
            ) : loading && !refreshing ? (
                <View style={styles.listContent}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <View key={i} style={[styles.txRow, { borderStyle: 'dashed' }]}>
                            <Skeleton width={42} height={42} borderRadius={12} style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                                <Skeleton width="40%" height={12} />
                            </View>
                            <Skeleton width={60} height={20} />
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <SwipeableRow onDelete={() => handleDelete(item.id)}>
                            <TransactionRow item={item} />
                        </SwipeableRow>
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
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={52} color={Colors.textMuted} />
                            <Text style={styles.emptyTitle}>No transactions found</Text>
                            <Text style={styles.emptySubtitle}>
                                {search || selectedCategory !== 'All'
                                    ? 'Try adjusting your filters'
                                    : 'Upload a statement to get started'}
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator
                                size="small"
                                color={Colors.primary}
                                style={{ paddingVertical: 16 }}
                            />
                        ) : null
                    }
                />
            )}
        </View>
    );
}

// ── Transaction Row ──
function TransactionRow({
    item,
}: {
    item: Transaction;
}) {
    const isCredit = item.transaction_type === 'credit';
    const catColor = getCategoryColor(item.category || '').main;

    return (
        <View style={styles.txRow}>
            {/* Left: icon */}
            <View style={[styles.txIcon, { backgroundColor: catColor + '20' }]}>
                <Text style={{ fontSize: 16 }}>
                    {item.category === 'Needs'
                        ? '🏠'
                        : item.category === 'Wants'
                            ? '🎮'
                            : item.category === 'Savings'
                                ? '💰'
                                : item.category === 'Debt'
                                    ? '💳'
                                    : '📄'}
                </Text>
            </View>

            {/* Middle: info */}
            <View style={styles.txInfo}>
                <Text style={styles.txMerchant} numberOfLines={1}>
                    {item.merchant_name || item.sanitized_description || item.raw_description}
                </Text>
                <View style={styles.txMeta}>
                    <Text style={styles.txDate}>{formatDate(item.date)}</Text>
                    {item.category && (
                        <View style={[styles.txCategoryBadge, { backgroundColor: catColor + '25' }]}>
                            <Text style={[styles.txCategoryText, { color: catColor }]}>
                                {item.category}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Right: amount */}
            <Text
                style={[
                    styles.txAmount,
                    { color: isCredit ? Colors.savings.main : Colors.needs.main },
                ]}
            >
                {isCredit ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
            </Text>
        </View>
    );
}

// ── Styles ──
const styles = StyleSheet.create({
    container: {
        flex: 1,
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

    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: 16,
        marginBottom: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border + '40',
    },
    searchInput: {
        flex: 1,
        color: Colors.text,
        fontSize: 15,
        padding: 0,
    },

    // Chips
    chipRow: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },

    // List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Transaction row
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 14,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.border + '25',
    },
    txIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
        marginRight: 8,
    },
    txMerchant: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    txMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    txDate: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    txCategoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    txCategoryText: {
        fontSize: 11,
        fontWeight: '700',
    },
    txAmount: {
        fontSize: 15,
        fontWeight: '700',
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
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
});
