import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function isBiometricEnabled(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync('biometric_enabled');
  return stored === 'true';
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const enabled = await isBiometricEnabled();
  if (!enabled) return true; // Skip if not enabled

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock TimeQ',
    cancelLabel: 'Use password',
    disableDeviceFallback: false,
  });

  return result.success;
}

export async function enableBiometric(): Promise<boolean> {
  const available = await isBiometricAvailable();
  if (!available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Enable biometric lock',
  });

  if (result.success) {
    await SecureStore.setItemAsync('biometric_enabled', 'true');
    return true;
  }
  return false;
}

export async function disableBiometric(): Promise<void> {
  await SecureStore.deleteItemAsync('biometric_enabled');
}
