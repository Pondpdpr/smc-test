// Hand-typed rather than a cross-package import: frontend/backend are
// separate npm projects with their own @/ path aliases, so a literal
// import would break tsc's project boundaries and Vite's dev-server file
// access.
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userStatus: UserStatus;
  emailVerifiedAt: string | null;
};
