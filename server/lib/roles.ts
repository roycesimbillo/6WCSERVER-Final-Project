export function isAdmin(user: any) {
  return user?.role === "admin";
}

export function isTeacher(user: any) {
  return user?.role === "teacher";
}

export function isStaff(user: any) {
  return isAdmin(user) || isTeacher(user);
}

export default { isAdmin, isTeacher, isStaff };
