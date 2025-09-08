export const isSuperAdmin = (user?: { role?: string } | null): boolean => {
  if (!user) return false;
  return String(user.role ?? "").toUpperCase() === "SUPER_ADMIN";
};
