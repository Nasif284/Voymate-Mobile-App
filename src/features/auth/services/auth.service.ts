import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface SendOtpPayload {
  email: string;
  purpose: 'email_verify' | 'password_reset';
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
  purpose: 'email_verify' | 'password_reset';
}

export interface ResetPasswordPayload {
  email: string;
  password: string;
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await apiClient.post(ENDPOINTS.AUTH.LOGIN, payload);
    return res.data?.data || res.data;
  },

  register: async (payload: RegisterPayload) => {
    const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER, payload);
    return res.data?.data || res.data;
  },

  verifyEmail: async (payload: VerifyEmailPayload) => {
    const res = await apiClient.post(ENDPOINTS.AUTH.VERIFY_EMAIL, payload);
    return res.data?.data || res.data;
  },

  sendOtp: async (payload: SendOtpPayload) => {
    const res = await apiClient.post(ENDPOINTS.AUTH.SEND_OTP, payload);
    return res.data?.data || res.data;
  },

  forgotPassword: async (payload: { email: string }) => {
    const res = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
    return res.data?.data || res.data;
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    const res = await apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, payload);
    return res.data?.data || res.data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const res = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    return res.data?.data || res.data;
  },
};
