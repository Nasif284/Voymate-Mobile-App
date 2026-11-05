import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';
import { queryClient, asyncStoragePersister } from './src/api/queryClient';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';

// Enable NativeWind className styling on expo-image across the app
cssInterop(Image, { className: 'style' });

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }} className="flex-1">
      <SafeAreaProvider>
        <ErrorBoundary>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: asyncStoragePersister,
              maxAge: 1000 * 60 * 60 * 24, // 24 hours
            }}
          >
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </PersistQueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
