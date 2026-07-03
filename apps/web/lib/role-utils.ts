import { UserRole } from '@/types';

export function isTeacher(role: UserRole): boolean {
  return role === UserRole.TEACHER;
}

export function isStudent(role: UserRole): boolean {
  return role === UserRole.STUDENT;
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function getRoleLabel(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
