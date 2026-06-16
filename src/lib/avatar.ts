export const DEFAULT_ROLE_AVATARS: Record<string, string> = {
  admin: '/bot-avatars/Admin.png',
  commercial: '/bot-avatars/Commercial.png',
  fournisseur: '/bot-avatars/Fournisseur.png',
  prestataire: '/bot-avatars/Fournisseur.png',
};

export function getAvatarUrl(photoURL: string | undefined | null, role: string, displayName: string, size = 96, roleTemplate?: string): string {
  if (photoURL) return photoURL;
  const roleAvatar = DEFAULT_ROLE_AVATARS[role] || (roleTemplate && DEFAULT_ROLE_AVATARS[roleTemplate]);
  if (roleAvatar) return roleAvatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'U')}&background=random&size=${size}`;
}
