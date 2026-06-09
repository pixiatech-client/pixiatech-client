export type UserRole = string;

export enum UserStatus {
  APPROVED = 'Approved',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
  SUSPENDED = 'Suspended',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  description?: string;
  role: UserRole;
  roleName?: string;
  roleColor?: string;
  status: UserStatus;
  avatar: string;
  backgroundImage?: string;
  lastLogin: string;
  createdAt: string;
}
