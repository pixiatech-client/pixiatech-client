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
