import React from 'react';
import { View, Text, FlatList, ListRenderItem } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../../src/database';
import { Transaction } from '../../src/database/models/Transaction';
import { Ionicons } from '@expo/vector-icons';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem = withObservables(['transaction'], ({ transaction }: TransactionItemProps) => ({
  transaction: transaction.observe(),
}))(({ transaction }: TransactionItemProps) => {
  const dateStr = new Date(transaction.date).toLocaleDateString();
  const isExpense = transaction.amount < 0;

  return (
    <View className="bg-surface p-4 rounded-2xl mb-3 flex-row items-center justify-between border border-slate-800">
      <View className="flex-row items-center flex-1">
        <View className={`p-3 rounded-full mr-4 ${isExpense ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
          <Ionicons 
            name={isExpense ? "arrow-down" : "arrow-up"} 
            size={20} 
            color={isExpense ? "#ef4444" : "#22c55e"} 
          />
        </View>
        <View className="flex-1">
          <Text className="text-text font-semibold text-lg" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text className="text-text-muted text-sm">{dateStr}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className={`font-bold text-lg ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
          {isExpense ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
        </Text>
      </View>
    </View>
  );
});

const TransactionsScreen = ({ transactions }: { transactions: Transaction[] }) => {
  const renderItem: ListRenderItem<Transaction> = ({ item }) => (
    <TransactionItem transaction={item} />
  );

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-6 flex-row justify-between items-end">
        <View>
          <Text className="text-text text-3xl font-bold">Transactions</Text>
          <Text className="text-text-muted">{transactions.length} total records</Text>
        </View>
        <Ionicons name="filter" size={24} color="#94a3b8" />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <Ionicons name="receipt-outline" size={64} color="#334155" />
            <Text className="text-text-muted text-xl mt-4">No transactions found</Text>
            <Text className="text-text-muted text-center mt-2">
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
