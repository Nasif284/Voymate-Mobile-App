import { Platform } from 'react-native';
import { ENV } from '../../config/env';

let isConfigured = false;

function getGoogleSignin(): any {
  if (Platform.OS !== 'android') return null;
  try {
    // Dynamic require prevents TurboModuleRegistry.getEnforcing from crashing at bundle initialization on iOS or Expo Go
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('@react-native-google-signin/google-signin');
    return module?.GoogleSignin || null;
  } catch {
    return null;
  }
}

export function isGoogleSignInAvailable(): boolean {
  return Platform.OS === 'android' && getGoogleSignin() !== null;
}

export function configureGoogleSignIn(): void {
  if (Platform.OS !== 'android') return;
  if (isConfigured) return;

  const GoogleSignin = getGoogleSignin();
  if (!GoogleSignin) return;

  try {
    GoogleSignin.configure({
      webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
    });
    isConfigured = true;
  } catch (err) {
    console.warn('[GoogleSignin] configure failed:', err);
  }
}

export async function signInWithGoogle(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  const GoogleSignin = getGoogleSignin();
  if (!GoogleSignin) {
    throw new Error(
      'Google Sign-In is only available in a native Android development build, not inside Expo Go.',
    );
  }

  configureGoogleSignIn();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();
  // Voymate server expects the Google OAuth accessToken
  return tokens.accessToken || null;
}
