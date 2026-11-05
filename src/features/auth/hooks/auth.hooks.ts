import { useMutation } from '@tanstack/react-query';
import { getApiErrorMessage } from '../../../api/queryClient';
import { useHaptics } from '../../../hooks/useHaptics';
import { useAuthStore } from '../../../store/authStore';
import {
  authService,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SendOtpPayload,
  VerifyEmailPayload,
  VerifyOtpPayload,
} from '../services/auth.service';

export function useLogin(options?: { onError?: (message: string) => void }) {
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: async (data) => {
      if (data?.user && data?.accessToken) {
        haptics.success();
        await setAuthSession(
          data.user,
          {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
          {
            step: data.onboardingStep || 1,
            isCompleted: data.onboardingCompleted ?? false,
          },
          data.isVerified ?? true
        );
      }
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Incorrect email or password. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}

export function useGoogleAuth(options?: { onError?: (message: string) => void }) {
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (token: string) => authService.googleAuth(token),
    onSuccess: async (data) => {
      if (data?.user && data?.accessToken) {
        haptics.success();
        await setAuthSession(
          data.user,
          {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
          {
            step: data.onboardingStep || 1,
            isCompleted: data.onboardingCompleted ?? false,
          },
          data.isVerified ?? true
        );
      }
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Google authentication failed. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}

export function useRegister(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: () => {
      haptics.success();
      options?.onSuccess?.();
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Unable to create account. Please check your details.'
      );
      options?.onError?.(message);
    },
  });
}

export function useVerifyEmail(options?: {
  password?: string;
  onFallbackNavigateLogin?: () => void;
  onError?: (message: string) => void;
}) {
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const haptics = useHaptics();

  return useMutation({
    mutationFn: async (payload: VerifyEmailPayload) => {
      await authService.verifyEmail(payload);
      if (options?.password) {
        const loginData = await authService
          .login({ email: payload.email, password: options.password })
          .catch(() => null);
        return loginData;
      }
      return null;
    },
    onSuccess: async (loginData) => {
      haptics.success();
      if (loginData?.user && loginData?.accessToken) {
        await setAuthSession(
          loginData.user,
          {
            accessToken: loginData.accessToken,
            refreshToken: loginData.refreshToken,
          },
          {
            step: loginData.onboardingStep || 1,
            isCompleted: loginData.onboardingCompleted ?? false,
          },
          true
        );
        return;
      }
      options?.onFallbackNavigateLogin?.();
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Invalid or expired verification code. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}

export function useSendOtp(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (payload: SendOtpPayload) => authService.sendOtp(payload),
    onSuccess: () => {
      haptics.success();
      options?.onSuccess?.();
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Could not resend verification code. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}

export function useForgotPassword(options?: {
  onSuccess?: (email: string) => void;
  onError?: (message: string) => void;
}) {
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (payload: { email: string }) => authService.forgotPassword(payload),
    onSuccess: (_res, variables) => {
      haptics.success();
      options?.onSuccess?.(variables.email);
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Unable to process password reset. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}

export function useVerifyOtp(options?: {
  onSuccess?: (email: string) => void;
  onError?: (message: string) => void;
}) {
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtp(payload),
    onSuccess: (_res, variables) => {
      haptics.success();
      options?.onSuccess?.(variables.email);
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Invalid or expired code. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}

export function useResetPassword(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const haptics = useHaptics();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
    onSuccess: () => {
      haptics.success();
      options?.onSuccess?.();
    },
    onError: (error) => {
      haptics.error();
      const message = getApiErrorMessage(
        error,
        'Unable to update password. Please try again.'
      );
      options?.onError?.(message);
    },
  });
}
