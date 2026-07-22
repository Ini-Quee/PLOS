import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';
import { ModeToggle, VoiceCapture } from '../../components';

type Mode = 'simple' | 'advanced';

interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  expense_date: string;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

const CAT_COLORS: Record<string, string> = {
  food: '#fbbf24',
  transport: '#2dd4bf',
  shopping: '#f9a8d4',
  bills: '#a5b4fc',
  health: '#6ee7b7',
  entertainment: '#c4b5fd',
  other: '#9B8A7A',
};

export default function BudgetScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('simple');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(80000);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('food');
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [expRes, settingsRes] = await Promise.allSettled([
        apiClient.get('/api/budget/expenses?limit=50'),
        apiClient.get('/api/users/settings'),
      ]);

      if (expRes.status === 'fulfilled') {
        const data = expRes.value.data;
        setExpenses(data?.expenses || []);
        // Build category summaries
        const catMap: Record<string, { total: number; count: number }> = {};
        (data?.expenses || []).forEach((e: Expense) => {
          if (!catMap[e.category]) catMap[e.category] = { total: 0, count: 0 };
          catMap[e.category].total += e.amount;
          catMap[e.category].count++;
        });
        const cats = Object.entries(catMap)
          .map(([category, v]) => ({ category, ...v }))
          .sort((a, b) => b.total - a.total);
        setCategories(cats);
      }
      if (settingsRes.status === 'fulfilled') {
        setMonthlyBudget(settingsRes.value.data?.settings?.monthly_budget || 80000);
      }
    } catch (err) {
      console.error('Error fetching budget:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const percentUsed = Math.round((totalSpent / monthlyBudget) * 100);
  const topCategory = categories[0];

  const addExpense = async () => {
    if (!newAmount) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await apiClient.post('/api/budget/expenses', {
        amount: parseFloat(newAmount),
        category: newCategory,
        note: newNote,
      });
      setNewAmount('');
      setNewNote('');
      setShowAdd(false);
      fetchData();
    } catch (err) {
      console.error('Error adding expense:', err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budget</Text>
        <ModeToggle
          options={[
            { key: 'simple', label: 'Simple' },
            { key: 'advanced', label: 'Advanced' },
          ]}
          activeKey={mode}
          onChange={(k) => setMode(k as Mode)}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />
        }
      >
        {/* Month Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.monthLabel}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.spentLabel}>
            Spent <Text style={styles.spentAmount}>₦{totalSpent.toLocaleString()}</Text> of ₦{monthlyBudget.toLocaleString()}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentUsed, 100)}%`,
                  backgroundColor: percentUsed > 80 ? Colors.coral : Colors.amber,
                },
              ]}
            />
          </View>
        </View>

        {mode === 'simple' ? (
          /* Simple Mode: Category bars */
          <>
            {categories.length > 0 && (
              <View style={styles.categoriesCard}>
                <Text style={styles.sectionTitle}>SPENDING BY CATEGORY</Text>
                {categories.map((cat) => {
                  const pct = Math.round((cat.total / totalSpent) * 100);
                  return (
                    <View key={cat.category} style={styles.categoryRow}>
                      <View style={styles.categoryInfo}>
                        <View
                          style={[
                            styles.categoryDot,
                            { backgroundColor: CAT_COLORS[cat.category] || CAT_COLORS.other },
                          ]}
                        />
                        <Text style={styles.categoryName}>
                          {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                        </Text>
                        <Text style={styles.categoryPct}>{pct}%</Text>
                      </View>
                      <View style={styles.categoryBarBg}>
                        <View
                          style={[
                            styles.categoryBarFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: CAT_COLORS[cat.category] || CAT_COLORS.other,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.categoryAmount}>₦{cat.total.toLocaleString()}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Insight */}
            {topCategory && (
              <View style={styles.insightCard}>
                <Ionicons name="bulb-outline" size={16} color={Colors.amber} />
                <Text style={styles.insightText}>
                  {topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)} is your biggest category this month — ₦{topCategory.total.toLocaleString()}.
                </Text>
              </View>
            )}
          </>
        ) : (
          /* Advanced Mode: Data Table */
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Cat</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Amount</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Note</Text>
            </View>
            {expenses.slice(0, 20).map((exp) => (
              <View key={exp.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>
                  {exp.expense_date?.slice(5)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {exp.category}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: Colors.amber, fontWeight: '600' }]}>
                  ₦{exp.amount.toLocaleString()}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                  {exp.note || '—'}
                </Text>
              </View>
            ))}

            {/* Totals */}
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Month total</Text>
                <Text style={styles.totalValue}>₦{totalSpent.toLocaleString()}</Text>
              </View>
              {categories.length > 0 && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Highest</Text>
                    <Text style={styles.totalValue}>
                      {topCategory?.category}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Expense FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAdd(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#080503" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Expense</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Amount (₦)"
              placeholderTextColor={Colors.textMuted}
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
            />

            <View style={styles.catChips}>
              {Object.keys(CAT_COLORS).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, newCategory === cat && styles.catChipActive]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.catChipText, newCategory === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Note (optional)"
              placeholderTextColor={Colors.textMuted}
              value={newNote}
              onChangeText={setNewNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowAdd(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, !newAmount && styles.modalSaveDisabled]}
                onPress={addExpense}
                disabled={!newAmount || saving}
              >
                <Text style={styles.modalSaveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    color: Colors.textPrimary,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: Typography.micro.fontSize,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  spentLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  spentAmount: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoriesCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Typography.micro.fontSize,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  categoryRow: {
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    color: Colors.textPrimary,
  },
  categoryPct: {
    fontSize: Typography.micro.fontSize,
    color: Colors.textMuted,
  },
  categoryBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    fontSize: Typography.micro.fontSize,
    color: Colors.textSecondary,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 149, 92, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  insightText: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: Typography.micro.fontSize,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableCell: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textPrimary,
  },
  totalsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  modalTitle: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: Typography.subtitle.fontWeight,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: Typography.body.fontSize,
  },
  catChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
  },
  catChipActive: {
    backgroundColor: Colors.amber,
  },
  catChipText: {
    fontSize: Typography.micro.fontSize,
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: '#080503',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  modalSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.amber,
    alignItems: 'center',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: '#080503',
  },
  bottomPadding: {
    height: 80,
  },
});
