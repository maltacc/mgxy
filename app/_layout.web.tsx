import { GoogleOAuthProvider } from '@react-oauth/google';
import Head from 'expo-router/head';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function RootLayout() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthProvider>
        <Head>
          <meta name="referrer" content="no-referrer" />
        </Head>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
