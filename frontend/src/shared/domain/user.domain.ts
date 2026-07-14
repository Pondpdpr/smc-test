// Hand-typed, not a cross-package import - frontend/backend are separate npm
// projects with their own @/ aliases, so a literal import would break both.
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userStatus: UserStatus;
  emailVerifiedAt: string | null;
};
