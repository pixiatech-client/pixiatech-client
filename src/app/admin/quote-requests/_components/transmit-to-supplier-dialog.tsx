
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
import { useAdminT } from '@/hooks/useAdminT';

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
  const { t } = useAdminT();

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
      toast({ title: t("Error"), description: t("Please select a supplier and estimations."), variant: "destructive" });
      return;
    }

    try {
      await Promise.all(
        quotes.map(quote =>
          updateQuoteStatus(quote.id, { supplierId: selectedSupplierId, status: 'in_progress' })
        )
      );
      toast({ title: t("Success"), description: t(`${quotes.length} estimation(s) sent to supplier.`), variant: "success" });
      onSuccess();
      setIsOpen(false);
    } catch (e: any) {
      toast({ title: t("Error"), description: e.message || t("Unable to transmit the estimations."), variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Send to supplier")}</DialogTitle>
          <DialogDescription>
            {t("Select a supplier to assign")} {quotes.length > 1 ? t(`the ${quotes.length} selected estimations`) : t("the estimation")} {t("to.")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? t('Loading...') : t('Choose a supplier...')} />
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
                <div className="p-4 text-center text-sm text-muted-foreground">{t("No supplier found.")}</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t("Cancel")}</Button>
          <Button onClick={handleTransmitSubmit} disabled={!selectedSupplierId || isLoading}>
            {t("Send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
