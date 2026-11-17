import { Role } from '@/shared/domain';

export type StudioTab = 'articles' | 'mentorship' | 'workshops';

export function canAccessExpertStudio(role: Role): boolean {
  return role === Role.PHOTOGRAPHY_EXPERT || role === Role.ADMIN;
}

export function countCheckedInAttendees(
  attendees: readonly { readonly checkedIn: boolean }[],
): number {
  return attendees.filter((a) => a.checkedIn).length;
}
