'use client';

import React from 'react';
import type { Language } from '../pixiatech-translations';

export interface ConsultationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  companyName?: string;
  lang?: Language;
}

/** Formulaire de consultation désactivé et supprimé définitivement de tout le site. */
export const ConsultationModal: React.FC<ConsultationModalProps> = () => null;
