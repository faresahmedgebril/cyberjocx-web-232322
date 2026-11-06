export type ProfileUpdateRole = "user" | "instructor" | "admin";

/**
 * Member rank is an administrator-managed attribute, not a self-service profile field.
 * Keep normal profile edits available to signed-in users while removing self-promotion input.
 */
export function sanitizeProfileUpdate(
  role: ProfileUpdateRole,
  input: Record<string, unknown>,
): Record<string, unknown> {
  if (role === "admin") return { ...input };

  const { memberRank: _memberRank, ...safeInput } = input;
  return safeInput;
}
