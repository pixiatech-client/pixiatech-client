/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Pack {
  id: string;
  name: string;
  surface: string;
  price: number; // monthly VAT inc (TTC)
  deposit: number; // Security deposit (TTC)
  description: string;
  specs: string[];
}

export interface RenterDetails {
  company: string;
  representative: string;
  address: string;
  postcode: string;
  city: string;
  email: string;
  phone: string;
}

export interface ContractState {
  isAccepted: boolean;
  isValidated: boolean;
  signedAt: string | null;
  signatureSvg: string | null; // signature path coordinates or SVG string
}

export type StepId = 'pack' | 'connexion' | 'informations' | 'contrat' | 'securite' | 'paiement' | 'confirmation';

export interface Step {
  id: StepId;
  label: string;
  isCompleted: boolean;
  isActive: boolean;
}
