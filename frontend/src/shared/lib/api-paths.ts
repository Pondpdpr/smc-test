// Single source of truth for backend route paths, so call sites never embed
// URL string literals and a route rename only needs to happen here.
export const apiPaths = {
  auth: {
    signIn: '/v1/auth/sign-in',
    signUp: '/v1/auth/sign-up',
    verifyEmail: '/v1/auth/verify-email',
    resendVerification: '/v1/auth/resend-verification',
    refresh: '/v1/auth/refresh',
  },
  conversations: {
    list: '/v1/conversations',
    messages: (conversationId: string) => `/v1/conversations/${conversationId}/messages`,
    delete: (conversationId: string) => `/v1/conversations/${conversationId}`,
  },
  chat: {
    stream: '/v1/chat/stream',
    stop: (conversationId: string) => `/v1/chat/stop/${conversationId}`,
    usage: '/v1/chat/usage',
  },
} as const;
