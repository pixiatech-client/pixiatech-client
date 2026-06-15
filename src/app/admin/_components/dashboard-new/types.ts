export enum UserRole {
  ADMINISTRATEUR = 'Administrator',
  FOURNISSEUR = 'Supplier',
  COMMERCIAL = 'Commercial',
}

export enum UserStatus {
  APPROUVE = 'Approved',
  EN_ATTENTE = 'Pending',
  REJETE = 'Rejected',
  SUSPENDU = 'Suspended',
}

export enum QuoteStatus {
  EN_ATTENTE = 'pending',
  TRAITE = 'processed',
  RETOURNE = 'returned',
  EN_COURS = 'in_progress',
  CORBEILLE = 'trashed',
  ARCHIVE = 'archive',
}

export interface Quote {
  id: string;
  amount: number;
  status: QuoteStatus;
  date: string;
  userId: string;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  timestamp: string;
  details?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  description?: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  backgroundImage?: string;
  lastLogin: string;
  createdAt: string;
}
