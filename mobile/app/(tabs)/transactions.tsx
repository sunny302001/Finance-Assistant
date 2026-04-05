import React from 'react';
import { View, Text, FlatList, ListRenderItem, StyleSheet } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { Transaction } from '../../src/database/models/Transaction';
import { Category } from '../../src/database/models/Category';
import { Ionicons } from '@expo/vector-icons';
import { of as of$ } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// ─── Color system for category badges ────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Income:         { bg: '#064e3b', text: '#34d399', border: '#065f46' },
  Housing:        { bg: '#1e3a5f', text: '#60a5fa', border: '#1e40af' },
  'Food & Dining': { bg: '#422006', text: '#fbbf24', border: '#78350f' },
  Transport:      { bg: '#1e3a5f', text: '#60a5fa', border: '#1e40af' },
  Utilities:      { bg: '#1e3a5f', text: '#60a5fa', border: '#1e40af' },
  Subscriptions:  { bg: '#4c1d95', text: '#c4b5fd', border: '#5b21b6' },
  Miscellaneous:  { bg: '#1e293b', text: '#94a3b8', border: '#334155' },
};

const DEFAULT_BADGE = { bg: '#1e293b', text: '#94a3b8', border: '#334155' };

function getBadgeColors(categoryName: string | undefined, isNeed: boolean | undefined) {
  if (!categoryName) return DEFAULT_BADGE;

  // Income always gets green
  if (categoryName === 'Income') return CATEGORY_COLORS.Income;

  // For expenses: Needs = blue, Wants = red/purple tones
  if (isNeed === true) {
    return CATEGORY_COLORS[categoryName] ?? { bg: '#1e3a5f', text: '#60a5fa', border: '#1e40af' };
  }
  if (isNeed === false) {
    return CATEGORY_COLORS[categoryName] ?? { bg: '#4c1d95', text: '#c4b5fd', border: '#5b21b6' };
  }

  return CATEGORY_COLORS[categoryName] ?? DEFAULT_BADGE;
}

// ─── Category Badge Component ────────────────────────────────────────────────
interface CategoryBadgeProps {
  category: Category | null;
}

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const name = category?.name;
  const isNeed = category?.isNeed;
  const colors = getBadgeColors(name, isNeed);
  const icon = category?.icon;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      {icon ? (
        <Text style={styles.badgeIcon}>{icon}</Text>
      ) : null}
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {name ?? 'Uncategorized'}
      </Text>
    </View>
  );
};

// ─── Need/Want indicator pill ────────────────────────────────────────────────
const NeedWantPill = ({ isNeed }: { isNeed?: boolean }) => {
  if (isNeed === undefined || isNeed === null) return null;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: isNeed ? '#1e3a5f22' : '#4c1d9522' },
      ]}
    >
      <View
        style={[
          styles.pillDot,
          { backgroundColor: isNeed ? '#60a5fa' : '#c4b5fd' },
        ]}
      />
      <Text
        style={[
          styles.pillText,
          { color: isNeed ? '#60a5fa' : '#c4b5fd' },
        ]}
      >
        {isNeed ? 'Need' : 'Want'}
      </Text>
    </View>
  );
};

// ─── Transaction Item ────────────────────────────────────────────────────────
interface TransactionItemProps {
  transaction: Transaction;
  category: Category | null;
}

const EnhancedTransactionItem = withObservables(
  ['transaction'],
  ({ transaction }: { transaction: Transaction }) => ({
    transaction: transaction.observe(),
    // Reactively resolve the related category
    category: transaction.observe().pipe(
      switchMap((tx: Transaction) => {
        if (tx.categoryId) {
          try {
            return database
              .get<Category>('categories')
              .findAndObserve(tx.categoryId);
          } catch {
            return of$(null);
          }
        }
        return of$(null);
      }),
    ),
  }),
)(({ transaction, category }: TransactionItemProps) => {
  const dateStr = new Date(transaction.date).toLocaleDateString();
  const isExpense = transaction.amount < 0;

  return (
    <View style={styles.card}>
      {/* Left: icon + text */}
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isExpense
                ? 'rgba(239,68,68,0.1)'
                : 'rgba(34,197,94,0.1)',
            },
          ]}
        >
          <Ionicons
            name={isExpense ? 'arrow-down' : 'arrow-up'}
            size={18}
            color={isExpense ? '#ef4444' : '#22c55e'}
          />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{dateStr}</Text>
            <CategoryBadge category={category} />
          </View>
        </View>
      </View>

      {/* Right: amount + need/want */}
      <View style={styles.cardRight}>
        <Text
          style={[
            styles.amount,
            { color: isExpense ? '#ef4444' : '#22c55e' },
          ]}
        >
          {isExpense ? '-' : '+'}₹{Math.abs(transaction.amount).toFixed(2)}
        </Text>
        <NeedWantPill isNeed={category?.isNeed} />
      </View>
    </View>
  );
});

// ─── Screen ──────────────────────────────────────────────────────────────────
const TransactionsScreen = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const renderItem: ListRenderItem<Transaction> = ({ item }) => (
    <EnhancedTransactionItem transaction={item} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>{transactions.length} total records</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#60a5fa' }]} />
            <Text style={styles.legendText}>Need</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#c4b5fd' }]} />
            <Text style={styles.legendText}>Want</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#334155" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>
              Import a statement to see your data here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const enhance = withObservables([], () => ({
  transactions: database.collections
    .get<Transaction>('transactions')
    .query()
    .observe(),
}));

export default enhance(TransactionsScreen);

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#94a3b8',
    fontSize: 11,
  },

  // Card
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  description: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  date: {
    color: '#94a3b8',
    fontSize: 12,
  },

  // Right side
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Need/Want pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    color: '#94a3b8',
    fontSize: 20,
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
});
