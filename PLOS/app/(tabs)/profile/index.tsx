import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import { logout } from '../../../services/auth';

export default function ProfileScreen() {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: Colors.coral,
    borderRadius: 12,
    height: 54,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.white,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
});
