import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';

type JobStatus = 'applied' | 'interview' | 'offer' | 'rejected';

interface Job {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  notes: string;
  date_applied: string;
}

const STATUS_CONFIG: Record<JobStatus, { icon: string; color: string; label: string }> = {
  applied: { icon: 'paper-plane', color: '#7AAEE8', label: 'Applied' },
  interview: { icon: 'people', color: '#D4A06A', label: 'Interview' },
  offer: { icon: 'trophy', color: '#4CAF7D', label: 'Offer' },
  rejected: { icon: 'close-circle', color: '#E05252', label: 'Rejected' },
};

const DAILY_GOAL = 5;

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState<JobStatus>('applied');
  const [newNotes, setNewNotes] = useState('');

  const fetchJobs = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/jobs');
      setJobs(res.data?.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  const onRefresh = () => { setRefreshing(true); fetchJobs(); };

  const stats = {
    applied: jobs.filter((j) => j.status === 'applied').length,
    interview: jobs.filter((j) => j.status === 'interview').length,
    offer: jobs.filter((j) => j.status === 'offer').length,
    rejected: jobs.filter((j) => j.status === 'rejected').length,
  };

  const today = new Date().toISOString().slice(0, 10);
  const appliedToday = jobs.filter((j) => j.date_applied === today).length;
  const dailyProgress = Math.round((appliedToday / DAILY_GOAL) * 100);

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  const addJob = async () => {
    if (!newCompany.trim() || !newRole.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api/jobs', {
        company: newCompany.trim(),
        role: newRole.trim(),
        status: newStatus,
        notes: newNotes.trim(),
      });
      setNewCompany('');
      setNewRole('');
      setNewStatus('applied');
      setNewNotes('');
      setShowAdd(false);
      fetchJobs();
    } catch (err) {
      console.error('Error adding job:', err);
    }
    setSaving(false);
  };

  const updateStatus = async (job: Job, status: JobStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiClient.put(`/api/jobs/${job.id}`, { status });
      fetchJobs();
    } catch (err) {
      console.error('Error updating status:', err);
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
        <Text style={styles.title}>Jobs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={Colors.amber} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {(Object.keys(STATUS_CONFIG) as JobStatus[]).map((status) => (
          <View key={status} style={styles.statCard}>
            <Ionicons name={STATUS_CONFIG[status].icon as any} size={16} color={STATUS_CONFIG[status].color} />
            <Text style={[styles.statValue, { color: STATUS_CONFIG[status].color }]}>{stats[status]}</Text>
            <Text style={styles.statLabel}>{STATUS_CONFIG[status].label}</Text>
          </View>
        ))}
      </View>

      {/* Daily Goal */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Daily Goal</Text>
          <Text style={styles.goalCount}>{appliedToday}/{DAILY_GOAL} today</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(dailyProgress, 100)}%` }]} />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterActive]} onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {(Object.keys(STATUS_CONFIG) as JobStatus[]).map((status) => (
          <TouchableOpacity key={status} style={[styles.filterChip, filter === status && { backgroundColor: STATUS_CONFIG[status].color }]} onPress={() => setFilter(filter === status ? 'all' : status)}>
            <Text style={[styles.filterText, filter === status && { color: '#fff', fontWeight: '600' }]}>{STATUS_CONFIG[status].label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No applications</Text>
            <Text style={styles.emptyText}>{filter === 'all' ? 'Start tracking your job applications' : `No ${filter} applications`}</Text>
          </View>
        ) : (
          filteredJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={[styles.statusIcon, { backgroundColor: `${STATUS_CONFIG[job.status].color}20` }]}>
                  <Ionicons name={STATUS_CONFIG[job.status].icon as any} size={16} color={STATUS_CONFIG[job.status].color} />
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobRole}>{job.role}</Text>
                  <Text style={styles.jobCompany}>{job.company}</Text>
                </View>
                <Text style={styles.jobDate}>{job.date_applied}</Text>
              </View>
              {job.notes ? <Text style={styles.jobNotes} numberOfLines={2}>{job.notes}</Text> : null}
              <View style={styles.statusRow}>
                {(Object.keys(STATUS_CONFIG) as JobStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusChip, job.status === status && { backgroundColor: STATUS_CONFIG[status].color }]}
                    onPress={() => updateStatus(job, status)}
                  >
                    <Text style={[styles.statusChipText, job.status === status && { color: '#fff' }]}>{STATUS_CONFIG[status].label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Job Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Application</Text>
            <TextInput style={styles.input} placeholder="Company" placeholderTextColor={Colors.textMuted} value={newCompany} onChangeText={setNewCompany} />
            <TextInput style={styles.input} placeholder="Role" placeholderTextColor={Colors.textMuted} value={newRole} onChangeText={setNewRole} />
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.statusSelectRow}>
              {(Object.keys(STATUS_CONFIG) as JobStatus[]).map((status) => (
                <TouchableOpacity key={status} style={[styles.statusSelectChip, newStatus === status && { backgroundColor: STATUS_CONFIG[status].color }]} onPress={() => setNewStatus(status)}>
                  <Text style={[styles.statusSelectText, newStatus === status && { color: '#fff' }]}>{STATUS_CONFIG[status].label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Notes (optional)" placeholderTextColor={Colors.textMuted} value={newNotes} onChangeText={setNewNotes} multiline textAlignVertical="top" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, (!newCompany.trim() || !newRole.trim()) && { opacity: 0.5 }]} onPress={addJob} disabled={!newCompany.trim() || !newRole.trim() || saving}>
                <Text style={styles.modalSaveText}>{saving ? 'Adding...' : 'Add Application'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: Typography.title.fontSize, fontWeight: Typography.title.fontWeight, color: Colors.textPrimary },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(200,149,92,0.12)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 9, color: Colors.textMuted },
  goalCard: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 12 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalTitle: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: Colors.textPrimary },
  goalCount: { fontSize: Typography.caption.fontSize, color: Colors.amber, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.amber },
  filterScroll: { maxHeight: 40, marginBottom: 12 },
  filterContent: { paddingHorizontal: 20, gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.card },
  filterActive: { backgroundColor: Colors.amber },
  filterText: { fontSize: Typography.micro.fontSize, color: Colors.textSecondary },
  filterTextActive: { color: '#080503', fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  jobCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  statusIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  jobInfo: { flex: 1 },
  jobRole: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  jobCompany: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, marginTop: 1 },
  jobDate: { fontSize: Typography.micro.fontSize, color: Colors.textMuted },
  jobNotes: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusChip: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  statusChipText: { fontSize: 9, color: Colors.textMuted, fontWeight: '600' },
  bottomPadding: { height: 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: Typography.subtitle.fontWeight, color: Colors.textPrimary, marginBottom: 4 },
  input: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: Typography.body.fontSize },
  fieldLabel: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusSelectRow: { flexDirection: 'row', gap: 8 },
  statusSelectChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center' },
  statusSelectText: { fontSize: Typography.micro.fontSize, color: Colors.textSecondary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center' },
  modalCancelText: { fontSize: Typography.body.fontSize, color: Colors.textSecondary },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.amber, alignItems: 'center' },
  modalSaveText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
});
