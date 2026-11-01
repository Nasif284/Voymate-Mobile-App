import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { theme } from '../../config/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('[ErrorBoundary] Uncaught error:', error, errorInfo.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background items-center justify-center p-5">
          <View className="w-full max-w-[360px] bg-surface rounded-3xl p-6 items-center border border-border-subtle shadow-md">
            <View className="w-16 h-16 rounded-full bg-error-light items-center justify-center mb-4">
              <AlertTriangle size={32} color={theme.colors.error} />
            </View>
            <Text className="text-xl font-bold text-textPrimary mb-1 text-center">
              Something went wrong
            </Text>
            <Text className="text-[13px] text-textSecondary text-center leading-5 mb-4">
              We ran into an unexpected issue. Please try reloading the screen.
            </Text>
            {__DEV__ && this.state.errorMessage ? (
              <Text className="text-xs text-error bg-error-light p-2 rounded-lg w-full mb-4" numberOfLines={4}>
                {this.state.errorMessage}
              </Text>
            ) : null}
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 bg-primary py-3 px-6 rounded-full"
              onPress={this.handleReset}
              activeOpacity={0.85}
            >
              <RotateCcw size={18} color={theme.colors.white} />
              <Text className="text-[15px] font-bold text-white">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
