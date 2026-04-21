import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuthStore } from '../../store/useAuthStore';

// Type definitions
interface RoutineItem {
  id: string;
  icon: string;
  text: string;
  checked: boolean;
}

interface QuickAction {
  id: string;
  emoji: string;
  label: string;
}

interface Habit {
  id: string;
  name: string;
  color: string;
  streak: number;
  checked: boolean;
}

export default function TodayScreen() {
  const user = useAuthStore((state) => state.user);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  // Get today's date formatted
  const getTodayDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Today's Plan state
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([
    { id: '1', icon: '🌅', text: 'Wake up routine', checked: false },
    { id: '2', icon: '💧', text: 'Drink water (2L goal)', checked: true },
    { id: '3', icon: '📖', text: 'Bible reading', checked: false },
    { id: '4', icon: '🎯', text: 'Focus work block', checked: false },
    { id: '5', icon: '🌙', text: 'Evening wind-down', checked: false },
  ]);

  // Habits state
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Bible', color: Colors.purple, streak: 12, checked: true },
    { id: '2', name: 'Water', color: Colors.blue, streak: 8, checked: true },
    { id: '3', name: 'Reading', color: Colors.teal, streak: 15, checked: false },
    { id: '4', name: 'Exercise', color: Colors.green, streak: 5, checked: false },
    { id: '5', name: 'Journal', color: Colors.gold, streak: 21, checked: true },
  ]);

  // Quick Actions
  const quickActions: QuickAction[] = [
    { id: '1', emoji: '💧', label: 'Water' },
    { id: '2', emoji: '📖', label: 'Read' },
    { id: '3', emoji: '💰', label: 'Expense' },
    { id: '4', emoji: '😴', label: 'Sleep' },
    { id: '5', emoji: '🙏', label: 'Prayer' },
  ];

  // Toggle routine item
  const toggleRoutine = (id: string) => {
    setRoutineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Toggle habit
  const toggleHabit = (id: string) => {
    setHabits((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Count checked habits
  const checkedHabitsCount = habits.filter((h) => h.checked).length;

  // Circular Progress Component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressCircle, { width: size, height: size }]}>
          {/* Background circle */}
          <View
            style={[
              styles.circleBackground,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: Colors.border,
              },
            ]}
          />
          {/* Progress arc (simplified) */}
          <View
            style={[
              styles.progressFill,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: Colors.gold,
                borderTopColor: Colors.gold,
                borderRightColor: percentage > 25 ? Colors.gold : 'transparent',
                borderBottomColor: percentage > 50 ? Colors.gold : 'transparent',
                borderLeftColor: percentage > 75 ? Colors.gold : 'transparent',
              },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.name || 'Friend'} 👋
          </Text>
          <Text style={styles.date}>{getTodayDate()}</Text>
        </View>

        {/* Life Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreLabel}>LIFE SCORE</Text>
            <Text style={styles.scoreValue}>73%</Text>
            <Text style={styles.scoreSubtext}>Keep pushing today 💪</Text>
          </View>
          <View style={styles.scoreRight}>
            <CircularProgress percentage={73} />
          </View>
        </View>

        {/* Today's Plan Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S PLAN</Text>
          <View style={styles.routineCard}>
            {routineItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.routineItem,
                  index === routineItems.length - 1 && styles.routineItemLast,
                ]}
                onPress={() => toggleRoutine(item.id)}
              >
                <Text style={styles.routineIcon}>{item.icon}</Text>
                <Text style={styles.routineText}>{item.text}</Text>
                <View
                  style={[
                    styles.checkbox,
                    item.checked && styles.checkboxChecked,
                  ]}
                >
                  {item.checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK LOG</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          >
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.quickActionChip}>
                <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Habits Section */}
        <View style={styles.section}>
          <View style={styles.habitsHeader}>
            <Text style={styles.sectionTitle}>HABITS</Text>
            <Text style={styles.habitsCount}>
              {checkedHabitsCount}/{habits.length} ✓
            </Text>
          </View>
          <View style={styles.habitsCard}>
            {habits.map((habit, index) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitRow,
                  index === habits.length - 1 && styles.habitRowLast,
                ]}
                onPress={() => toggleHabit(habit.id)}
              >
                <View
                  style={[styles.habitDot, { backgroundColor: habit.color }]}
                />
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitStreak}>{habit.streak} 🔥</Text>
                <View
                  style={[
                    styles.checkbox,
                    habit.checked && styles.checkboxChecked,
                  ]}
                >
                  {habit.checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sleep Card */}
        <View style={[styles.section, styles.sectionLast]}>
          <View style={styles.sleepCard}>
            <View style={styles.sleepBorder} />
            <View style={styles.sleepContent}>
              <Text style={styles.sleepTitle}>Tonight's Target 🌙</Text>
              <Text style={styles.sleepTime}>Sleep by 10:30 PM</Text>
              <Text style={styles.sleepSubtext}>Wind-down starts in 3h 20m</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLeft: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: Typography.micro.fontSize,
    fontWeight: Typography.micro.fontWeight,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gold,
    marginTop: 4,
  },
  scoreSubtext: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreRight: {
    marginLeft: 20,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
  },
  progressFill: {
    position: 'absolute',
  },
  section: {
    marginBottom: 24,
  },
  sectionLast: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: Typography.micro.fontSize,
    fontWeight: Typography.micro.fontWeight,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  routineCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  routineItemLast: {
    borderBottomWidth: 0,
  },
  routineIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  routineText: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  quickActionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  quickActionLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  habitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitsCount: {
    fontSize: Typography.caption.fontSize,
    color: Colors.blue,
    fontWeight: '600',
  },
  habitsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  habitRowLast: {
    borderBottomWidth: 0,
  },
  habitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  habitName: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  habitStreak: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginRight: 12,
  },
  sleepCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sleepBorder: {
    width: 4,
    backgroundColor: Colors.purple,
  },
  sleepContent: {
    flex: 1,
    padding: 20,
  },
  sleepTitle: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: Typography.subtitle.fontWeight,
    color: Colors.textPrimary,
  },
  sleepTime: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    color: Colors.blue,
    marginTop: 8,
  },
  sleepSubtext: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
});
