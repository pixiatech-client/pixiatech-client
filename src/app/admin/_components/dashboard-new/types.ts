export enum UserRole {
  ADMINISTRATEUR = 'Administrateur',
  FOURNISSEUR = 'Fournisseur',
  COMMERCIAL = 'Commercial',
}

export enum UserStatus {
  APPROUVE = 'Approuvé',
  EN_ATTENTE = 'En attente',
  REJETE = 'Rejeté',
  SUSPENDU = 'Suspendu',
}

export enum QuoteStatus {
  EN_ATTENTE = 'En attente',
  TRAITE = 'Traité',
  CORBEILLE = 'Corbeille',
  ARCHIVE = 'Archive',
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
