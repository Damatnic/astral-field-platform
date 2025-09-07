import type { NextApiRequest } from "next";

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

export interface AuthResult {
  user: AuthUser | null;
  error?: string;
}

export async function verifyApiAuth(req: NextApiRequest): Promise<AuthResult> {
  try {
    const authHeader = req.headers.authorization as string | undefined;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "No authentication token provided" };
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return { user: null, error: "Invalid authentication token" };

    // Development mock. Replace with real JWT/session validation in prod.
    const mockUser: AuthUser = {
      id: "user_123",
      email: "user@example.com",
      username: "testuser",
      role: "user",
    };

    return { user: mockUser };
  } catch {
    return { user: null, error: "Invalid authentication token" };
  }
}

export async function requireApiAuth(req: NextApiRequest): Promise<AuthUser> {
  const { user, error } = await verifyApiAuth(req);
  if (!user) throw new Error(error || "Authentication required");
  return user;
}

export async function validateAdminAccess(
  req: NextApiRequest,
): Promise<boolean> {
  const { user } = await verifyApiAuth(req);
  return user?.role === "admin";
}

export default {
  verifyApiAuth,
  requireApiAuth,
  validateAdminAccess,
  authenticateUser: verifyApiAuth,
};
