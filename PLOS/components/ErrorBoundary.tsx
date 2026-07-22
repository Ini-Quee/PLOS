import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import LumiFace from './LumiFace';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Catches any render-time crash in the screen tree and shows a calm recovery
 * screen instead of a white "death" screen. Keeps a single bad render from
 * ending a testing session — the user can tap "Try again" and continue.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error, info?.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <LumiFace mood="concerned" size={64} />
        <Text style={styles.title}>Something hiccuped.</Text>
        <Text style={styles.subtitle}>Lumi caught it — nothing was lost. Let's try that again.</Text>
        <TouchableOpacity style={styles.button} onPress={this.reset} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 20, fontFamily: 'Georgia', color: Colors.textPrimary, marginTop: 18 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  button: { marginTop: 22, backgroundColor: Colors.amber, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 24 },
  buttonText: { color: '#1a1209', fontSize: 14, fontWeight: '600' },
});
