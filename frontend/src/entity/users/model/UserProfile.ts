import type { UserPlan } from './UserPlan';
import type { UserRole } from './UserRole';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  plan?: UserPlan;
}
