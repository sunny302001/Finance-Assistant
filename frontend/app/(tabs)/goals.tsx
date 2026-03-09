import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import SwipeableRow from '@/components/common/SwipeableRow';
import { Colors } from '@/theme/colors';
import Skeleton from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { formatCurrency } from '@/lib/utils';
import { getGoals, createGoal, addAmountToGoal, deleteGoal } from '@/lib/api';
import type { BudgetGoal } from '@/types';

export default function GoalsScreen() {
    const insets = useSafeAreaInsets();
    const [goals, setGoals] = useState<BudgetGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [addAmountGoal, setAddAmountGoal] = useState<BudgetGoal | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [error, setError] = useState(false);

    const fetchGoals = useCallback(async () => {
        try {
            const data = await getGoals();
            setGoals(data);
            setError(false);
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchGoals();
    }, [fetchGoals]);

    const handleDelete = useCallback(
        (goal: BudgetGoal) => {
            Alert.alert('Delete Goal', `Delete "${goal.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteGoal(goal.id);
                            setGoals((prev) => prev.filter((g) => g.id !== goal.id));
                        } catch {
                            Alert.alert('Error', 'Failed to delete goal');
                        }
                    },
                },
            ]);
        },
        []
    );

    const handleCreated = useCallback(() => {
        setShowCreate(false);
        fetchGoals();
    }, [fetchGoals]);

    const handleAmountAdded = useCallback((updatedGoal: BudgetGoal) => {
        setAddAmountGoal(null);
        if (updatedGoal.is_completed) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }
        fetchGoals();
    }, [fetchGoals]);

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.titleRow}>
                    <View>
                        <Skeleton width={180} height={32} style={{ marginBottom: 8 }} />
                        <Skeleton width={120} height={16} />
                    </View>
                    <Skeleton width={42} height={42} borderRadius={14} />
                </View>
                <View style={styles.listContent}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.goalCard}>
                            <View style={styles.goalHeader}>
                                <Skeleton width={44} height={44} borderRadius={14} style={{ marginRight: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <Skeleton width="50%" height={18} style={{ marginBottom: 8 }} />
                                    <Skeleton width="80%" height={12} />
                                </View>
                            </View>
                            <Skeleton height={8} borderRadius={4} style={{ marginBottom: 12 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Skeleton width={40} height={14} />
                                <Skeleton width={100} height={14} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Title + Create */}
            <View style={styles.titleRow}>
                <View>
                    <Text style={styles.pageTitle}>Budget Goals</Text>
                    <Text style={styles.pageSubtitle}>
                        {goals.length} goal{goals.length !== 1 ? 's' : ''} tracked
                    </Text>
                </View>
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {error && goals.length === 0 ? (
                <ErrorState onRetry={fetchGoals} />
            ) : (
                <FlatList
                    data={goals}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                        <SwipeableRow onDelete={() => handleDelete(item)}>
                            <GoalCard
                                goal={item}
                                onAddAmount={() => setAddAmountGoal(item)}
                            />
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
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="flag-outline" size={52} color={Colors.textMuted} />
                            <Text style={styles.emptyTitle}>No goals yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Tap + to create your first savings goal
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Create Modal */}
            <CreateGoalModal
                visible={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={handleCreated}
            />

            {/* Add Amount Modal */}
            {addAmountGoal && (
                <AddAmountModal
                    visible={!!addAmountGoal}
                    goal={addAmountGoal}
                    onClose={() => setAddAmountGoal(null)}
                    onAdded={handleAmountAdded}
                />
            )}

            {showConfetti && (
                <ConfettiCannon
                    count={200}
                    origin={{ x: -10, y: 0 }}
                    fadeOut={true}
                    explosionSpeed={350}
                />
            )}
        </View>
    );
}

// ── Goal Card ──
function GoalCard({
    goal,
    onAddAmount,
}: {
    goal: BudgetGoal;
    onAddAmount: () => void;
}) {
    const progress = Math.min(goal.progress_percentage, 100);
    const isCompleted = goal.is_completed;

    return (
        <View
            style={[styles.goalCard, isCompleted && styles.goalCardCompleted]}
        >
            {/* Header */}
            <View style={styles.goalHeader}>
                <View style={styles.goalIconWrap}>
                    <Text style={{ fontSize: 22 }}>{goal.icon || '🎯'}</Text>
                </View>
                <View style={styles.goalHeaderInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    {goal.description ? (
                        <Text style={styles.goalDesc} numberOfLines={1}>{goal.description}</Text>
                    ) : null}
                </View>
                {isCompleted && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.savings.main} />
                )}
                {!isCompleted && (
                    <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>P{goal.priority}</Text>
                    </View>
                )}
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
                <View style={styles.progressBarBg}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${progress}%`,
                                backgroundColor: isCompleted
                                    ? Colors.savings.main
                                    : goal.color || Colors.primary,
                            },
                        ]}
                    />
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.progressPerc}>{progress.toFixed(0)}%</Text>
                    <Text style={styles.progressAmount}>
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.goalFooter}>
                {goal.days_remaining !== null && goal.days_remaining !== undefined && !isCompleted ? (
                    <View style={styles.daysChip}>
                        <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.daysText}>{goal.days_remaining}d left</Text>
                    </View>
                ) : isCompleted ? (
                    <Text style={styles.completedText}>✨ Goal reached!</Text>
                ) : (
                    <Text style={styles.daysText}>
                        {formatCurrency(goal.remaining_amount)} to go
                    </Text>
                )}

                {!isCompleted && (
                    <TouchableOpacity style={styles.addAmountBtn} onPress={onAddAmount}>
                        <Ionicons name="add-circle" size={16} color="#fff" />
                        <Text style={styles.addAmountText}>Add</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

// ── Create Goal Modal ──
function CreateGoalModal({
    visible,
    onClose,
    onCreated,
}: {
    visible: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [priority, setPriority] = useState('1');
    const [deadline, setDeadline] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !targetAmount.trim()) {
            Alert.alert('Error', 'Name and target amount are required');
            return;
        }

        setSaving(true);
        try {
            await createGoal({
                name: name.trim(),
                target_amount: parseFloat(targetAmount),
                priority: parseInt(priority) || 1,
                deadline: deadline.trim() || undefined,
            });
            setName('');
            setTargetAmount('');
            setPriority('1');
            setDeadline('');
            onCreated();
        } catch {
            Alert.alert('Error', 'Failed to create goal');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalCard}>
                    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>New Goal</Text>

                        <Text style={styles.inputLabel}>Goal Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Emergency Fund"
                            placeholderTextColor={Colors.textMuted}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.inputLabel}>Target Amount (₹)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. 50000"
                            placeholderTextColor={Colors.textMuted}
                            value={targetAmount}
                            onChangeText={setTargetAmount}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Priority (1-5)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="1"
                                    placeholderTextColor={Colors.textMuted}
                                    value={priority}
                                    onChangeText={setPriority}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.inputLabel}>Deadline (optional)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="2026-12-31"
                                    placeholderTextColor={Colors.textMuted}
                                    value={deadline}
                                    onChangeText={setDeadline}
                                />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Create</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ── Add Amount Modal ──
function AddAmountModal({
    visible,
    goal,
    onClose,
    onAdded,
}: {
    visible: boolean;
    goal: BudgetGoal;
    onClose: () => void;
    onAdded: (goal: BudgetGoal) => void;
}) {
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        const val = parseFloat(amount);
        if (!val || val <= 0) {
            Alert.alert('Error', 'Enter a valid amount');
            return;
        }

        setSaving(true);
        try {
            const updated = await addAmountToGoal(goal.id, val);
            setAmount('');
            onAdded(updated);
        } catch {
            Alert.alert('Error', 'Failed to add amount');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Add to {goal.name}</Text>
                    <Text style={styles.modalSubtitle}>
                        {formatCurrency(goal.remaining_amount)} remaining
                    </Text>

                    <Text style={styles.inputLabel}>Amount (₹)</Text>
                    <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 5000"
                        placeholderTextColor={Colors.textMuted}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        autoFocus
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleAdd}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Add</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
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
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
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
    createBtn: {
        backgroundColor: Colors.primary,
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },

    // Goal card
    goalCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border + '30',
    },
    goalCardCompleted: {
        borderColor: Colors.savings.main + '60',
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    goalIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    goalHeaderInfo: {
        flex: 1,
    },
    goalName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    goalDesc: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    priorityBadge: {
        backgroundColor: Colors.primary + '30',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primaryLight,
    },

    // Progress
    progressSection: {
        marginBottom: 12,
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.surfaceElevated,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 8,
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    progressPerc: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    progressAmount: {
        fontSize: 12,
        color: Colors.textSecondary,
    },

    // Footer
    goalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    daysChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    daysText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    completedText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.savings.main,
    },
    addAmountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        gap: 4,
    },
    addAmountText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
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
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 36,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
        marginTop: 12,
    },
    modalInput: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 10,
        padding: 12,
        color: Colors.text,
        fontSize: 15,
        borderWidth: 1,
        borderColor: Colors.border + '40',
    },
    modalRow: {
        flexDirection: 'row',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: Colors.surfaceElevated,
    },
    cancelBtnText: {
        color: Colors.textSecondary,
        fontWeight: '600',
        fontSize: 15,
    },
    saveBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: Colors.primary,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
