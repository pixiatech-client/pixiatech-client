
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUsers, updateQuoteStatus } from '@/app/admin/actions';
import type { UserProfile, QuoteRequest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TransmitToSupplierDialogProps {
  quotes: QuoteRequest[];
  children: React.ReactNode;
  onSuccess: () => void;
}

export function TransmitToSupplierDialog({ quotes, children, onSuccess }: TransmitToSupplierDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fournisseurs, setFournisseurs] = useState<UserProfile[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getUsers({ limit: 1000 })
        .then(({ users }) => {
          setFournisseurs(users.filter(u => u.role === 'fournisseur'));
        })
        .catch(() => {
          setFournisseurs([]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleTransmitSubmit = async () => {
    if (quotes.length === 0 || !selectedSupplierId) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un fournisseur et des estimations.", variant: "destructive" });
      return;
    }

    try {
      await Promise.all(
        quotes.map(quote =>
          updateQuoteStatus(quote.id, { supplierId: selectedSupplierId, status: 'in_progress' })
        )
      );
      toast({ title: "Succès", description: `${quotes.length} estimation(s) envoyée(s) au fournisseur.`, variant: "success" });
      onSuccess();
      setIsOpen(false);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de transmettre les estimations.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer au fournisseur</DialogTitle>
          <DialogDescription>
            Sélectionnez un fournisseur pour lui assigner {quotes.length > 1 ? `les ${quotes.length} estimations sélectionnées` : `l'estimation`}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? 'Chargement...' : 'Choisir un fournisseur...'} />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin inline-flex" />
                </div>
              ) : fournisseurs.length > 0 ? (
                fournisseurs.map(f => (
                  <SelectItem key={f.uid} value={f.uid}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={f.photoURL} />
                        <AvatarFallback>{f.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{f.displayName}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">Aucun fournisseur trouvé.</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button onClick={handleTransmitSubmit} disabled={!selectedSupplierId || isLoading}>
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
