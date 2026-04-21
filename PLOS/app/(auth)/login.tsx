import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { login } from '../../services/auth';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      setUser(user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Text style={styles.logo}>PLOS</Text>
        <Text style={styles.tagline}>Your life. Organized.</Text>

        <View style={styles.spacer} />

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonSpacer} />

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* Register Link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerLink}>
            Don't have an account? <Text style={styles.registerLinkBold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.gold,
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    fontSize: Typography.body.fontSize,
  },
  eyeButton: {
    padding: 16,
  },
  buttonSpacer: {
    height: 24,
  },
  loginButton: {
    backgroundColor: Colors.blue,
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.coral,
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
    marginTop: 8,
  },
  registerLink: {
    color: Colors.textSecondary,
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
  },
  registerLinkBold: {
    color: Colors.blue,
    fontWeight: '600',
  },
});
