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

type Category = 'Personal' | 'Work' | 'Learning' | 'Creative';

interface Project {
  id: string;
  name: string;
  description: string;
  category: Category;
  status: string;
  target_date: string;
  tasks: Task[];
  completed_tasks: number;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  project_id: string;
}

const CATEGORIES: Category[] = ['Personal', 'Work', 'Learning', 'Creative'];

const CATEGORY_COLORS: Record<Category, string> = {
  Personal: '#C8955C',
  Work: '#7AAEE8',
  Learning: '#9B7FD4',
  Creative: '#D4A06A',
};

const CATEGORY_ICONS: Record<Category, string> = {
  Personal: '🏠',
  Work: '💼',
  Learning: '📚',
  Creative: '🎨',
};

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Personal');
  const [newTargetDate, setNewTargetDate] = useState('');

  // Task form
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/projects');
      setProjects(res.data?.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  const onRefresh = () => { setRefreshing(true); fetchProjects(); };

  const addProject = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api/projects', {
        name: newName.trim(),
        description: newDesc.trim(),
        category: newCategory,
        target_date: newTargetDate,
      });
      setNewName('');
      setNewDesc('');
      setNewCategory('Personal');
      setNewTargetDate('');
      setShowAdd(false);
      fetchProjects();
    } catch (err) {
      console.error('Error adding project:', err);
    }
    setSaving(false);
  };

  const addTask = async () => {
    if (!showDetail || !newTaskTitle.trim()) return;
    try {
      await apiClient.post(`/api/projects/${showDetail.id}/tasks`, { title: newTaskTitle.trim() });
      setNewTaskTitle('');
      fetchProjects();
      // Refresh detail
      const res = await apiClient.get(`/api/projects/${showDetail.id}`);
      setShowDetail(res.data?.project || showDetail);
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleTask = async (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiClient.put(`/api/projects/tasks/${task.id}`, { completed: !task.completed });
      fetchProjects();
      if (showDetail) {
        const res = await apiClient.get(`/api/projects/${showDetail.id}`);
        setShowDetail(res.data?.project || showDetail);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const getProgress = (project: Project) => {
    const total = project.tasks?.length || 0;
    const done = project.tasks?.filter((t) => t.completed).length || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
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
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={Colors.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyText}>Create a project to start tracking tasks</Text>
          </View>
        ) : (
          projects.map((project) => {
            const progress = getProgress(project);
            const totalTasks = project.tasks?.length || 0;
            return (
              <TouchableOpacity
                key={project.id}
                style={styles.projectCard}
                onPress={() => setShowDetail(project)}
                activeOpacity={0.7}
              >
                <View style={styles.projectHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: `${CATEGORY_COLORS[project.category]}20` }]}>
                    <Text style={styles.categoryIcon}>{CATEGORY_ICONS[project.category]}</Text>
                    <Text style={[styles.categoryText, { color: CATEGORY_COLORS[project.category] }]}>{project.category}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: progress === 100 ? Colors.green : Colors.amber }]} />
                </View>
                <Text style={styles.projectName}>{project.name}</Text>
                {project.description ? <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text> : null}
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: CATEGORY_COLORS[project.category] }]} />
                  </View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
                <View style={styles.projectFooter}>
                  <Text style={styles.taskCount}>{totalTasks} tasks</Text>
                  {project.target_date && (
                    <Text style={styles.targetDate}>Due {project.target_date}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Project Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Project</Text>
            <TextInput style={styles.input} placeholder="Project name" placeholderTextColor={Colors.textMuted} value={newName} onChangeText={setNewName} />
            <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Description (optional)" placeholderTextColor={Colors.textMuted} value={newDesc} onChangeText={setNewDesc} multiline textAlignVertical="top" />
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.catChip, newCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] }]} onPress={() => setNewCategory(cat)}>
                  <Text style={[styles.catChipText, newCategory === cat && { color: '#080503' }]}>{CATEGORY_ICONS[cat]} {cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Target date (YYYY-MM-DD)" placeholderTextColor={Colors.textMuted} value={newTargetDate} onChangeText={setNewTargetDate} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, !newName.trim() && { opacity: 0.5 }]} onPress={addProject} disabled={!newName.trim() || saving}>
                <Text style={styles.modalSaveText}>{saving ? 'Creating...' : 'Create Project'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Project Detail Modal */}
      <Modal visible={!!showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailTitle}>{showDetail?.name}</Text>
                <TouchableOpacity onPress={() => setShowDetail(null)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: `${CATEGORY_COLORS[showDetail?.category || 'Personal']}20` }]}>
                <Text style={[styles.categoryText, { color: CATEGORY_COLORS[showDetail?.category || 'Personal'] }]}>
                  {showDetail?.category}
                </Text>
              </View>
            </View>

            <Text style={styles.detailSectionTitle}>TASKS</Text>
            <ScrollView style={styles.taskList}>
              {showDetail?.tasks?.map((task) => (
                <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => toggleTask(task)}>
                  <View style={[styles.checkbox, task.completed && { backgroundColor: Colors.amber, borderColor: Colors.amber }]}>
                    {task.completed && <Ionicons name="checkmark" size={12} color="#080503" />}
                  </View>
                  <Text style={[styles.taskTitle, task.completed && { textDecorationLine: 'line-through', color: Colors.textMuted }]}>{task.title}</Text>
                </TouchableOpacity>
              ))}
              {(!showDetail?.tasks || showDetail.tasks.length === 0) && (
                <Text style={styles.noTasks}>No tasks yet</Text>
              )}
            </ScrollView>

            <View style={styles.addTaskRow}>
              <TextInput style={styles.taskInput} placeholder="Add a task..." placeholderTextColor={Colors.textMuted} value={newTaskTitle} onChangeText={setNewTaskTitle} />
              <TouchableOpacity style={[styles.addTaskBtn, !newTaskTitle.trim() && { opacity: 0.5 }]} onPress={addTask} disabled={!newTaskTitle.trim()}>
                <Ionicons name="add" size={20} color="#080503" />
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
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  projectCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 10 },
  projectHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryIcon: { fontSize: 12 },
  categoryText: { fontSize: 9, fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  projectName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  projectDesc: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, marginBottom: 10, lineHeight: 18 },
  progressSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: Typography.micro.fontSize, color: Colors.amber, fontWeight: '600', width: 32, textAlign: 'right' },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  taskCount: { fontSize: Typography.micro.fontSize, color: Colors.textMuted },
  targetDate: { fontSize: Typography.micro.fontSize, color: Colors.textMuted },
  bottomPadding: { height: 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: Typography.subtitle.fontWeight, color: Colors.textPrimary, marginBottom: 4 },
  input: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: Typography.body.fontSize },
  fieldLabel: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  catRow: { flexDirection: 'row', gap: 8 },
  catChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center' },
  catChipText: { fontSize: Typography.micro.fontSize, color: Colors.textSecondary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center' },
  modalCancelText: { fontSize: Typography.body.fontSize, color: Colors.textSecondary },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.amber, alignItems: 'center' },
  modalSaveText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
  detailModal: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  detailHeader: { marginBottom: 16 },
  detailTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  detailSectionTitle: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 10 },
  taskList: { maxHeight: 300 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  taskTitle: { flex: 1, fontSize: Typography.caption.fontSize, color: Colors.textPrimary },
  noTasks: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  addTaskRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  taskInput: { flex: 1, backgroundColor: Colors.card, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: Typography.caption.fontSize },
  addTaskBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.amber, justifyContent: 'center', alignItems: 'center' },
});
