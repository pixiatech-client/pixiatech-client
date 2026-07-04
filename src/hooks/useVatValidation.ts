'use client';

import { useState, useCallback } from 'react';

export type VatStatus = 'idle' | 'valid' | 'invalid' | 'error';

export interface VatValidationResult {
  vatValidated: boolean;
  vatValidating: boolean;
  vatStatus: VatStatus;
  vatErrorMessage: string;
  validate: (vatNumber: string) => Promise<VatStatus>;
  reset: () => void;
}

export function useVatValidation(): VatValidationResult {
  const [vatValidated, setVatValidated] = useState(false);
  const [vatValidating, setVatValidating] = useState(false);
  const [vatStatus, setVatStatus] = useState<VatStatus>('idle');
  const [vatErrorMessage, setVatErrorMessage] = useState('');

  const validate = useCallback(async (vatNumber: string): Promise<VatStatus> => {
    if (!vatNumber) {
      console.log('[VAT] Aucun numéro saisi');
      return 'idle';
    }

    console.log('[VAT] Bouton Valider cliqué');
    console.log('[VAT] Numéro saisi :', vatNumber);

    setVatValidating(true);
    setVatStatus('idle');
    setVatErrorMessage('');

    try {
      console.log('[VAT] Requête envoyée à VIES');

      const res = await fetch('/api/boutique/validate-vat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatNumber }),
      });

      const data = await res.json();

      console.log('[VAT] Réponse reçue : valid =', data.valid);

      if (data.valid === true) {
        setVatValidated(true);
        setVatStatus('valid');
        console.log('[VAT] ✓ Numéro valide');
        return 'valid';
      } else {
        setVatValidated(false);
        setVatStatus('invalid');
        setVatErrorMessage('Numéro de TVA invalide');
        console.log('[VAT] ✗ Numéro invalide');
        return 'invalid';
      }
    } catch (err: any) {
      setVatValidated(false);
      setVatStatus('error');
      setVatErrorMessage('Impossible de vérifier le numéro pour le moment. Veuillez réessayer plus tard.');
      console.log('[VAT] Erreur :', err.message);
      return 'error';
    } finally {
      setVatValidating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setVatValidated(false);
    setVatStatus('idle');
    setVatErrorMessage('');
  }, []);

  return {
    vatValidated,
    vatValidating,
    vatStatus,
    vatErrorMessage,
    validate,
    reset,
  };
}
