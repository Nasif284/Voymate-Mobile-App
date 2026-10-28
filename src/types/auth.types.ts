export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isIdentityVerified?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseData {
  user: User;
  isVerified: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number;
  accessToken: string;
  refreshToken: string;
}
