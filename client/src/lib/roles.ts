type UserLike = { role?: string } | null | undefined;

export function isAdmin(user: UserLike): boolean {
  return !!(user && user.role === "admin");
}

export function isTeacher(user: UserLike): boolean {
  return !!(user && user.role === "teacher");
}

export function isStaff(user: UserLike): boolean {
  return isAdmin(user) || isTeacher(user);
}

export default { isAdmin, isTeacher, isStaff };
