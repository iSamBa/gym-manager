/**
 * User interface expected by MainLayout component
 */
export interface LayoutUser {
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Converts a user object to the format expected by MainLayout
 * Extracts user data and maps it to { name, email, avatar } format
 */
export function mapUserForLayout(
  user: Record<string, unknown> | null
): LayoutUser | undefined {
  if (!user) {
    return undefined;
  }

  return {
    name:
      user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : (user.email as string) || "Unknown User",
    email: (user.email as string) || "",
    avatar: (user.avatar_url as string) || undefined,
  };
}
