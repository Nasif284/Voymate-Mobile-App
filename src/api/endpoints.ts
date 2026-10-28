export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    SEND_PHONE_OTP: '/auth/send-phone-otp',
    VERIFY_PHONE_OTP: '/auth/verify-phone-otp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/password/forgot',
    RESET_PASSWORD: '/auth/password/reset',
  },

  // Onboarding
  ONBOARDING: {
    PROFILE: '/onboarding/profile',
    TRAVEL_STYLE: '/onboarding/travel-style',
    TRAVEL_PLAN: '/onboarding/travel-plan',
    SOURCE: '/onboarding/source',
  },

  // Users & Discovery
  USERS: {
    ME: '/users/me',
    CARDS: '/users/cards',
    NEARBY: '/users/nearby',
    PROFILE: (userId: string) => `/users/${userId}`,
  },

  // Profile Management
  PROFILE: {
    UPDATE: '/profile',
    AVATAR: '/profile/avatar',
    COVER: '/profile/cover',
    SETTINGS: '/profile/settings',
    VERIFY_DOCS: '/profile/verify/documents',
  },

  // Connections
  CONNECTIONS: {
    LIST: '/connection',
    REQUESTS_ALL: '/connection/requests',
    REQUESTS_INCOMING: '/connection/requests/incoming',
    REQUESTS_SENT: '/connection/requests/sent',
    SEND: '/connection',
    ACCEPT: (id: string) => `/connection/accept/${id}`,
    REJECT: (id: string) => `/connection/reject/${id}`,
    WITHDRAW: (id: string) => `/connection/withdraw/${id}`,
    DISCONNECT: (id: string) => `/connection/disconnect/${id}`,
  },

  // Trips & Itineraries
  TRIPS: {
    LIST: '/trip',
    ACTIVE: '/trip/active',
    UPCOMING: '/trip/upcoming',
    USER_UPCOMING: (userId: string) => `/trip/upcoming/${userId}`,
    PAST: '/trip/past',
    USER_PAST: (userId: string) => `/trip/past/${userId}`,
    CREATE: '/trip',
    UPDATE: (tripId: string) => `/trip/${tripId}`,
    DELETE: (tripId: string) => `/trip/delete/${tripId}`,
    MATCHES: (tripId: string) => `/trip/matches/${tripId}`,
    SEARCH_MATCHES: '/trip/matches/search',
    ALL_MATCHES: '/trip/all-matches',
    MATCH_PROFILE: (matchId: string) => `/trip/matches/profile/${matchId}`,
  },

  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: (conversationId: string) => `/chat/messages/${conversationId}`,
    START_CONVERSATION: '/chat/conversations',
  },

  // Storage (Direct to S3)
  STORAGE: {
    UPLOAD_URL: '/storage/upload-url',
  },

  // Verification & KYC
  VERIFICATION: {
    SUBMIT_ID: '/user/verification/id-document',
    STATUS: '/user/verification/status',
  },

  // Location
  LOCATION: {
    REVERSE_GEOCODE: '/location/reverse-geocode',
    UPDATE: '/location',
    GET: '/location',
  },
} as const;
