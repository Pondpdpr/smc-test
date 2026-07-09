import { SESSION_DEFAULT_EXPIRY_SECONDS } from '@/domain/base/session/session.constant';

const SESSION_COOKIE_KEY = 'session_token';

export function setRefreshCookie(reply: any, plainToken: string) {
  reply.setCookie(SESSION_COOKIE_KEY, plainToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: SESSION_DEFAULT_EXPIRY_SECONDS,
  });
}

export function getRefreshCookie(req: any): string | null {
  const plainToken = req.cookies[SESSION_COOKIE_KEY];

  return plainToken || null;
}
