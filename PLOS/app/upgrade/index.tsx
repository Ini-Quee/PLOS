import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';

interface Subscription {
  plan: 'free' | 'pro';
  status: string;
  current_period_end: string;
}

const FEATURES = [
  { name: 'AI Assistant (Lumi)', free: 'Limited', pro: 'Unlimited' },
  { name: 'Habit Trackers', free: '3 max', pro: 'Unlimited' },
  { name: 'Journal Entries', free: '10/month', pro: 'Unlimited' },
  { name: 'Voice Features', free: false, pro: true },
  { name: 'Priority Support', free: false, pro: true },
  { name: 'Data Export', free: false, pro: true },
];

export default function UpgradeScreen() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/billing/status');
      setSubscription(res.data?.subscription || res.data || { plan: 'free', status: 'active', current_period_end: '' });
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);
  const onRefresh = () => { setRefreshing(true); fetchSubscription(); };

  const isPro = subscription?.plan === 'pro';

  const handleCheckout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCheckoutLoading(true);
    try {
      const res = await apiClient.post('/api/billing/checkout');
      const url = res.data?.url;
      if (url) {
        Alert.alert('Checkout', 'Redirecting to Stripe checkout...');
      }
    } catch (err) {
      console.error('Error starting checkout:', err);
      Alert.alert('Error', 'Failed to start checkout. Please try again.');
    }
    setCheckoutLoading(false);
  };

  const handleManage = async () => {
    try {
      const res = await apiClient.post('/api/billing/portal');
      const url = res.data?.url;
      if (url) {
        Alert.alert('Manage', 'Redirecting to subscription management...');
      }
    } catch (err) {
      console.error('Error opening portal:', err);
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {/* Current Plan */}
        <View style={styles.currentCard}>
          <View style={styles.planHeader}>
            <Ionicons name={isPro ? 'diamond' : 'person'} size={24} color={isPro ? Colors.amber : Colors.textSecondary} />
            <Text style={styles.planName}>{isPro ? 'Pro' : 'Free'}</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>
          {isPro && subscription?.current_period_end && (
            <Text style={styles.renewalText}>Renews {subscription.current_period_end}</Text>
          )}
        </View>

        {/* Pricing */}
        {!isPro && (
          <View style={styles.pricingCard}>
            <Text style={styles.priceLabel}>Pro Plan</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>$9</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
            <Text style={styles.priceDesc}>Unlock the full power of iNiQ</Text>
          </View>
        )}

        {/* Comparison Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Feature</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Free</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Pro</Text>
          </View>
          {FEATURES.map((feature, i) => (
            <View key={i} style={[styles.tableRow, i === FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{feature.name}</Text>
              <View style={[styles.tableCellView, { flex: 1 }]}>
                {typeof feature.free === 'boolean' ? (
                  <Ionicons name={feature.free ? 'checkmark' : 'close'} size={16} color={feature.free ? Colors.green : Colors.coral} />
                ) : (
                  <Text style={styles.tableCellText}>{feature.free}</Text>
                )}
              </View>
              <View style={[styles.tableCellView, { flex: 1 }]}>
                {typeof feature.pro === 'boolean' ? (
                  <Ionicons name={feature.pro ? 'checkmark' : 'close'} size={16} color={feature.pro ? Colors.green : Colors.coral} />
                ) : (
                  <Text style={[styles.tableCellText, { color: Colors.amber }]}>{feature.pro}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        {isPro ? (
          <TouchableOpacity style={styles.manageBtn} onPress={handleManage}>
            <Ionicons name="settings-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.manageBtnText}>Manage Subscription</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.upgradeBtn, checkoutLoading && { opacity: 0.7 }]}
            onPress={handleCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <ActivityIndicator size="small" color="#080503" />
            ) : (
              <Ionicons name="diamond" size={18} color="#080503" />
            )}
            <Text style={styles.upgradeBtnText}>{checkoutLoading ? 'Loading...' : 'Upgrade to Pro — $9/month'}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: Typography.title.fontSize, fontWeight: Typography.title.fontWeight, color: Colors.textPrimary },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  currentCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planName: { fontSize: Typography.subtitle.fontSize, fontWeight: '700', color: Colors.textPrimary },
  proBadge: { backgroundColor: Colors.amber, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  proBadgeText: { fontSize: 9, fontWeight: '700', color: '#080503' },
  renewalText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, marginTop: 8 },
  pricingCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  priceLabel: { fontSize: Typography.micro.fontSize, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginVertical: 8 },
  priceAmount: { fontSize: 48, fontWeight: '700', color: Colors.amber },
  pricePeriod: { fontSize: Typography.body.fontSize, color: Colors.textSecondary, marginBottom: 8 },
  priceDesc: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },
  tableCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  tableHeaderText: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableCell: { fontSize: Typography.caption.fontSize, color: Colors.textPrimary },
  tableCellView: { alignItems: 'center' },
  tableCellText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.amber, padding: 18, borderRadius: 14 },
  upgradeBtnText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: '#080503' },
  manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  manageBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Colors.textSecondary },
  bottomPadding: { height: 80 },
});
