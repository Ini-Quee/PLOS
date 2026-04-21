import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export default function HabitsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habits</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Habit tracking will appear here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
});
